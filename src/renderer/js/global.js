/** 处理页面事件 */



/*静态工具方法*/
const utils = (function () {
    /** 页面访问历史记录 */
    const __histPages = ['main'];
    function __gotoPage(pageName) {
        for (const page of document.getElementsByClassName('container')[0].children) {
            if (page.classList.contains(pageName)) {
                page.classList.remove('hide');
            } else { page.classList.add('hide'); }
        }
        __histPages.push(pageName);
    }
    function __backPage() {
        if (__histPages.length <= 1) { return -1; }
        __histPages.pop();
        const nextPageName = __histPages.slice(-1)[0];
        for (const page of document.getElementsByClassName('container')[0].children) {
            if (page.classList.contains(nextPageName)) {
                page.classList.remove('hide');
            } else { page.classList.add('hide'); }
        }
    }
    function __showDialogLayer() {
        const dialogLayer = document.getElementById('dialog-layer')
        dialogLayer.classList.remove('hide');
        return dialogLayer;
    }
    function __hideDialogLayer() {
        const dialogLayer = document.getElementById('dialog-layer')
        dialogLayer.classList.add('hide');
        return dialogLayer;
    }
    function __clearDialogLayer() {
        const dialogLayer = document.getElementById('dialog-layer')
        dialogLayer.innerHTML = '';
        return dialogLayer;
    }
    /** 格式化字符串，字符串中使用@{param}作为等待替换的参数，param为参数key
     * @param {String} str 待格式化字符串：'http://www.fyrsks.com/s/@{searchKey}/@{page}/'
     * @param  {Object} argMap 字典类型的格式化变量：{searchKey:'我的', page:1}
     */
    function __formatString(str, argMap) {
        if (Object.keys(argMap).length == 0) { return str; }
        const argList = str.match(/\@{.*?}/g);
        if (argList) {
            for (const arg of argList) {
                const k = arg.slice(2, -1);
                str = str.replace(arg, argMap[k]);
            }
        }

        return str;
    }
    /** async 异步函数中使用的延时函数
     * @param {Number} ms 延时时间长度，单位毫秒
     */
    async function __asleep(ms) {
        return new Promise((resolve, _) => { setTimeout(() => resolve(true), ms); });
    }
    /** 获得当前时间的格式化输出
     * @param {String} formatStr 输出格式：'\@{year}\/\@{month}\/\@{day} \@{hours}:\@{minutes}:\@{seconds}'
     */
    function __now(formatStr) {
        const t = new Date();
        const year = t.getFullYear();
        const month = ('' + (t.getMonth() + 1)).padStart(2, '0');
        const day = ('' + t.getDate()).padStart(2, '0');
        const hours = ('' + t.getHours()).padStart(2, '0');
        const minutes = ('' + t.getMinutes()).padStart(2, '0');
        const seconds = ('' + t.getSeconds()).padStart(2, '0');
        return __formatString(formatStr, { year: year, month: month, day: day, hours: hours, minutes: minutes, seconds: seconds });
    }
    /** 打印格式化的日志
     * @param {String} _funcName 打印日志的方法名称
     * @param {String} _str 日志本体字符串
     */
    function __log(_funcName, _str) {
        const time = __now('@{year}/@{month}/@{day} @{hours}:@{minutes}:@{seconds}');
        const logStr = '[' + time + '] ' + _funcName + ' : ' + _str;
        console.log(logStr);
        return logStr;
    }
    /** 将字符串转为HTML对象，方便检索节点 */
    function __str2html(str) {
        return (new DOMParser()).parseFromString(str, 'text/html');
    }

    /** 初始化页面，执行各个页面对象暴露的初始化的方法 */
    async function __initPage() {
        __log('utils.initPage', '开始初始化页面')
        await main.init(); __log('utils.initPage', "页面更新成功：主页书架");
        content.init(); __log('utils.initPage', "页面更新成功：阅读");
        await plugin.init(); __log('utils.initPage', "页面更新成功：书源");
    }

    return {
        histPages: __histPages,
        gotoPage: __gotoPage,
        backPage: __backPage,
        showDialogLayer: __showDialogLayer,
        hideDialogLayer: __hideDialogLayer,
        clearDialogLayer: __clearDialogLayer,
        str2html: __str2html,
        /*旧方法迁转*/
        formatStr: __formatString,
        asleep: __asleep,
        now: __now,
        log: __log,
        initPage: __initPage,
    }
})();


