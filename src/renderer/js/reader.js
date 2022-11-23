/*书源管理，书籍搜索*/
// const request = require('./request.js');
// const parseHtml = require('./parse_html.js');
// const utils = require('./utils.js');
// const pro_cfg = require('./project.config.js');

const SLEEP_TIME = 1000; /*设定每次请求完成后等待多久返回结果，以避免被发现是爬虫*/

let moduleList = []; // 书源插件模块的列表 JS文件

/** 读取解析插件列表 */
async function loadModule() {
    return new Promise((resolve, _) => {
        let pathList = [];
        fs.readdir(_MODULE_DIR, (err, files) => {
            for (f of files) {
                let mpath = path.join(_MODULE_DIR, f);
                if (fs.statSync(mpath).isFile() && mpath.substring(mpath.length - 3) == '.js') {
                    pathList.push(require(mpath));
                }
            }
            resolve(pathList);
        });
    })

}

/** 根据网址来查找插件模块 */
function findModule(url){
    const _sourceUrl = (url.match(/http[s]?:\/\/.*?\//)||[''])[0].slice(0,-1); /*获取网站网址sourceUrl*/
    console.log('找到 source url is ', _sourceUrl);
    if(_sourceUrl == ''){ return null; }
    for(m of moduleList){
        if(m.sourceUrl == _sourceUrl){ return m; }
    }
    return null;
}

/** 初始化 */
async function init() {
    let dirState = await pro_cfg.local.checkPath();
    if (!( dirState )) { console.log("检测路径失败！"); resolve(false); };
    moduleList = await loadModule() || []; 
    // console.log('插件列表：', moduleList);
}

async function parseSearch(searchUrl, m){
    // if(!(m)){ utils.log('searchByModule', '未提供书源模块，无法继续搜索'); return null;  }
    const url = searchUrl; //utils.formatString(m.search.url, {searchKey:key} );
    const encode = m.search.encode||m.encode||'utf-8';
    const resStr = await request( url, m.search.requestType || m.requestType, {header: m.header, body: (m.search.postBody||null), encode: encode} );
    await utils.asleep(SLEEP_TIME);
    const dom = parseHtml(resStr);
    let searchList = [];
    try{
        searchList = m.search.getBooks(dom);
    } catch(err){
        console.log('解析搜索DOM失败，['+ m.sourceName +":"+m.sourceUrl +']模型出错，返回空数组.');
        return [];
    }
    if(m.search.nextHtml != undefined){
        const nextSearchHtmlUrl = m.search.nextHtml(dom);
        if( nextSearchHtmlUrl != false && nextSearchHtmlUrl != null && nextSearchHtmlUrl != '' && nextSearchHtmlUrl != undefined){
            /* 存在下一页 */
            await utils.asleep(1000); //休眠1秒，从而避免被检测到爬虫而封IP
            const nextSearchList = await parseSearch(nextSearchHtmlUrl, m);
            searchList = searchList.concat(nextSearchList);
        }
    }
    return searchList;
}

/** 获取生效的书源插件，循环请求书源列表 */
async function* search(key){
    // const localFilePath = ['./test/笔趣阁1.html', './test/笔趣阁2.html']; 
    // let index = 0;
    for(const m of moduleList){
        const url = utils.formatStr(m.search.url, {searchKey:key} );
        console.log(url)
        const searchList = await parseSearch(url, m); 
        console.log('get a search list:', searchList);
        yield {searchList:searchList, sourceModule:m};
    }
    return 0;
}

/** 
 * 解析书籍详情页面，
 * 0. 找到网址对应的书源插件 
 * 1. 请求url 
 * 2. 解析书籍详情，
 * 3. 解析章节url，如果书籍详情页面存在完整的章节，那么直接将当前请求并解析得到的dom对象作为返回对象，如果没有，那么就返回章节列表的url 
 * */
/**
 * 解析书籍详情页面，返回书籍详情的对象 
 * @param {String} url 请求的书籍详情网址
 * @param {Object} m 书源插件模块
 * @returns \{ name, author, latestChapter, intro, tocUrl, bookModule, tocDom }
 */
async function bookInfo( url, m ){
    if(!(m)){ 
        m = findModule(url);
        if( m ) { utils.log('bookInfo', '未提供书院模块，但已通过Url找到匹配的模块'); }else{ utils.log('bookInfo', '未找到匹配的模块可以匹配当前网址：' + url); return null; /** 没有查到书源插件模块，返回一个null */ }
    } 
    const encode = m.info.encode||m.encode||'utf-8';
    const dom = parseHtml( await request(url, (m.info.requestType || m.requestType), {header: m.header, body: (m.info.postBody||null), encode: encode}) ); 
    await utils.asleep(SLEEP_TIME);
    let bookInfo = m.info.getInfo(dom);
    bookInfo.bookModule = m;  
    /*如果目录网址等于localurl，那么将解析到的书籍详情页DOM赋给bookInfo对象，传递下去*/
    if(bookInfo.tocUrl && bookInfo.tocUrl.toLowerCase() == 'localurl'){ bookInfo.tocDom = dom;  }
    // console.log(bookInfo);
    return bookInfo; 
}

/**
 * 解析章节列表，解析章节列表和解析章节详情应该提供一个合并的接口，让前台点击小说时就请求章节详情和章节列表
 */
async function tocList(info){
    const _tocUrl = info.tocUrl;
    const m = info.bookModule;
    const _reqType = m.toc.requestType||m.requestType;
    const _encode = m.toc.encode||m.encode||'utf-8';
    let tocdom = (_tocUrl.toLowerCase() == 'localurl')?info.tocDom:( parseHtml(await request(_tocUrl,_reqType, {header: m.header, body: (m.toc.postBody||null), encode: _encode} ) ) ); 
    await utils.asleep(SLEEP_TIME);
    let tocs = m.toc.getTocList(tocdom); //目录列表
    if(m.toc.nextHtml != undefined){
        const nextTocHtmlUrl = m.toc.nextHtml(tocdom);
        if( nextTocHtmlUrl != false && nextTocHtmlUrl != null && nextTocHtmlUrl != '' && nextTocHtmlUrl != undefined){
            /* 存在下一页 */
            await utils.asleep(1000); //休眠1秒，从而避免被检测到爬虫而封IP
            const nextToc = {tocUrl: nextTocHtmlUrl, bookModule: m }
            const nextTocList = await tocList(nextToc);
            tocs = tocs.concat(nextTocList);
        }
    }
    return tocs;
}

async function book(url, m){
    const info = await bookInfo(url, m);
    if(info == null){ return null; }
    const tocs = await tocList(info);
    info.tocList = tocs;
    return info; 
}

async function content(url, m){
    if(!(m)){ 
        m = findModule(url);
        // console.log('m is ', m);
        if( m ) { utils.log('content', '未提供书源模块，但已通过Url找到匹配的模块'); }else{ utils.log('content', '未找到匹配的模块可以匹配当前网址：' + url);  return null; /** 没有查到书源插件模块，返回一个null */ }
    } 
    const dom = parseHtml( await request(url, (m.content.requestType || m.requestType||'GET'), {header: m.header, body: (m.content.postBody||null), encode: m.content.encode||m.encode||'utf-8'} ) ); 
    let _content = m.content.getContent(dom);
    if(m.content.nextHtml != undefined){
        const nextContentHtmlUrl = m.content.nextHtml(dom);
        console.log('检查下一页网址：'+nextContentHtmlUrl);
        if( nextContentHtmlUrl != false && nextContentHtmlUrl != null && nextContentHtmlUrl != '' && nextContentHtmlUrl != undefined){
            /* 存在下一页 */
            await utils.asleep(1000); //休眠1秒，从而避免被检测到爬虫而封IP
            const nextContent = await content(nextContentHtmlUrl, m);
            _content = _content + '\n' + nextContent; 
        }
    }
    return _content;
}

const reader = {
    init,
    search,
    bookInfo,
    tocList,
    book,
    content,
}