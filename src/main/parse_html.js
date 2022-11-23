const cheerio = require('cheerio');
const fs = require('fs');


class Element {
    constructor(name, type, data, attrs, childList) {
        this.name = name, this.type = type, this.data = data, this.attrs = attrs, this.child = childList || [];
    }
    setChildList(childList) { this.child = childList; }
    appendChild(child) { this.child.push(child); }
    text() { return this.data; }
    getAttr(key) { return this.attrs[key] }
    getClassList(){ 
        const classStr = this.attrs['class'];
        if(classStr){
            return classStr.split(' ');
        }
        return [];
    }
    getElementById(id_str, option) {
        const _recurrence = (option && option['recurrence']) ? option['recurrence'] : true; // 默认需要递归遍历寻找节点
        for (const el of this.child) {
            if (el.attrs.id && el.attrs.id == id_str) { return el; }
            if (_recurrence && el.child.length > 0) {
                const element = el.getElementById(id_str);
                if (element && element.attrs && element.attrs.id && element.attrs.id == id_str) { return element; }
            }
        }
    }
    getElementsByAttr(_key, _val) {
        let _elList = [];
        for (const el of this.child) {
            if (el.attrs[_key] && el.attrs[_key] == _val) { _elList.push(el); }
            if (el.child.length > 0) {
                const childElList = el.getElementsByAttr(_key, _val);
                if (childElList && childElList.length && childElList.length > 0) {
                    _elList = _elList.concat(childElList);
                }
            }
        }
        return _elList;
    }

    getElementsByClassName(_class_name) {
        let _elList = [];
        for (const el of this.child) {
            if (el.attrs['class']) {
                const classList = el.attrs['class'].split(' ');
                if (classList.length > 0 && classList.includes(_class_name)) {
                    _elList.push(el);
                }
            }
            if (el.child.length > 0) {
                const childElList = el.getElementsByClassName(_class_name);
                if (childElList && childElList.length && childElList.length > 0) {
                    _elList = _elList.concat(childElList);
                }
            }
        }
        return _elList;
    }

    getElementsByTagName(_tag_name) {
        let _elList = [];
        for (const el of this.child) {
            if (el.type == 'tag' && el.name == _tag_name) { _elList.push(el); }
            if (el.child.length > 0) {
                const childElList = el.getElementsByTagName(_tag_name);
                _elList = _elList.concat(childElList);
            }
        }
        return _elList;
    }

    getElementsByTypeName(_type_name) {
        let _elList = [];
        for (const el of this.child) {
            if (el.type == _type_name) { _elList.push(el); }
            if (el.child.length > 0) {
                const childElList = el.getElementsByTypeName(_type_name);
                _elList = _elList.concat(childElList);
            }
        }
        return _elList;
    }

    text() {
        return this.getElementsByTypeName('text').map((el) => { return el.data; }).join('\n');
    }
    href() {
        return this.attrs.href || '';
    }
}

/** 递归遍历xml文本节点，生成节点对象树 */
function loopHtml(root) {
    let childs = root.children;
    let _elList = [];
    if (childs) {
        for (const el of childs) {
            if (el) {
                let tag = {
                    obj_name: el.constructor.name,
                    name: el.name || "",
                    type: el.type,
                    data: el.data || "",
                    attrs: el.attribs || [],
                    child: loopHtml(el)
                };
                _elList.push(new Element(tag.name, tag.type, tag.data, tag.attrs, tag.child));
                
            }
        }
    }
    return _elList;
}

/**
 * 解析HTML，返回格式化的节点树
 * @param {String} textHtml HTML网页文本 
 * @returns Element 节点树
 */
function parseHtml(textHtml) {
    const br_reg = new RegExp('<br/*>', 'g');
    const text = textHtml.replace(br_reg, '\n');
    const $ = cheerio.load(text); // 解析HTML文本
    return new Element('document', 'tag', '', {}, loopHtml($._root));
}

module.exports = parseHtml;



// fs.readFile('.\\module\\test.html', (err, data) => {
//     let res = data.toString();
//     const br_reg = new RegExp('<br/*>', 'g');
//     res = res.replace(br_reg, '\n');
//     const $ = cheerio.load(res); // 解析HTML文本
//     const dom = new Element('document', 'tag', '', {}, loopHtml($._root));

//     console.log(dom.getElementsByClassName('footer_link')[0].getElementsByTagName('a').map((el)=>{
//         return el.text().replace(/\n/g,'\\n').replace(/\t/g,'\\t');
//     }));
//     fs.writeFileSync("./1.txt", dom.getElementById('content').text());
// });

