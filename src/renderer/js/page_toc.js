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
            return _contentText;
        } else {
            /** 方式1：如果toc_content表中没有content内容，则网络请求，然后解析之 */
            utils.log('toc.__getContentByTocUrl', '远程访问获取章节内容');
            // console.log('获取书源：', sourceUrl);
            const sourceObj = await sourceManager.getSourceByUrl(sourceUrl);
            // console.log('得到书源', sourceObj);
            const source = sourceManager.str2SourceObj(sourceObj.source_json);
            _contentText = await __requestParseContent(url, source);
            /** 判断是否正常获取内容 */
            if (_contentText && _contentText.length && _contentText.length > 0) {
                return _contentText.join('\n');
            } else {
                return "无正文内容，书源异常";
            }
        }
    }

    /** 拿到内容后为content页面设置内容 */
    async function __setContent(_text, _tocName, _bookName, _tocUrl) {
        content.renderer(_text, _tocName, _bookName); /*渲染内容页面内容*/
        await info.setCurInfoReadTocUrl(_tocUrl); /** 设置页面详情对象的当前正在阅读的章节网址 */
    }

    /** 刷新章节列表中正在读的章节 */
    function __freshViewReadingToc(newUrl) {
        for (const div of _body.children) {
            div.classList.remove('reading');
        }
        for (const div of _body.children) {
            if (div.getAttribute('url') == newUrl) {
                div.classList.add('reading');
                console.log('当前scrollTop=', _body.scrollTop, '调整：', div, div.getBoundingClientRect().top, _body.getBoundingClientRect().top);
                _body.scrollTop += div.getBoundingClientRect().top - _body.getBoundingClientRect().top;
            }
        }
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
                dialog.loading("正在请求并解析章节内容");
                const _contentText = await __getContentByTocUrl(url, sourceUrl);
                await __setContent(_contentText, name, info.getCurrentInfo().name, url);
                utils.gotoPage('content');
                dialog.close();
            });
            _body.append(tocItem);
        }
    }

    function parseContent(htmlDom, source) {
        const c = source.content;
        const getTextFunc = new Function('const html = arguments[0]; ' + c.text);
        const getNextUrlFunc = new Function('const html = arguments[0]; ' + c.nextUrl);
        try {
            const text = getTextFunc(htmlDom);
            // console.log('get text is ', text);
            const nextUrl = getNextUrlFunc(htmlDom);
            return [[text], nextUrl];
        } catch (error) {
            utils.log('toc.parseContent', '解析内容网页失败，请检查书源');
            console.log(error);
            return [[], null];
        }

    }

    async function __requestParseContent(_contentUrl, _source, _contentPreDom = null) {
        let contents = []
        let contentDom = _contentPreDom;
        if (_contentUrl != 'LOCAL_URL') {
            /** 请求章节列表页面 */
            const resStr = await local.request(_contentUrl, 'GET', { header: (_source.default.header || null), body: null, encode: (_source.default.encoding || 'utf-8') });
            if (!resStr) { return null; } /* 如果请求内容为NULL，则返回null */
            // console.log('res str is ', resStr);
            contentDom = utils.str2html(resStr);
        }
        let [textList, nextUrl] = parseContent(contentDom, _source);
        contents = contents.concat(textList);
        // console.log(_contentUrl, nextUrl, textList.length);
        // console.log('__requestParseContent nextUrl is ', nextUrl);
        // console.log("context is ", textList);

        if (nextUrl) {
            const nextUrlTextList = await __requestParseContent(nextUrl, _source, null);
            contents = contents.concat(nextUrlTextList);
            return contents;
        } else {
            return contents;
        }
        // textList = textList.concat(nextUrlTextList);
        // return textList.join('\n');
    }

    /** 获取当前章节的下一个章节的网址 */
    function __getNextTocUrl(curUrl) {
        for (const div of _body.getElementsByTagName('div')) {
            if (div.getAttribute('url') == curUrl) {
                return div.nextSibling ? div.nextSibling.getAttribute('url') : null;
            }
        }
        return null;
    }
    /** 获取当前章节的上一个章节的网址 */
    function __getPrevTocUrl(curUrl) {
        for (const div of _body.getElementsByTagName('div')) {
            if (div.getAttribute('url') == curUrl) {
                return div.previousSibling ? div.previousSibling.getAttribute('url') : null;
            }
        }
        return null;
    }

    /** 根据章节网址获取章节名称 */
    function __getTocNameByUrl(url) {
        for (const div of _body.getElementsByTagName('div')) {
            if (div.getAttribute('url') == url) {
                return div.getElementsByTagName('span')[0].innerText;
            }
        }
        return null;
    }

    _backBtn.addEventListener('click', (e) => { utils.backPage(); });

    /** 设置对目录窗口显示和隐藏的监听 */
    const class_option = { attributes: true, attributeFilter: ['class'] };
    const md = new MutationObserver(async (mutationRecord, observer) => {
        const m0 = mutationRecord[0];
        if (m0.target.classList.contains('hide') == false) {
            /*只有在进入主页的时候 才重加载书架*/
            utils.log('main.md.observe', '章节页面显示重新初始化主页');
            __freshViewReadingToc(info.getCurInfoReadTocUrl());
        }
    });
    md.observe(_tocPage, class_option);

    return {
        rendererToc: __rendererToc,
        requestParseContent: __requestParseContent,
        getContentByTocUrl: __getContentByTocUrl,
        getNextTocUrl: __getNextTocUrl,
        getPrevTocUrl: __getPrevTocUrl,
        setContent: __setContent,
        getTocNameByUrl: __getTocNameByUrl,
        freshViewReadingToc: __freshViewReadingToc,
    }
})();