/** content页面的全局节点对象 */

// let content = {
//     __curPageIndex: 0,/*当前Content页面中文件翻到了第几页*/
//     set curPageIndex(val) { this.__curPageIndex = val; this.translateByIndex(val); },
//     get curPageIndex() { return this.__curPageIndex; },
//     curPageNum: 0, /*当前页面的分页数量*/
//     contentPage: document.getElementsByClassName('container')[0].getElementsByClassName('page content')[0],
//     contentHead: document.getElementsByClassName('container')[0].getElementsByClassName('page content')[0].getElementsByClassName('head')[0],
//     contentFoot: document.getElementsByClassName('container')[0].getElementsByClassName('page content')[0].getElementsByClassName('foot')[0],
//     contentBody: document.getElementsByClassName('container')[0].getElementsByClassName('page content')[0].getElementsByClassName('body')[0],
//     textContent: document.getElementsByClassName('container')[0].getElementsByClassName('page content')[0].getElementsByClassName('text_content')[0],
// };
// /** 方法 */



// content.setText = function (_str) {
//     this.textContent.innerHTML = _str;
//     content.init();
// }
// content.translateByIndex = function (pageIndex) {
//     if (pageIndex >= this.curPageNum) { console.error("翻页索引大于当前页面数"); return; }
//     console.log('翻页', pageIndex);
//     this.textContent.style.transform = `translateX(calc( (-100% - var(--text-content-padding) * 2 ) * ${pageIndex} ))`;
// }
// /** 初始化内容位置 */
// content.init = async function () {
//     console.log('content page init');
//     this.curPageNum = Math.floor(this.textContent.getBoundingClientRect().width / this.textContent.clientWidth);
//     this.curPageIndex = 0;
// }
// /** 向前翻页，如果当前为第0页，则 */
// content.pageForward = function () {
//     console.log('pageForward: ' + this.curPageIndex + ' -> ' + (this.curPageIndex - 1));
//     this.curPageIndex = this.curPageIndex - 1 < 0 ? 0 : this.curPageIndex - 1;
// }
// /** 向后翻页 */
// content.pageBackward = function () {
//     console.log('pageBackward: ' + this.curPageIndex + ' -> ' + (this.curPageIndex + 1));
//     this.curPageIndex = this.curPageIndex + 1 >= this.curPageNum ? this.curPageIndex : this.curPageIndex + 1;
// }

// /** 设置窗口尺寸变化时的监听 */
// window.addEventListener('resize', (_) => {
//     console.log('window resize: ', window.innerWidth, window.innerHeight);
//     /*更新curPageIndex和curPageNum，现在先暂定为重置为默认值然后重新计算*/
//     content.init();
// })

// /** 文本阅读界面事件 */
// content.contentBody.addEventListener('click', (e) => {
//     const rect = content.contentBody.getBoundingClientRect();
//     const x = e.pageX - rect.left, y = e.pageY - rect.top, width = rect.width, height = rect.height; /*鼠标在contentBody节点中点击的位置，contentBody的宽高*/
//     const w_1_3 = width / 3, w_2_3 = width * 2 / 3; /*将界面分成9个方块，中间“菜单”，左“上一页”，右“下一页”，中上“上一页”，中下“下一页”*/
//     const h_1_3 = height / 3, h_2_3 = height * 2 / 3;
//     let state = null;
//     /** 如果在菜单栏弹出的状态，点哪里都是切换菜单显示和隐藏 */
//     if (content.contentHead.classList.contains('hide')) {
//         console.log("当前菜单栏已经隐藏了");
//         if (x < w_1_3) {
//             state = '上一页';
//         } else if (x > w_2_3) {
//             state = '下一页';
//         } else if (y < h_1_3) {
//             state = '上一页';
//         } else if (y > h_2_3) {
//             state = '下一页';
//         } else { state = '菜单'; }
//     } else {
//         console.log("当前菜单栏没有弹出");
//         state = '菜单';
//     }

//     console.log('点击位置：', w_1_3, x, h_1_3, y, state);
//     switch (state) {
//         case '菜单': {
//             _changeDomHide(content.contentHead);
//             _changeDomHide(content.contentFoot);
//             break;
//         }
//         case '上一页': { content.pageForward(); break; }
//         case '下一页': { content.pageBackward(); break; }
//     }
// });


