const info = (function () {
    const _infoPage = document.getElementsByClassName('page info')[0];
    const _view = _infoPage.getElementsByClassName('view')[0];
    const _head = _view.getElementsByClassName('head')[0];
    const _body = _view.getElementsByClassName('body')[0];
    const _foot = _view.getElementsByClassName('foot')[0];

    const _backBtn = _head.getElementsByClassName('btn-back-page')[0];
    const _addShelfBtn = _foot.getElementsByClassName('add-shelf')[0]; /*加入书架按钮*/
    const _changeSourceBtn = _body.getElementsByClassName('change_source')[0];
    const _showTocBtn = _body.getElementsByClassName('show_toc')[0];
    const _downloadBtn = _foot.getElementsByClassName('download-book')[0];
    const _readBtn = _foot.getElementsByClassName('read-book')[0];
    const _deleteBookBtn = _head.getElementsByClassName('delete-from-shelf')[0];

    const _bookNameElement = _body.getElementsByClassName('book_name')[0];
    const _bookAuthorElement = _body.getElementsByClassName('book_author')[0];
    const _sourceNameElement = _body.getElementsByClassName('source_name')[0];
    const _bookLatestChapterElement = _body.getElementsByClassName('book_latest_chapter')[0];
    const _bookIntroElement = _body.getElementsByClassName('book_intro')[0];

    let __curInfo = null;

    function __setCurrentInfo(_infoObj) {
        __curInfo = _infoObj;
    }
    function __getCurrentInfo() {
        return __curInfo;
    }

    /** 渲染前端详情页面数据 */
    function __rendererInfo(__infoObj) {
        if (__infoObj) { __setCurrentInfo(__infoObj); } /*如果提供了参数，则用参数的对象给当前书籍详情对象赋值，否则用之前的*/
        const infoObj = __getCurrentInfo();
        _bookNameElement.innerText = infoObj.name;
        _bookAuthorElement.innerText = infoObj.author;
        _bookLatestChapterElement.innerText = infoObj.latestChapter || infoObj.latest_chapter;
        _bookIntroElement.innerText = infoObj.intro;
        _sourceNameElement.setAttribute('url', infoObj.source.sourceUrl);
        _sourceNameElement.innerText = infoObj.source.sourceName;
    }

    /** 设置当前书籍详情页正在读的书籍的正在读的章节网址 */
    async function __setCurInfoReadTocUrl(tocUrl) {
        __curInfo.read_toc_url = tocUrl;
        const bookUrl = __getCurrentInfo().url;
        await shelfManager.setBookReadTocUrl(bookUrl, tocUrl); 
        /** 将toc页面的read */
        // toc.freshViewReadingToc(tocUrl);
    }

    /** 读取当前书籍详情页正在读的书籍的正在读的章节网址 */
    function __getCurInfoReadTocUrl() {
        return __curInfo ? __curInfo.read_toc_url : null;
    }

    /** 生成书源选择列表，选择相应的书源，然后重刷INFO页面 */
    function __createSourceListDialog(_sourceList) {
        const domParser = new DOMParser()
        const dialogDiv = domParser.parseFromString('<div class="dialog menu"></div>', 'text/html').body.children[0];
        for (const book of _sourceList) {
            const itemElement = domParser.parseFromString(`<div class="btn" url='${book.href}' source_url='${book.sourceUrl}'>${book.name} - ${book.latestChapter} - ${book.sourceName}</div>`, 'text/html').body.children[0];
            itemElement.addEventListener('click', async (e) => {
                const url = e.target.getAttribute('url');
                const sourceUrl = e.target.getAttribute('source_url');
                const infoObj = await search.requestParseInfo(url, sourceUrl);
                /** 渲染新的书籍详情页面，然后隐藏弹窗层 */
                __rendererInfo(infoObj);
                utils.hideDialogLayer();
            });
            dialogDiv.append(itemElement);
        }
        const backBtnElement = domParser.parseFromString(`<div class="btn btn-back-page">返回</div>`, 'text/html').body.children[0];
        backBtnElement.addEventListener('click', (e) => { utils.hideDialogLayer(); });
        dialogDiv.append(backBtnElement);
        return dialogDiv;
    }

    /** 解析章节列表页面 */
    function parseToc(htmlDom, source) {
        const toc = source.toc;
        const getListFunc = new Function('const html = arguments[0]; ' + toc.list);
        const getNameFunc = new Function('const html = arguments[0]; ' + toc.name);
        const getHrefFunc = new Function('const html = arguments[0]; ' + toc.href);
        const getNextUrlFunc = new Function('const html = arguments[0]; ' + toc.nextUrl);
        const list = getListFunc(htmlDom), nextUrl = getNextUrlFunc(htmlDom);
        const tocObjList = [];
        for (const chapterDom of list) {
            const name = getNameFunc(chapterDom), href = getHrefFunc(chapterDom);
            tocObjList.push({ name, href });
        }
        return [tocObjList, nextUrl];
    }

    /** 请求，并解析章节列表页面 */
    async function __requestParseToc(_bookUrl, _tocUrl, _source, _tocPreDom = null) {
        let tocDom = _tocPreDom;
        if (_tocUrl == 'LOCAL_URL' && _tocPreDom == null) {
            _tocUrl = _bookUrl;
        }
        if (_tocUrl != 'LOCAL_URL') {
            /** 请求章节列表页面 */
            const resStr = await local.request(_tocUrl, 'GET', { header: _source.default.header, body: null, encode: _source.default.encoding });
            tocDom = utils.str2html(resStr);
        }
        let [tocObjList, nextUrl] = parseToc(tocDom, _source);
        let nextUrlTocObjList = [];
        if (nextUrl) {
            nextUrlTocObjList = __requestParseToc(_bookUrl, nextUrl, _source, null);
        }
        tocObjList = tocObjList.concat(nextUrlTocObjList);
        return tocObjList;
    }

    /** 解析当前书籍详情页，获取章节列表 */
    async function __getCurBookInfoOfTocList() {
        const _infoObj = __getCurrentInfo();
        const tocUrl = _infoObj.tocUrl;
        const source = _infoObj.source;
        const tocDom = _infoObj.tocDom;
        const bookUrl = _infoObj.url;

        const shelfBook = await shelfManager.getBookInoByUrl(bookUrl);
        if (shelfBook) {
            /** 这个书籍信息是书架上的书，所以数据库里已经有留存章节列表 */
            return await shelfManager.getTocListByBookUrl(bookUrl);
        } else {
            return await __requestParseToc(bookUrl, tocUrl, source, tocDom);
        }
    }

    _showTocBtn.addEventListener('click', async (e) => {
        const _infoObj = __getCurrentInfo();
        const source = _infoObj.source;
        const _tocObjList = await __getCurBookInfoOfTocList();
        toc.renderer(_tocObjList, source);
        // toc.freshViewReadingToc(__getCurInfoReadTocUrl());
        utils.gotoPage('toc');
    });

    _changeSourceBtn.addEventListener('click', (e) => {
        const curBookName = _bookNameElement.innerText;
        const sourceList = [];
        for (const book of search.getSearchList()) {
            if (book.name == curBookName) {
                /*同名书籍，纳入书源列表*/
                sourceList.push(book);
            }
        }
        const __dialogDiv = __createSourceListDialog(sourceList);
        const dialog = utils.clearDialogLayer();
        dialog.append(__dialogDiv);
        utils.showDialogLayer();
    });

    /** 返回按钮点击事件 */
    _backBtn.addEventListener('click', (e) => { utils.backPage(); });

    /** 加入书架按钮点击事件 */
    _addShelfBtn.addEventListener('click', async (e) => {
        /*获取当前书籍详情*/
        const _bookInfo = __getCurrentInfo();
        const _infoUrl = _bookInfo.url; /*根据网址来判断是否存在*/
        const shelfBooks = await shelfManager.getAllBook();
        let haveThisBookInShelf = false;
        for (const b of shelfBooks) {
            if (b['url'] == _infoUrl) {
                haveThisBookInShelf = true;
            }
        }
        if (haveThisBookInShelf) {
            utils.log('info._addShelfBtn.点击事件', '书架上已经有了这本书了，URL还一样，无需重复加入书架');
            alert('书架上已经有了这本书了，URL还一样，无需重复加入书架');
            return false;
        }
        const _tocObjList = await __requestParseToc(_bookInfo.url, _bookInfo.tocUrl, _bookInfo.source, _bookInfo.tocDom); /章节列表，不包含内容/
        if (_tocObjList.length <= 0) {
            utils.log('info._addShelfBtn.点击事件', '请求的章节列表为空数组，无法加入书架中');
            return false;
        }
        /** 如果ReadTocUrl为空，将其设定为第一个章节 */
        if (!__getCurInfoReadTocUrl()) {
            __setCurInfoReadTocUrl(_tocObjList[0].href);
        }
        await shelfManager.addBook(_bookInfo);
        await shelfManager.removeBookAllToc(_infoUrl);
        await shelfManager.addBookAllToc(_infoUrl, _tocObjList); /*将章节列表存放章节表中，并且状态为未下载状态*/
    });

    _downloadBtn.addEventListener('click', async (e) => {
        const _bookInfo = __getCurrentInfo();
        const _bookUrl = _bookInfo.url; /*书籍网址*/
        const shelfBooks = await shelfManager.getAllBook();
        let haveThisBookInShelf = false;
        for (const b of shelfBooks) {
            console.log(b);
            if (b['url'] == _bookUrl) {
                haveThisBookInShelf = true;
            }
        }
        if (haveThisBookInShelf) {
            const tocNum = await shelfManager.setBookAllTocToDownload(_bookUrl);
            utils.log('info._downloadBtn.点击事件', `书架上已经有了这本书了，URL还一样，将书籍的章节(${tocNum}个)全部调整为等待下载状态`);
            return true;
        } else {
            utils.log('info._downloadBtn.点击事件', '书架上还没有这本书，不能触发章节缓存');
            alert('书架上还没有这本书，不能触发章节缓存，请先将书籍放入书架');
            return false;
        }
    });

    _readBtn.addEventListener('click', async (e) => {

        const bookInfo = __getCurrentInfo();
        console.log('开始阅读：《' + bookInfo.name + '》');
        const _tocObjList = await __getCurBookInfoOfTocList();
        if (!__getCurInfoReadTocUrl()) {
            if(_tocObjList.length > 0){
                __setCurInfoReadTocUrl( _tocObjList[0].href );
            }else {
                utils.log("当前书籍没有解析到章节列表，请更换书源");
                return false;
            }
        }
        const readTocUrl = __getCurInfoReadTocUrl();
        const readTocName = (()=>{ for(const toc of _tocObjList){ if(toc.href == readTocUrl){ return toc.name; } }return '未获取章节名'; })();
        toc.renderer(_tocObjList, bookInfo.source);
        const _contentText = await toc.getContentByTocUrl(readTocUrl, bookInfo.source.sourceUrl); 
        // toc.freshViewReadingToc(readTocUrl);
        content.renderer(_contentText, readTocName, bookInfo.name);
        utils.gotoPage('content');
    });

    _deleteBookBtn.addEventListener('click', async ()=>{
        const _bookUrl = info.getCurrentInfo().url;
        const shelfBooks = await shelfManager.getAllBook();
        let haveThisBookInShelf = false;
        for (const b of shelfBooks) {
            console.log(b);
            if (b['url'] == _bookUrl) {
                haveThisBookInShelf = true;
            }
        }
        if(haveThisBookInShelf){
            await shelfManager.deleteBookFromShelf(_bookUrl);
            alert("书架上的书籍已被删除：" + _bookUrl);
        }
    });

    return {
        renderer: __rendererInfo,
        setCurrentInfo: __setCurrentInfo,
        getCurrentInfo: __getCurrentInfo,
        setCurInfoReadTocUrl: __setCurInfoReadTocUrl,
        getCurInfoReadTocUrl: __getCurInfoReadTocUrl
    }
})();