/** 书源管理，基于数据库db对象存储和管理书源数据 */
const sourceManager = (function () {
    const _connection = db.connection;
    const _t_source_data_name = db.getTable().t_source_data.name;
    /*书源列表*/
    let __sourceList = [];

    /** 异步的初始化内容 */
    async function __init() {
        /** 初始化，全部的书源读取入内存 */
        await __loadSourceList();
        utils.log('sourceManager.init', "书源管理器初始化完毕");
    }
    /** 字符串转书源对象, 检查书源是否为正常书源, 如果为正常的，输出对象，否则输出null */
    function __str2SourceObj(str) {
        const s = JSON.parse(str);
        if (s.constructor == Object && s['sourceName'] && s['sourceUrl']) {
            if (s['sourceName'].constructor == String && s['sourceUrl'].constructor == String && s['sourceName'].length > 0 && s['sourceUrl'].length > 0) {
                return s;
            }
            utils.log('sourceManager.__str2SourceObj', "检查书源报错：无效的书源名称或书源网站网址");
            return null;
        }
        utils.log('sourceManager.__str2SourceObj', "检查书源报错：解析JSON字符串失败, ", s);
        return null;
    }
    /** 加载或重新加载书源列表入内存 */
    async function __loadSourceList() {
        /*更新了书源，将书源列表对象重新加载一遍*/
        const __list = await __getAllSource();
        if (__list) {
            const __sourceListTemp = [];/*中间列表*/
            for (const source of __list) {
                if (source['is_use'] == 1) {
                    const obj = __str2SourceObj(source['source_json']);
                    if (obj) {
                        __sourceListTemp.push(obj);
                    } else {
                        utils.log('sourceManager.loadSourceList', '更新内存书源列表失败，解析书源对象失败: ');
                        console.log(source);
                    }
                }
            }
            sourceManager.sourceList = __sourceListTemp;
            utils.log('sourceManager.loadSourceList', "内存书源列表更新成功，" + sourceManager.sourceList.length);
            return true;
        } else {
            utils.log('sourceManager.loadSourceList', '更新内存书源列表失败，从数据库加载书源列表失败');
            return false;
        }
    }
    async function __addSource(str) {
        const s = __str2SourceObj(str); /*书源JSON文本转换为书源对象*/
        if (s && s['sourceName'].constructor == String && s['sourceUrl'].constructor == String && s['sourceName'].length > 0 && s['sourceUrl'].length > 0) {
            const value = {
                source_url: s['sourceUrl'],
                source_name: s['sourceName'],
                is_use: 1,
                source_json: str
            };
            const noOfRowsInserted = await _connection.insert({ into: _t_source_data_name, values: [value] });
            if (noOfRowsInserted > 0) {
                /*新增的书源也同样添加给书源列表对象*/
                __sourceList.push(s);
                return true;
            } else {
                utils.log('sourceManager.addSource', "新增书源报错：插入新的数据失败");
                return false;
            }
        }
        utils.log('sourceManager.addSource', '新增书源报错：解析书源JSON字符串失败');
        return false;
    }
    async function __getSourceByUrl(url) {
        const results = await _connection.select({
            from: _t_source_data_name,
            where: { source_url: url },
            limit: 1
        });
        if (results.length > 0) {
            // utils.log('sourceManager.__getSourceByUrl', '查询书源'); console.log(results[0]);
            return results[0];
        } else {
            utils.log('sourceManager.getSourceByUrl', "查询书源失败：没有这个网站的书源。");
            return null;
        }
    }
    async function __getAllSource() {
        const results = await _connection.select({ from: _t_source_data_name });
        if (results.length > 0) {
            utils.log('sourceManager.getAllSource', '查询书源成功，书源数量：' + results.length);
            return results;
        } else {
            utils.log('sourceManager.getAllSource', "查询书源失败，当前没有书源或者数据库异常");
            return null;
        }
    }

    /** 更新书源 */
    async function __updateSource(url, newStr, _is_use = 1) {
        const s = __str2SourceObj(newStr); /*书源JSON文本转换为书源对象*/
        if (s && s['sourceName'].constructor == String
            && s['sourceUrl'].constructor == String
            && s['sourceName'].length > 0
            && s['sourceUrl'].length > 0) {
            const newValue = {
                source_url: s['sourceUrl'],
                source_name: s['sourceName'],
                is_use: _is_use,
                source_json: newStr
            };
            const noOfRowsInserted = await _connection.update({
                in: _t_source_data_name,
                set: newValue,
                where: {
                    source_url: url
                }
            });
            if (noOfRowsInserted > 0) {
                await __loadSourceList();
                return true;
            } else {
                utils.log('sourceManager.updateSource', "更新书源报错：更新了0行数据");
                return false;
            }
        }
        utils.log('sourceManager.updateSource', '更新书源报错：解析书源JSON字符串失败');
        return false;
    }
    /** 更新书源生效状态 */
    async function __updateSourceUseState(url, _is_use) {
        const noOfRowsInserted = await _connection.update({
            in: _t_source_data_name,
            set: {
                is_use: _is_use
            },
            where: {
                source_url: url
            }
        });
        if (noOfRowsInserted > 0) {
            await __loadSourceList();
            return true;
        } else {
            utils.log('sourceManager.updateSourceUseState', "更新书源状态报错：更新了0行数据");
            return false;
        }
    }
    /** 删除书源
     * @param {Array} urls 单个网址字符串或字符串数组
     * @returns 返回删除行数
     */
    async function __removeSource(urls) {
        if (urls.constructor != Array && urls.constructor != String) {
            console.log("删除书源失败，urls参数既不是字符串又不是数组");
            return false;
        }
        const rowsDeleted = await _connection.remove({
            from: _t_source_data_name,
            where: {
                source_url: { in: (urls.constructor == String ? [urls] : urls) }
            }
        });

        return rowsDeleted;
    }

    return {
        init: __init,
        /** 书源列表 */
        sourceList: __sourceList,
        /** 添加书源 */
        addSource: __addSource,
        /** 通过书源网址查询书源 */
        getSourceByUrl: __getSourceByUrl,
        /** 获取所有书源 */
        getAllSource: __getAllSource,
        /** 更新书源，如果没有则新增 */
        updateSource: __updateSource,
        /** 更新书源生效状态 */
        updateSourceUseState: __updateSourceUseState,
        /** 删除书源  */
        removeSource: __removeSource,
        str2SourceObj: __str2SourceObj,
    }
})();