const content = (function () {

    const contentPage = document.getElementsByClassName('container')[0].getElementsByClassName('page content')[0];
    const contentHead = contentPage.getElementsByClassName('head')[0];
    const contentFoot = contentPage.getElementsByClassName('foot')[0];
    const contentBody = contentPage.getElementsByClassName('body')[0];
    const textContent = contentPage.getElementsByClassName('text_content')[0];
    const backBtn = contentHead.getElementsByClassName('btn-back-page')[0];

    const bookNameDiv = contentHead.getElementsByClassName('book-name')[0];
    const tocNameDiv = contentHead.getElementsByClassName('toc-name')[0];

    var __curPageIndex = 0; /*当前Content页面中文件翻到了第几页*/
    var __curPageNum = 0; /*当前页面的分页数量*/

    function __setCurPageIndex(_index) {
        __curPageIndex = _index;
        __translateByIndex(_index);
    }
    function __getCurPageIndex() {
        return __curPageIndex;
    }

    function __init(){
        __resetContentMeta();
    }

    /** 切换到当前章节内容的第几页 */
    function __translateByIndex(pageIndex) {
        if (pageIndex >= __curPageNum) { console.error("翻页索引大于当前页面数"); return; }
        console.log('翻页:' + pageIndex + '/' + __curPageNum);
        textContent.style.transform = `translateX(calc( (-100% - var(--text-content-padding) * 2 ) * ${pageIndex} ))`;
    }

    /** 重置内容参数，用来改变当前内容页数和当前内容页面索引 */
    function __resetContentMeta() {
        __curPageNum = Math.floor(textContent.getBoundingClientRect().width / textContent.clientWidth);
        __setCurPageIndex(0);
    }

    /** 设置界面上的章节内容，然后重置内容参数 */
    function __setText(_str) {
        textContent.innerHTML = _str;
        __resetContentMeta();
    }
    function __setBookName(_str){
        bookNameDiv.innerHTML = '《' + _str + '》';
    }
    function __setTocName(_str){
        tocNameDiv.innerHTML = _str;
    }

    function __rendererContent(contentStr, tocName, bookName){
        __setText(contentStr); 
        __setBookName(bookName);
        __setTocName(tocName);
    }



    /** 向前翻页，如果当前为第0页，则 */
    function __pageForward() {
        // console.log('pageForward: ' + this.curPageIndex + ' -> ' + (this.curPageIndex - 1));
        const curPageIndexOld = __getCurPageIndex();
        const curPageIndexNew = curPageIndexOld - 1 < 0 ? 0 : curPageIndexOld - 1;
        __setCurPageIndex(curPageIndexNew);
    }
    /** 向后翻页 */
    function __pageBackward() {
        // console.log('pageBackward: ' + this.curPageIndex + ' -> ' + (this.curPageIndex + 1));
        const curPageIndexOld = __getCurPageIndex();
        const curPageIndexNew = curPageIndexOld + 1 >= __curPageNum ? curPageIndexOld : curPageIndexOld + 1;
        __setCurPageIndex(curPageIndexNew);
    }

    /** 调整隐藏属性，对节点 */
    function _changeDomHide(dom) {
        if (dom.classList.contains('hide')) {
            dom.classList.remove('hide');
        } else { dom.classList.add('hide'); }
    }


    /** 设置窗口尺寸变化时的监听 */
    window.addEventListener('resize', (_) => {
        console.log('window resize: ', window.innerWidth, window.innerHeight);
        /*更新curPageIndex和curPageNum，现在先暂定为重置为默认值然后重新计算*/
        __init();
    });

    /** 设置对内容页面显示和隐藏的监听 */
    const class_option = { attributes: true, attributeFilter:['class'] };
    const md = new MutationObserver( async (mutationRecord,observer) => {
        // console.log(mutationRecord);
        // console.log(observer);
        const m0 = mutationRecord[0];
        if(m0.target.classList.contains('hide') == false){
            /*只有在进入内容页面的时候 才重加载内容*/
            console.log('重新初始化内容页面：', m0.target);
            __init();
        }
    });
    md.observe( contentPage , class_option);

    /** 文本阅读界面事件 */
    contentBody.addEventListener('click', (e) => {
        const rect = contentBody.getBoundingClientRect();
        const x = e.pageX - rect.left, y = e.pageY - rect.top, width = rect.width, height = rect.height; /*鼠标在contentBody节点中点击的位置，contentBody的宽高*/
        const w_1_3 = width / 3, w_2_3 = width * 2 / 3; /*将界面分成9个方块，中间“菜单”，左“上一页”，右“下一页”，中上“上一页”，中下“下一页”*/
        const h_1_3 = height / 3, h_2_3 = height * 2 / 3;
        let state = null;
        /** 如果在菜单栏弹出的状态，点哪里都是切换菜单显示和隐藏 */
        if (contentHead.classList.contains('hide')) {
            console.log("当前菜单栏已经隐藏了");
            if (x < w_1_3) {
                state = '上一页';
            } else if (x > w_2_3) {
                state = '下一页';
            } else if (y < h_1_3) {
                state = '上一页';
            } else if (y > h_2_3) {
                state = '下一页';
            } else { state = '菜单'; }
        } else {
            console.log("当前菜单栏没有弹出");
            state = '菜单';
        }

        // console.log('点击位置：', w_1_3, x, h_1_3, y, state);
        switch (state) {
            case '菜单': {
                _changeDomHide(contentHead);
                _changeDomHide(contentFoot);
                break;
            }
            case '上一页': { __pageForward(); break; }
            case '下一页': { __pageBackward(); break; }
        }
    });

    backBtn.addEventListener('click', (e)=>{ utils.backPage(); });

    return {
        init: __init, 
        setText:__setText,
        setBookName:__setBookName,
        setTocName: __setTocName,
        renderer:__rendererContent
    }
})();