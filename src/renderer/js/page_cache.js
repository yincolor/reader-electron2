const cache = (function () {
    const _container = document.getElementsByClassName('container')[0];
    const _page = _container.getElementsByClassName('page cache')[0];
    const _view = _page.getElementsByClassName('view')[0];
    const _head = _view.getElementsByClassName('head')[0];
    const _body = _view.getElementsByClassName('body')[0];
    const _backBtn = _head.getElementsByClassName('btn btn-back-page')[0];
    const _cacheListView = _body.getElementsByClassName('cache-list')[0];

    _backBtn.addEventListener('click', () => {
        utils.backPage();
    });

    /** 下载文件 */
    function __downloadFile(f){
        var a = document.createElement('a'); 
        var objectUrl = URL.createObjectURL(f); 
        a.href = objectUrl; 
        a.download = f.name; 
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a); 
        URL.revokeObjectURL(objectUrl) ; 
    }

    function __createCacheItemDiv(book){

        const cacheItemDiv = document.createElement('div');
        cacheItemDiv.classList.add('cache-item');
        const bookNameDiv = document.createElement('div');
        const bookUrlDiv = document.createElement('div');
        const stateDiv = document.createElement('div');
        const faileReloadBtn = document.createElement('button');
        const stopDownloadingBtn = document.createElement('button');
        const startWaitDownloadBtn = document.createElement('button');
        const outTextBtn = document.createElement('button') ; 
        const btnGroupDiv = document.createElement('div');

        bookNameDiv.innerText = '书名：'+book.name; 
        bookUrlDiv.innerText = '网址：'+book.url;
        stateDiv.innerText = `未下载：${book.stateMap['未下载']}-等待下载：${book.stateMap['等待下载']}-正在下载：${book.stateMap['正在下载']}-下载成功：${book.stateMap['下载成功']}-下载失败：${book.stateMap['下载失败']} `;
        faileReloadBtn.innerText       = '下载失败=>等待下载';
        stopDownloadingBtn.innerText   = '正在下载=>尚未下载';
        startWaitDownloadBtn.innerText = '尚未下载=>正在下载';
        outTextBtn.innerText = '导出到本地'; 


        btnGroupDiv.append(faileReloadBtn, stopDownloadingBtn, startWaitDownloadBtn, outTextBtn);
        cacheItemDiv.append(bookNameDiv, bookUrlDiv, stateDiv, btnGroupDiv)

        faileReloadBtn.addEventListener('click', async ()=>{
            console.log(book.url, 'click faileReloadBtn.');
            await downloadManager.updateDownloadStateByBookUrl(book.url, 2, 0);
            __updateCacheList();

        });
        stopDownloadingBtn.addEventListener('click', async ()=>{
            console.log(book.url, 'click stopDownloadingBtn.');
            await downloadManager.updateDownloadStateByBookUrl(book.url, 0, -1);
            __updateCacheList();
        });
        startWaitDownloadBtn.addEventListener('click', async ()=>{
            console.log(book.url, 'click startWaitDownloadBtn.');
            await downloadManager.updateDownloadStateByBookUrl(book.url, -1, 0);
            __updateCacheList();
        });

        outTextBtn.addEventListener('click', async ()=>{
            const contentList = await downloadManager.getDownloadTocByBookUrl(book.url);
            const arr = ['《' + book.name + '》'];
            for(const c of contentList){
                arr.push(c.name, c.content);
            }
            const str = arr.join('\n');
            const file = new File([str], book.name+".txt", {type: 'text/plain', });
            dialog.loading("正在导出文件：" + book.name); 
            __downloadFile(file); 
            dialog.close();
        });

        return cacheItemDiv;

    }

    /** 章节下载情况聚组，统计数量 */
    function __groupTocsByDownloadState(tocs) {
        /** 下载状态：-1 未下载，没有下载需求 0 等待下载 1 下载成功 2 下载失败 3 正在下载 */
        const stateMap = { '未下载': 0, '等待下载': 0, '下载成功': 0, '下载失败': 0, '正在下载': 0 };
        for (const toc of tocs) {
            switch (toc.download_state) {
                case -1: stateMap['未下载'] += 1; break;
                case 0: stateMap['等待下载'] += 1; break;
                case 1: stateMap['下载成功'] += 1; break;
                case 2: stateMap['下载失败'] += 1; break;
                case 3: stateMap['正在下载'] += 1; break;
                default: break;
            }
        }
        return stateMap;
    }

    /** 更新缓存列表视窗 */
    function __updateCacheListView(bookList) {
        _cacheListView.innerHTML = '';
        const divList = [];
        for (book of bookList) {
            const div = __createCacheItemDiv(book);
            divList.push(div);
        }
        _cacheListView.append(...divList);  
    }

    /** 暴露在外面的更新列表的函数 */
    async function __updateCacheList() {
        const shelfBookList = await shelfManager.getAllBook();
        const bookList = [];
        for (const book of shelfBookList) {
            const url = book.url;
            const tocs = await downloadManager.getDownloadTocByBookUrl(url);
            const stateMap = __groupTocsByDownloadState(tocs);
            bookList.push({name: book.name, url: book.url, stateMap: stateMap});
        }
        __updateCacheListView(bookList); 
    }

    return {
        updateCacheList:__updateCacheList
    }
})();
