const search = (function () {
    const _container = document.getElementsByClassName('container')[0];
    const _searchPage = _container.getElementsByClassName('page search')[0];
    const _view = _searchPage.getElementsByClassName('view')[0];
    const _head = _view.getElementsByClassName('head')[0];
    const _backBtn = _head.getElementsByClassName('btn btn-back-page')[0];
    const _searchBtn = _head.getElementsByClassName('btn btn-search')[0];
    const _searchBarInput = _head.getElementsByClassName('search-bar-input')[0];
    const _searchListDiv = _view.getElementsByClassName('search-list')[0];

    let _searchResList = []; /** 搜索结果列表，用于前台展示 */

    /** 生成搜索项元素 */
    function __createSearchItemElement(url, bookName, authorName, latestChapterName, sourceName, sourceUrl) {
        const domStr = `<div class='item btn' url='${url}' source_url='${sourceUrl}' >《${bookName}》 <br>作者：${authorName} <br>最新章节：${latestChapterName} <br>书源名：${sourceName}</div>`
        const div = document.createElement('div');
        div.innerHTML = domStr;
        const itemDom = div.children[0]; /*生成节点元素*/
        itemDom.addEventListener('click', async (e)=>{
            if(e.target.classList.contains('item')){
                const url = e.target.getAttribute('url');
                const sourceUrl = e.target.getAttribute('source_url');
                const infoObj = await __requestParseInfo(url, sourceUrl);
                /*渲染，然后 切换到书籍详情页面*/
                info.renderer(infoObj);
                utils.gotoPage('info');
            }
        });
        return itemDom;
    }

    /** 排序搜索结果列表 */
    function __sortSearchResList(){
        _searchResList.sort((book1, book2) => {
            const name1 = book1.name;
            const name2 = book2.name;
            const searchKey = book1.searchKey;
            return name1.indexOf(searchKey) - name2.indexOf(searchKey)
        });
    }

    /** 制作搜索列表，并更新到界面上 */
    function __rendererSearchResList() {
        _searchListDiv.innerHTML = '';/*清空当前搜索列表*/
        __sortSearchResList();
        for (const s of _searchResList) {
            const itemDom = __createSearchItemElement(s['href'], s['name'], s['author'], s['latestChapter'], s['sourceName'], s['sourceUrl']);
            _searchListDiv.append(itemDom);
        }
    }

    /** 解析书籍详情页面 */
    function __parseInfo(htmlDom, source){
        const info = source.info;
        const getNameFunc = new Function('const html = arguments[0]; ' + info.name);
        const getAuthorFunc = new Function('const html = arguments[0]; ' + info.author);
        const getIntroFunc = new Function('const html = arguments[0]; ' + info.intro);
        const getLatestChapterFunc = new Function('const html = arguments[0]; ' + info.latestChapter);
        const getTocUrlFunc = new Function('const html = arguments[0]; ' + info.tocUrl);
        const name = getNameFunc(htmlDom), author = getAuthorFunc(htmlDom), intro = getIntroFunc(htmlDom), 
            latestChapter = getLatestChapterFunc(htmlDom), tocUrl = getTocUrlFunc(htmlDom);
        const tocDom = ((tocUrl == 'LOCAL_URL')?htmlDom:null);
        return {name, author, intro, latestChapter, tocUrl, tocDom};
    }

    /** 请求，然后解析详情页面 */
    async function __requestParseInfo(_infoUrl, _sourceUrl){
        /*请求书籍详情页面*/
        let source = null;
        for(const s of sourceManager.sourceList){ if(s.sourceUrl == _sourceUrl){ source = s; } }
        const resStr = await local.request(_infoUrl, 'GET', { header: null, body: null, encode: source.default.encoding });
        /*解析书籍详情页面*/
        const htmlDom = utils.str2html(resStr);
        const infoObj = __parseInfo(htmlDom, source);
        infoObj.source = source;
        infoObj.url = _infoUrl;
        console.log("书籍详情信息：", infoObj);

        return infoObj;
    }


    /** 负责解析请求到的搜索页面，将其转换为搜索结果的书籍列表 和 是否有下一页标志 */
    function __parseSearch(htmlDom, source, searchKey) {
        const search = source.search;
        const sourceName = source.sourceName;
        const sourceUrl = source.sourceUrl;
        const getListFunc = new Function('const html = arguments[0]; ' + search.list);
        const getAuthorFunc = new Function('const html = arguments[0]; ' + search.author);
        const getHrefFunc = new Function('const html = arguments[0]; ' + search.href);
        const getNameFunc = new Function('const html = arguments[0]; ' + search.name);
        const getLatestChapterFunc = new Function('const html = arguments[0]; ' + search.latestChapter);
        const getNextUrlFunc = new Function('const html = arguments[0]; ' + search.nextUrl);

        const searchItems = getListFunc(htmlDom);
        const searchBookList = [];
        if (searchItems && searchItems.length > 0) {
            for (const bookDom of searchItems) {
                const name = getNameFunc(bookDom), author = getAuthorFunc(bookDom), href = getHrefFunc(bookDom), latestChapter = getLatestChapterFunc(bookDom);
                searchBookList.push({ name, author, href, latestChapter, sourceName, sourceUrl, searchKey });
            }
        }
        const nextUrl = getNextUrlFunc(htmlDom);

        return { searchBookList, nextUrl };
    }

    /** 请求并解析搜索页面，返回该书源的搜索列表 */
    async function __requestParseSearch(key, source) {
        const requestRule = source.search.request;
        const url = utils.formatStr(requestRule.url, { searchKey: key });
        let postBody = requestRule.postBody; /*POST请求需要BODY*/
        let requestType = requestRule.type || 'GET'; /*请求类型，默认GET*/
        
        if(requestType.constructor && requestType.constructor == String){
            requestType = requestType.toUpperCase(); 
        }else{
            console.log('requestType 不是 字符串类型，返回空数组');
            return []; 
        }
        if (requestType == 'POST') {
            postBody = JSON.parse(utils.formatStr(JSON.stringify(postBody), { searchKey: key }));
        }
        const encode = requestRule.encoding || 'utf-8';
        const resStr = await local.request(url, requestType, { header: source.default.header, body: (postBody || null), encode: encode });
        await utils.asleep(1000);
        const dom = utils.str2html(resStr); // parseHtml(resStr);
        let searchList = [];
        let nextUrl = null;
        try {
            const ps = __parseSearch(dom, source, key);
            searchList = ps.searchBookList;
            nextUrl = ps.nextUrl;
        } catch (err) {
            console.log('解析搜索DOM失败，[' + source.sourceName + ":" + source.sourceUrl + ']书源出错，返回空数组.');
            return [];
        }
        if (nextUrl) {
            /* 存在下一页 */
            await utils.asleep(1000); //休眠1秒，从而避免被检测到爬虫而封IP
            const nextUrlSource = JSON.parse(JSON.stringify(source));
            nextUrlSource.search.request.url = nextUrl;
            nextUrlSource.search.request.type = 'GET';
            const nextSearchList = await __requestParseSearch(key, nextUrlSource);
            searchList = searchList.concat(nextSearchList);
        }
        return searchList;
    }

    /** 获取生效的书源插件，循环请求书源列表 */
    async function* search(key) {
        for (const source of sourceManager.sourceList) {
            console.log('[*search] 请求: ' + key + '，书源: ' + source.sourceName);
            const searchList = await __requestParseSearch(key, source);
            console.log('get a search list，list length is ', searchList.length);
            yield { searchList: searchList, source: source };
        }
        return 0;
    }


    _searchBtn.addEventListener('click', async (e) => {
        const searchKey = _searchBarInput.value;
        if (searchKey.length && searchKey.length > 0) {
            console.log('搜索按钮被点击', searchKey);
            _searchResList = []; /*清空上一次搜索列表*/
            const searchYield = search(searchKey);
            /*循环发送请求*/
            while (true) {
                const y = await searchYield.next();
                if (y.done) { break; }
                const __bookList = y.value.searchList;
                _searchResList = _searchResList.concat(__bookList); /*将新获得的书籍列表并入搜索结果列表中*/
                console.log("搜索结果：", __bookList);
                __rendererSearchResList(); /*渲染搜索结果*/
            }

            /*处理返回网址*/
        } else {
            console.log('搜索输入框没有内容，停止搜索，请检查');
        }
    });

    _backBtn.addEventListener('click', (e) => {
        utils.backPage();
    });

    return {
        getSearchList: ()=>{return _searchResList;},
        requestParseInfo: __requestParseInfo
    }
})();