/** 书架管理，基于数据库db对象存储和管理书架数据 */
const shelfManager = (function () {
    const _connection = db.connection;
    const allTables = db.getTable();
    const _t_shelf_data_name = allTables.t_shelf_data.name; /*书架表表名*/
    const _t_toc_content_data_name = allTables.t_toc_content_data.name; /*章节表表名*/

    async function __getBookInoByUrl(_bookUrl) {
        const results = await _connection.select({ from: _t_shelf_data_name, where: { url: _bookUrl } });
        if (results && results.length && results.length > 0) {
            return results[0];
        } else {
            return null;
        }
    }

    async function __getAllBook() {
        const results = await _connection.select({ from: _t_shelf_data_name });
        if (results.length > 0) {
            // utils.log('shelfManager.__getAllBook', '查询书架成功，书架上的书籍数量：' + results.length);
            return results;
        } else {
            // utils.log('shelfManager.__getAllBook', "查询书架失败，当前书架没有书或者数据库异常");
            return [];
        }
    }

    /** 添加书籍 */
    async function __addBook(bookInfo) {
        const bookName = bookInfo.name, bookUrl = bookInfo.url, sourceUrl = bookInfo.source.sourceUrl;
        const intro = bookInfo.intro, authorName = bookInfo.author, latestChapterName = bookInfo.latestChapter;
        const tocUrl = bookInfo.tocUrl, read_toc_url = bookInfo.read_toc_url;
        const value = {
            url: bookUrl,
            name: bookName,
            author: authorName,
            intro: intro,
            latest_chapter: latestChapterName,
            toc_url: tocUrl,
            source_url: sourceUrl,
            read_toc_url: read_toc_url,
        };
        const noOfRowsInserted = await _connection.insert({ into: _t_shelf_data_name, values: [value] });
        if (noOfRowsInserted > 0) {
            return true;
        } else {
            utils.log('shelfManager.__addBook', "新增书籍报错：插入新的数据失败");
            return false;
        }
    }

    /** 删除书籍 */
    async function __removeBook(bookUrl) {
        const rowsDeleted = await _connection.remove({
            from: _t_shelf_data_name, where: { book_url: bookUrl }
        });
        return rowsDeleted;
    }

    /** 删除书籍下面所有章节 */
    async function __removeBookAllToc(bookUrl) {
        const rowsDeleted = await _connection.remove({
            from: _t_toc_content_data_name, where: { book_url: bookUrl }
        });
        return rowsDeleted;
    }

    async function __addBookAllToc(bookUrl, tocObjList) {
        const valueList = [];
        let i = 0; /*章节序号，从0开始*/
        for (const toc of tocObjList) {
            const val = {
                toc_index: i,
                href: toc.href,
                name: toc.name,
                content: '',
                book_url: bookUrl,
                download_state: -1
            };
            valueList.push(val);
            i++;
        }
        const noOfRowsInserted = await _connection.insert({ into: _t_toc_content_data_name, values: valueList });
        if (noOfRowsInserted > 0) {
            return true;
        } else {
            console.log("新增书籍章节报错：插入新的数据失败");
            return false;
        }
    }

    /** 设置书籍正在读的章节网址 */
    async function __setBookReadTocUrl(bookUrl, readTocUrl) {
        const noOfRowsInserted = await _connection.update({
            in: _t_shelf_data_name,
            set: { read_toc_url: readTocUrl },
            where: { url: bookUrl }
        });
        if (noOfRowsInserted > 0) {
            return noOfRowsInserted;
        } else {
            console.log("更新书籍正在读的章节失败");
            return -1;
        }
    }

    /** 设置当前书籍下的所有章节全都改为等待下载状态 */
    async function __setBookAllTocToDownload(bookUrl) {
        const noOfRowsInserted = await _connection.update({
            in: _t_toc_content_data_name,
            set: { download_state: 0 },
            where: { book_url: bookUrl }
        });
        if (noOfRowsInserted > 0) {
            return noOfRowsInserted;
        } else {
            console.log("更新章节列表报错：更新了0行数据，可能是该书籍没有章节或章节表存在问题");
            return -1;
        }
    }

    /** 通过书籍网址获取章节列表 */
    async function __getTocListByBookUrl(bookUrl) {
        const tocList = await _connection.select({
            from: _t_toc_content_data_name,
            where: { book_url: bookUrl },
            order: { by: 'toc_index', type: 'asc' }
        });
        return tocList;
    }

    /** 通过章节内容网址获取章节项 */
    async function __getTocByTocUrl(tocUrl) {
        const tocList = await _connection.select({
            from: _t_toc_content_data_name,
            where: { href: tocUrl }
        });
        if (tocList && tocList.length && tocList.length > 0) {
            return tocList[0];
        } else {
            return null;
        }
    }

    /** 根据网址查找并更新章节对应内容 */
    async function __setContentByUrl(_url, _content) {
        const noOfRowsInserted = await _connection.update({
            in: _t_toc_content_data_name,
            set: { content: _content },
            where: { href: _url }
        });
        if (noOfRowsInserted > 0) {
            return noOfRowsInserted;
        } else {
            console.log("更新章节内容报错：更新了0行数据，可能是该书籍没有章节或章节表存在问题");
            return -1;
        }
    }
    /** 根据网址查找并更新章节对应的下载状态 */
    async function __setTocDownloadStateByUrl(_url, _downloadState) {
        const noOfRowsInserted = await _connection.update({
            in: _t_toc_content_data_name,
            set: { download_state: _downloadState },
            where: { href: _url }
        });
        if (noOfRowsInserted > 0) {
            return noOfRowsInserted;
        } else {
            console.log("更新章节内容报错：更新了0行数据，可能是该书籍没有章节或章节表存在问题");
            return -1;
        }
    }

    async function __deleteBookFromShelf(bookUrl) {
        await _connection.remove({
            from: _t_toc_content_data_name,
            where: { book_url: bookUrl }
        });
        await _connection.remove({
            from: _t_shelf_data_name,
            where: { url: bookUrl }
        });
    }


    return {
        getBookInoByUrl: __getBookInoByUrl,
        getAllBook: __getAllBook,
        addBook: __addBook,
        removeBook: __removeBook,
        addBookAllToc: __addBookAllToc,
        removeBookAllToc: __removeBookAllToc,
        setBookAllTocToDownload: __setBookAllTocToDownload,
        getTocListByBookUrl: __getTocListByBookUrl,
        getTocByTocUrl: __getTocByTocUrl,
        setContentByUrl: __setContentByUrl,
        setTocDownloadStateByUrl: __setTocDownloadStateByUrl,
        setBookReadTocUrl: __setBookReadTocUrl,
        deleteBookFromShelf: __deleteBookFromShelf,
    }
})();

