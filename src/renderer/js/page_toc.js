const toc = (function(){
    const _container = document.getElementsByClassName('container')[0];
    const _tocPage = _container.getElementsByClassName('page toc')[0];
    const _body = _tocPage.getElementsByClassName('body')[0];

    
    /** 渲染章节列表 */
    function __rendererToc(tocList){
        _body.innerHTML = ''; /*清空章节列表*/
        const domParse = new DOMParser();
        for(const toc of tocList){
            const name = toc.name;
            const href = toc.href;
            const tocItemHtmlStr = `<div class="btn" url='${href}' ><span>${name}</span><span>✔️</span></div>`;
            const tocItem = domParse.parseFromString(tocItemHtmlStr,'text/html').body.children[0];
            _body.append(tocItem);
        }
        
    }

    return {
        renderer: __rendererToc
    }
})();