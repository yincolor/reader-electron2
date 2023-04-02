const main = (function(){
    const _page = document.getElementsByClassName('container')[0].getElementsByClassName('page main')[0];
    const _head = _page.getElementsByClassName('head')[0];
    const _body = _page.getElementsByClassName('body')[0];
    const _shelf= _body.getElementsByClassName('shelf')[0];

    const _searchBtn = _head.getElementsByClassName('btn search')[0];
    const _settingBtn= _head.getElementsByClassName('btn setting')[0]; 


    /** 渲染书架 */
    async function __rendererBookShelf(bookList){
        utils.log('main.init', '开始渲染书架，从书架管理器中得知，书架中有' + bookList.length + '本书');
        _shelf.innerHTML = '';
        const div = document.createElement('div');
        for(const book of bookList){
            console.log(book);
            const read_toc_url = book.read_toc_url;
            const toc = await shelfManager.getTocByTocUrl(read_toc_url);
            const domStr = `<div class="book btn" url='${book.url}' source_url='${book.source_url}'> <div class="name">《${book.name}》<br>作者：${book.author}<br>正在阅读：${toc.name}</div></div>`;
            div.innerHTML = domStr;
            const itemDom = div.children[0]; /*生成节点元素*/
            /** 书籍点击事件 */
            itemDom.addEventListener('click', async (e) => {
                const _item = e.currentTarget;
                const _bookUrl = _item.getAttribute('url');
                /*从数据库读取书籍信息对象*/
                const infoObj = await shelfManager.getBookInoByUrl(_bookUrl);
                const sourceUrl = infoObj.source_url;
                let source; 
                if(sourceUrl != 'LOCAL_FILE_SYSTEM'){
                    const s = await sourceManager.getSourceByUrl(sourceUrl);
                    source = sourceManager.str2SourceObj(s.source_json);
                }else {
                    source = {sourceUrl: 'LOCAL_FILE_SYSTEM', sourceName: '本地文件'}
                }
                infoObj.source = source; 
                /** 渲染书籍信息，并切换页面到书籍信息页面 */
                console.log('[书架->书籍详情]', infoObj);
                info.renderer(infoObj); 
                utils.gotoPage('info');
            });
            _shelf.append(itemDom);
        }
    }

    /** 初始化 */
    async function __init(){
        const bookList = await shelfManager.getAllBook();
        __rendererBookShelf(bookList);
    }

    _searchBtn.addEventListener('click', (e)=>{
        console.log(e.target);
        utils.gotoPage('search');
    });
    
    _settingBtn.addEventListener('click', (e)=>{
        // console.log(e.target);
        utils.gotoPage('setting');
    });

    /** 设置对主页书架窗口显示和隐藏的监听 */
    const class_option = { attributes: true, attributeFilter:['class'] };
    const md = new MutationObserver( async (mutationRecord,observer) => {
        const m0 = mutationRecord[0];
        if(m0.target.classList.contains('hide') == false){
            /*只有在进入主页的时候 才重加载书架*/
            utils.log('main.md.observe', '主页页面显示重新初始化主页');
            await __init();
        }
    });
    md.observe(_page, class_option);

    return {
        init: __init
    }
})();