const downloadManager = (function () {
    const _connection = db.connection;
    const allTables = db.getTable();
    const _t_toc_content_data_name = allTables.t_toc_content_data.name; /*章节表表名*/

    let _downloadWaitQueue = [];

    function __getDownloadWaitQueue() {
        return _downloadWaitQueue;
    }

    /** 刷新下载列表，相当于获取在当前时刻等待下载状态的章节，然后给等待下载队列赋值 */
    async function __freshDownloadWaitQueue() {
        _downloadWaitQueue = await __getHaveDownloadToc();
        // console.log('__freshDownloadWaitQueue queue length is ', _downloadWaitQueue.length);
        return _downloadWaitQueue.length;
    }

    async function __downloadOnce() {
        const queue_len = await __freshDownloadWaitQueue();
        if (queue_len > 0) {
            const tocItem = _downloadWaitQueue.shift();
            const source = await __getSourceByTocObj(tocItem);
            const _href = tocItem.href;
            await __updateDownloadStateByTocUrl(_href, 0, 3);
            const _content = (await toc.requestParseContent(_href, source));
            if (_content && _content.length && _content.length > 0) {
                await shelfManager.setContentByUrl(_href, _content.join('<br>'));
                await shelfManager.setTocDownloadStateByUrl(_href, 1);
                // utils.log('downloadManager', '下载完毕：' + _href);
            } else {
                await shelfManager.setTocDownloadStateByUrl(_href, 2);
                utils.log('downloadManager', '下载失败：' + _href);
            }
        }

    }

    async function __init() {
        __freshDownloadWaitQueue();
        setInterval(() => {
            __downloadOnce();
            cache.updateCacheList();
        }, 2000);
    }

    /** 获取所有匹配的章节，匹配book_url */
    async function __getDownloadTocByBookUrl(bookUrl) {
        return await _connection.select({ from: _t_toc_content_data_name, where: { book_url: bookUrl } });
    }

    /** 获取当前toc列表中处于等待下载状态的章节项 */
    async function __getHaveDownloadToc() {
        return await _connection.select({ from: _t_toc_content_data_name, where: { download_state: 0 } });
    }
    /** 更新某个书籍匹配的状态为新的状态 */
    async function __updateDownloadStateByBookUrl(bookUrl, old_state, new_state) {
        return await _connection.update({
            in: _t_toc_content_data_name,
            set: { download_state: new_state },
            where: {
                book_url: bookUrl,
                download_state: old_state
            }
        });
    }
    /** 更新某个章节的匹配的状态为新的状态 */
    async function __updateDownloadStateByTocUrl(tocUrl, old_state, new_state){
        return await _connection.update({
            in: _t_toc_content_data_name,
            set: { download_state: new_state },
            where: {
                href: tocUrl,
                download_state: old_state
            }
        });
    }
    /** 根据章节项获取归属的书源 */
    async function __getSourceByTocObj(tocObj) {
        const bookUrl = tocObj.book_url;
        const bookObj = await shelfManager.getBookInoByUrl(bookUrl);
        const sourceUrl = bookObj.source_url;
        const sourceObj = await sourceManager.getSourceByUrl(sourceUrl);
        if (sourceObj) {
            const source = sourceManager.str2SourceObj(sourceObj.source_json);
            return source;
        }
        return null;
    }


    return {
        init: __init,
        getDownloadWaitQueue: __getDownloadWaitQueue,
        getDownloadTocByBookUrl: __getDownloadTocByBookUrl,
        updateDownloadStateByBookUrl: __updateDownloadStateByBookUrl,
    }
})();