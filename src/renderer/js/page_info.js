
const info = (function(){
    const _infoPage = document.getElementsByClassName('page info')[0];
    const _view = _infoPage.getElementsByClassName('view')[0];
    const _head = _view.getElementsByClassName('head')[0];
    const _body = _view.getElementsByClassName('body')[0];
    const _foot = _view.getElementsByClassName('foot')[0];

    const _backBtn = _head.getElementsByClassName('btn-back-page')[0];
    const _changeSourceBtn = _body.getElementsByClassName('change_source')[0];
    const _showTocBtn = _body.getElementsByClassName('show_toc')[0];

    const _bookNameElement = _body.getElementsByClassName('book_name')[0];
    const _bookAuthorElement=_body.getElementsByClassName('book_author')[0];
    const _sourceNameElement = _body.getElementsByClassName('source_name')[0];
    const _bookLatestChapterElement=_body.getElementsByClassName('book_latest_chapter')[0];
    const _bookIntroElement = _body.getElementsByClassName('book_intro')[0];

    let __curInfo = null;

    function __setCurrentInfo(_infoObj){
        __curInfo = _infoObj;
    }
    function __getCurrentInfo(){
        return __curInfo;
    }



    /** 渲染前端详情页面数据 */
    function __rendererInfo(__infoObj){
        if(__infoObj){ __setCurrentInfo(__infoObj); } /*如果提供了参数，则用参数的对象给当前书籍详情对象赋值，否则用之前的*/
        const infoObj = __getCurrentInfo();
        _bookNameElement.innerText = infoObj.name;
        _bookAuthorElement.innerText=infoObj.author;
        _bookLatestChapterElement.innerText=infoObj.latestChapter;
        _bookIntroElement.innerText=infoObj.intro;
        _sourceNameElement.setAttribute('url', infoObj.source.sourceUrl);
        _sourceNameElement.innerText = infoObj.source.sourceName;
    }

    /** 生成书源选择列表，选择相应的书源，然后重刷INFO页面 */
    function __createSourceListDialog(_sourceList){
        const domParser = new DOMParser()
        const dialogDiv = domParser.parseFromString('<div class="dialog menu"></div>','text/html').body.children[0];
        for(const book of _sourceList){
            const itemElement = domParser.parseFromString(`<div class="btn" url='${book.href}' source_url='${book.sourceUrl}'>${book.name} - ${book.latestChapter} - ${book.sourceName}</div>`,'text/html').body.children[0];
            itemElement.addEventListener('click', async (e)=>{
                const url = e.target.getAttribute('url');
                const sourceUrl = e.target.getAttribute('source_url');
                const infoObj = await search.requestParseInfo(url, sourceUrl);
                /** 渲染新的书籍详情页面，然后隐藏弹窗层 */
                __rendererInfo(infoObj);
                utils.hideDialogLayer();
            });
            dialogDiv.append(itemElement);
        }
        const backBtnElement = domParser.parseFromString(`<div class="btn btn-back-page">返回</div>`,'text/html').body.children[0];
        backBtnElement.addEventListener('click', (e)=>{ utils.hideDialogLayer(); });
        dialogDiv.append(backBtnElement);
        return dialogDiv;
    }

    /** 解析章节列表页面 */
    function parseToc(htmlDom, source){
        const toc = source.toc;
        const getListFunc = new Function('const html = arguments[0]; ' + toc.list);
        const getNameFunc = new Function('const html = arguments[0]; ' + toc.name);
        const getHrefFunc = new Function('const html = arguments[0]; ' + toc.href);
        const getNextUrlFunc = new Function('const html = arguments[0]; ' + toc.nextUrl);
        const list = getListFunc(htmlDom), nextUrl = getNextUrlFunc(htmlDom);
        const tocObjList = [];
        for(const chapterDom of list){
            const name = getNameFunc(chapterDom), href = getHrefFunc(chapterDom); 
            tocObjList.push({name, href});
        }
        return [tocObjList, nextUrl];
    }

    /** 请求，并解析章节列表页面 */
    async function __requestParseToc(_tocUrl, _source, _tocPreDom = null){
        let tocDom = _tocPreDom;
        if(_tocUrl != 'LOCAL_URL'){
            /** 请求章节列表页面 */
            const resStr = await local.request(_tocUrl, 'GET', { header: _source.default.header, body: null, encode: _source.default.encoding });
            tocDom = utils.str2html(resStr);
        }
        let [tocObjList, nextUrl] = parseToc(tocDom, _source);
        let nextUrlTocObjList = [];
        if(nextUrl){
            nextUrlTocObjList = __requestParseToc(nextUrl, _source, null);
        }
        tocObjList = tocObjList.concat(nextUrlTocObjList);
        return tocObjList;
    }

    _showTocBtn.addEventListener('click', async (e)=>{
        const _infoObj = __getCurrentInfo();
        const tocUrl = _infoObj.tocUrl;
        const source = _infoObj.source;
        const tocDom = _infoObj.tocDom;
        const _tocObjList = await __requestParseToc(tocUrl, source, tocDom);
        toc.renderer(_tocObjList);
        utils.gotoPage('toc');
    });

    _changeSourceBtn.addEventListener('click', (e)=>{
        const curBookName = _bookNameElement.innerText;
        const sourceList = [];
        for(const book of search.getSearchList()){
            if(book.name == curBookName){
                /*同名书籍，纳入书源列表*/
                sourceList.push(book);
            }
        }
        const __dialogDiv = __createSourceListDialog(sourceList);
        console.log(__dialogDiv);
        const dialog = utils.clearDialogLayer();
        dialog.append(__dialogDiv);
        utils.showDialogLayer();
    });

    _backBtn.addEventListener('click', (e) => {
        utils.backPage();
    });

    return {
        renderer:__rendererInfo,
        setCurrentInfo:__setCurrentInfo,
        getCurrentInfo:__getCurrentInfo,
    }
})();