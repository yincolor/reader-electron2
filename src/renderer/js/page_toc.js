const toc = (function () {
    const _container = document.getElementsByClassName('container')[0];
    const _tocPage = _container.getElementsByClassName('page toc')[0];
    const _head = _tocPage.getElementsByClassName('head')[0];
    const _body = _tocPage.getElementsByClassName('body')[0];
    const _backBtn = _head.getElementsByClassName('btn-back-page')[0];

    /** 根据章节网址和书源网址请求并解析内容，并返回内容文本 */
    async function __getContentByTocUrl(_tocUrl, _sourceUrl) {
        const url = _tocUrl; /** 章节内容网址 */
        const sourceUrl = _sourceUrl;
        let _contentText = null;
        /** 方式0：先查找toc_content表中能不能查到content内容 */
        const tocItem = await shelfManager.getTocByTocUrl(url);
        if (tocItem && tocItem.content != "") {
            utils.log('toc.__getContentByTocUrl', '从数据库获取章节内容');
            _contentText = tocItem.content;
        } else {
            /** 方式1：如果toc_content表中没有content内容，则网络请求，然后解析之 */
            utils.log('toc.__getContentByTocUrl', '远程访问获取章节内容');
            const sourceObj = await sourceManager.getSourceByUrl(sourceUrl);
            const source = sourceManager.str2SourceObj(sourceObj.source_json);
            _contentText = await __requestParseContent(url, source);
        }
        return _contentText;
    }

    /** 渲染章节列表 */
    function __rendererToc(tocList, source) {
        _body.innerHTML = ''; /*清空章节列表*/
        const domParse = new DOMParser();
        for (const toc of tocList) {
            const name = toc.name;
            const href = toc.href;
            const downloadState = toc.download_state || -1; /* 下载状态 */
            const tocItemHtmlStr = `<div class="btn" url='${href}' source_url='${source.sourceUrl}' source_name='${source.sourceName}' ><span>${name}</span><span>${downloadState}</span></div>`;
            const tocItem = domParse.parseFromString(tocItemHtmlStr, 'text/html').body.children[0];
            tocItem.addEventListener('click', async (e) => {
                /*点击章节列表项*/
                const _item = e.currentTarget;
                // console.log(e.currentTarget);
                const url = _item.getAttribute('url'); /** 章节内容网址 */
                const sourceUrl = _item.getAttribute('source_url');
                console.log('点击章节：', url, sourceUrl);
                const _contentText = await __getContentByTocUrl(url, sourceUrl);
                content.renderer(_contentText, name, info.getCurrentInfo().name); /*渲染内容页面内容*/
                await info.setCurInfoReadTocUrl(url);
                utils.gotoPage('content');
            });
            _body.append(tocItem);
        }
    }

    function parseContent(htmlDom, source) {
        const toc = source.content;
        const getTextFunc = new Function('const html = arguments[0]; ' + source.content.text);
        const getNextUrlFunc = new Function('const html = arguments[0]; ' + toc.nextUrl);
        try {
            const text = getTextFunc(htmlDom);
            const nextUrl = getNextUrlFunc(htmlDom);
            return [[text], nextUrl];
        } catch (error) {
            utils.log('toc.parseContent', '解析内容网页失败，请检查书源');
            console.log(error);
            return [[], null];
        }
        
    }

    async function __requestParseContent(_contentUrl, _source, _contentPreDom = null) {
        let contentDom = _contentPreDom;
        if (_contentUrl != 'LOCAL_URL') {
            /** 请求章节列表页面 */
            const resStr = await local.request(_contentUrl, 'GET', { header: (_source.default.header || null), body: null, encode: (_source.default.encoding || 'utf-8') });
            if(!resStr) { return null; } /* 如果请求内容为NULL，则返回null */
            contentDom = utils.str2html(resStr);
        }
        let [textList, nextUrl] = parseContent(contentDom, _source);
        let nextUrlTextList = [];
        if (nextUrl) {
            nextUrlTextList = __requestParseContent(nextUrl, _source, null);
        }
        textList = textList.concat(nextUrlTextList);
        return textList.join('\n');
    }

    _backBtn.addEventListener('click', (e) => { utils.backPage(); });

    return {
        renderer: __rendererToc,
        requestParseContent: __requestParseContent,
        getContentByTocUrl:__getContentByTocUrl,
    }
})();