const search = (function () {
    const _container = document.getElementsByClassName('container')[0];
    const _searchPage = _container.getElementsByClassName('page search')[0];
    const _view = _searchPage.getElementsByClassName('view')[0];
    const _head = _view.getElementsByClassName('head')[0];
    const _backBtn = _head.getElementsByClassName('btn btn-back-page')[0];
    const _searchBtn = _head.getElementsByClassName('btn btn-search')[0];
    const _searchBarInput = _head.getElementsByClassName('search-bar-input')[0];
    const _searchListDiv = _view.getElementsByClassName('search-list')[0];

    function __createSearchItemElement(url, bookName, authorName, latestChapterName, sourceName) {

        const domStr = `<div class="item btn" url="${url} ">《<span>${bookName}</span>》, ${authorName}, ${latestChapterName}, ${sourceName}</div>`
        const div = document.createElement('div');
        div.innerHTML = domStr;
        const itemDom = div.children[0]; /*生成节点元素*/
        // const bookNameSpan = document.createElement('span');
        // const authorNameSpan = document.createElement('span');
        // const latestChapterNameSpan = document.createElement('span');
        // const sourceNumSpan = document.createElement('span');
        // div.classList.add('item', 'btn');
        // bookNameSpan.innerText = bookName; authorNameSpan.innerText = authorName || "佚名";
        // latestChapterNameSpan.innerText = latestChapterName || "无"; sourceNumSpan.innerText = sourceNum;
        // div.innerHTML = "《" + bookNameSpan.outerHTML + "》  作者：" + authorNameSpan.outerHTML
        //     + "  最新章节：" + latestChapterNameSpan.outerHTML + "  书源数量：" + sourceNumSpan.outerHTML;
        return itemDom;
    }


    /** 制作搜索列表，并更新到界面上 */
    function __rendererSearchTable(searchList) {
        _searchListDiv.innerHTML = '';/*清空当前搜索列表*/
        for (const s of searchList) {
            const itemDom = __createSearchItemElement(s['url'], s['name'], s['author'], s['latestChapter'], s['sourceName']);
            _searchListDiv.append(itemDom);
        }
    }



    /** 负责解析请求到的搜索页面，将其转换为搜索结果的书籍列表 和 是否有下一页标志 */
    function __parseSearch(htmlDom, search) {
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
                const name = getNameFunc(bookDom), author = getAuthorFunc(bookDom), href = getHrefFunc(htmlDom), latestChapter = getLatestChapterFunc(bookDom);
                searchBookList.push({ name, author, href, latestChapter });
            }
        }
        const nextUrl = getNextUrlFunc(htmlDom);

        return { searchBookList, nextUrl };
    }

    /** 请求并解析搜索页面，返回该书源的搜索列表 */
    async function __requestParseSearch(key, source) {
        const search = source.search;
        const requestRule = search.request;

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
        const resStr = await local.request(url, requestType, { header: source.header, body: (postBody || null), encode: encode });
        await utils.asleep(1000);
        const dom = utils.str2html(resStr); // parseHtml(resStr);
        let searchList = [];
        let nextUrl = null;
        try {
            const ps = __parseSearch(dom, search);
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
            console.log('get a search list:', searchList);
            yield { searchList: searchList, source: source };
        }
        return 0;
    }


    _searchBtn.addEventListener('click', async (e) => {
        const searchKey = _searchBarInput.value;
        if (searchKey.length && searchKey.length > 0) {
            console.log('搜索按钮被点击', searchKey);
            const searchYield = search(searchKey);
            /*循环发送请求*/
            while (true) {
                const y = await searchYield.next();
                if (y.done) { break; }
                const val = y.value;
                console.log("搜索结果：", val);
            }

            /*处理返回网址*/
        } else {
            console.log('搜索输入框没有内容，停止搜索，请检查');
        }
    });

    _backBtn.addEventListener('click', (e) => {
        utils.backPage();
    });

    return {}
})();

