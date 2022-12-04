const toc = (function(){
    const _container = document.getElementsByClassName('container')[0];
    const _tocPage = _container.getElementsByClassName('page toc')[0];
    const _head = _tocPage.getElementsByClassName('head')[0];
    const _body = _tocPage.getElementsByClassName('body')[0];
    const _backBtn = _head.getElementsByClassName('btn-back-page')[0];
    

    /** 渲染章节列表 */
    function __rendererToc(tocList, source){
        _body.innerHTML = ''; /*清空章节列表*/
        const domParse = new DOMParser();
        for(const toc of tocList){
            const name = toc.name;
            const href = toc.href;
            const downloadState = toc.download_state; /* 下载状态 */
            const tocItemHtmlStr = `<div class="btn" url='${href}' source_url='${source.sourceUrl}' source_name='${source.sourceName}' ><span>${name}</span><span>${downloadState}</span></div>`;
            const tocItem = domParse.parseFromString(tocItemHtmlStr,'text/html').body.children[0];
            tocItem.addEventListener('click', async (e)=>{
                /*点击章节列表项*/
                const _item = e.currentTarget;
                console.log(e.currentTarget);
                const url = _item.getAttribute('url');
                const sourceUrl = _item.getAttribute('source_url');
                console.log('点击章节：', url, sourceUrl);
                let source = null;
                for(const s of sourceManager.sourceList){
                    if(s.sourceUrl == sourceUrl){
                        source = s;
                    }
                }
                const _contentText = await __requestParseContent(url, source);
                /*在这里获取*/
                content.renderer(_contentText, name, info.getCurrentInfo().name); /*渲染内容页面内容*/
                utils.gotoPage('content');
            });
            _body.append(tocItem);
        }
    }

    function parseContent(htmlDom, source){
        const toc = source.content;
        const getTextFunc = new Function('const html = arguments[0]; ' + source.content.text);
        const getNextUrlFunc = new Function('const html = arguments[0]; ' + toc.nextUrl);
        const text = getTextFunc(htmlDom);
        const nextUrl = getNextUrlFunc(htmlDom);
        return [[text], nextUrl];
    }

    async function __requestParseContent(_contentUrl, _source, _contentPreDom = null){
        let contentDom = _contentPreDom;
        if(_contentUrl != 'LOCAL_URL'){
            /** 请求章节列表页面 */
            const resStr = await local.request(_contentUrl, 'GET', { header: _source.default.header, body: null, encode: _source.default.encoding });
            contentDom = utils.str2html(resStr);
        }
        let [textList, nextUrl] = parseContent(contentDom, _source);
        let nextUrlTextList = [];
        if(nextUrl){
            nextUrlTextList = __requestParseContent(nextUrl, _source, null);
        }
        textList = textList.concat(nextUrlTextList);
        return textList.join('\n') ;
    }

    _backBtn.addEventListener('click', (e)=>{ utils.backPage(); });

    return {
        renderer: __rendererToc,
        requestParseContent: __requestParseContent
    }
})();