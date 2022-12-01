/** 处理页面事件 */

/** 通过给节点元素添加 hide class 使节点隐藏和显示 */
// function _hideDom(dom) { if (dom.classList.contains('hide') == false) { dom.classList.add('hide'); } }
// function _displayDom(dom) { dom.classList.remove('hide'); }
// function _changeDomHide(dom) {
//     if (dom.classList.contains('hide')) {
//         dom.classList.remove('hide');
//     } else { dom.classList.add('hide'); }
// }

// /** 切换页面，窗口中只会让一个页面显示，其他都隐藏 */
// function changePage(pageName) {
//     for (const page of document.getElementsByClassName('page')) {
//         if (page.classList.contains(pageName)) { _displayDom(page); } else { _hideDom(page); }
//     }
// }



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
        console.log(str, argList);
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
        return formatString(formatStr, { year: year, month: month, day: day, hours: hours, minutes: minutes, seconds: seconds });
    }
    /** 打印格式化的日志
     * @param {String} _funcName 打印日志的方法名称
     * @param {String} _str 日志本体字符串
     */
    function __log(_funcName, _str) {
        const time = now('@{year}/@{month}/@{day} @{hours}:@{minutes}:@{seconds}');
        const logStr = '[' + time + '] ' + _funcName + ' : ' + _str;
        console.log(logStr);
        return logStr;
    }
    /** 将字符串转为HTML对象，方便检索节点 */
    function __str2html(str) {
        return (new DOMParser()).parseFromString(str, 'text/html');
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
    }
})();


/** 书源管理，基于数据库db对象存储和管理书源数据 */
const sourceManager = (function () {
    const _connection = db.connection;
    const _t_source_data_name = db.meta_table.t_source_data.name;
    /*书源列表*/
    let __sourceList = [];



    /** 异步的初始化内容 */
    async function __init() {
        /** 初始化，全部的书源读取入内存 */
        await __loadSourceList();
        console.log("书源管理器初始化完毕");
    }
    /** 字符串转书源对象, 检查书源是否为正常书源, 如果为正常的，输出对象，否则输出null */
    function __str2SourceObj(str) {
        const s = JSON.parse(str);
        if (s.constructor == Object && s['sourceName'] && s['sourceUrl']) {
            if (s['sourceName'].constructor == String && s['sourceUrl'].constructor == String && s['sourceName'].length > 0 && s['sourceUrl'].length > 0) {
                return s;
            }
            console.log("检查书源报错：无效的书源名称或书源网站网址");
            return null;
        }
        console.log("检查书源报错：解析JSON字符串失败, ", s);
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
                        console.log('更新内存书源列表失败，解析书源对象失败。', source);
                    }
                }
            }
            sourceManager.sourceList = __sourceListTemp;
            console.log("内存书源列表更新成功，" + sourceManager.sourceList.length);
            return true;
        } else {
            console.log('更新内存书源列表失败，从数据库加载书源列表失败');
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
                console.log("新增书源报错：插入新的数据失败");
                return false;
            }
        }
        console.log('新增书源报错：解析书源JSON字符串失败');
        return false;
    }
    async function __getSourceByUrl(url) {
        const results = await _connection.select({
            from: _t_source_data_name,
            where: {
                source_url: url
            },
            limit: 1
        });
        if (results.length > 0) {
            console.log('查询书源：', results[0]);
            return results[0];
        } else {
            console.log("查询书源失败：没有这个网站的书源。");
            return null;
        }
    }
    async function __getAllSource() {
        const results = await _connection.select({ from: _t_source_data_name });
        if (results.length > 0) {
            console.log('查询书源成功，书源数量：' + results.length);
            return results;
        } else {
            console.log("查询书源失败，当前没有书源或者数据库异常");
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
                console.log("更新书源报错：更新了0行数据");
                return false;
            }
        }
        console.log('更新书源报错：解析书源JSON字符串失败');
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
            console.log("更新书源状态报错：更新了0行数据");
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
    }
})();