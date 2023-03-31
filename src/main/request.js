console.log((new Date()).toLocaleString() + ' [request.js] - Start load request.js script. ');

const fetch = require('node-fetch');
const iconv = require('iconv-lite');
const fs = require('fs');

const DEFAULT_TIMEOUT = 4000; // 超时等待4000ms
const DEFAULT_HEADER = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:101.0) Gecko/20100101 Firefox/101.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate, br',
};

/** 判断是否为空的对象 */
function isNullObj(obj) {
    if (obj == undefined || obj == null) { return true; }
    if (JSON.stringify(obj) == '{}') { return true; }
    return false;
}

async function get(url, header, encode) {
    try {
        const res = await fetch(url, { method: 'GET',timeout: DEFAULT_TIMEOUT,headers: isNullObj(header) ? DEFAULT_HEADER : header });
        const buf = Buffer.from(await res.arrayBuffer());
        const str = iconv.decode(buf, encode);
        return str;
    } catch (error) {
        console.log(error); 
        return null;
    }
}

async function post(url, body, header, encode) {
    try {
        const res = await fetch(url, { method: 'post', timeout: DEFAULT_TIMEOUT, body: typeof (body) == 'string' ? body : JSON.stringify(body), headers: isNullObj(header) ? DEFAULT_HEADER : header });
        const buf = Buffer.from(await res.arrayBuffer());
        const str = iconv.decode(buf, encode);
        return str;
    } catch (error) {
        console.log(error);
        return null;
    }
}

/**
 * 请求网址数据
 * @param {String} url http://www.asd.....
 * @param {String} type 请求类型 GET || POST , 默认 GET
 * @param {{header:{}, body:{}, encode:String}} argument 参数，encode: 默认是utf-8
 * @returns {Promise<String|null>} 返回一个文本或NULL
 */
async function request(url, type = 'GET', args = {}) {
    args = args || {};
    const header = args.header || null;
    const body = args.body || null;
    const encode = args.encode || 'utf-8';
    if (type == 'GET') { return await get(url, header, encode);
    } else if (type == 'POST') { return await post(url, body, header, encode);
    } else if(type == 'LOCAL'){ return fs.readFileSync(url).toString('utf8');
    } else { return null; }
}

console.log((new Date()).toLocaleString() + ' [request.js] - Script request.js load completed. ');

module.exports = request; 