/** content页面的全局节点对象 */
const content = {
    __curPageIndex: 0,/*当前Content页面中文件翻到了第几页*/
    set curPageIndex(val) { this.__curPageIndex = val; this.translateByIndex(val); },
    get curPageIndex() { return this.__curPageIndex; },
    curPageNum: 0, /*当前页面的分页数量*/
    contentPage: document.getElementsByClassName('container')[0].getElementsByClassName('page content')[0],
    contentHead: document.getElementsByClassName('container')[0].getElementsByClassName('page content')[0].getElementsByClassName('head')[0],
    contentFoot: document.getElementsByClassName('container')[0].getElementsByClassName('page content')[0].getElementsByClassName('foot')[0],
    contentBody: document.getElementsByClassName('container')[0].getElementsByClassName('page content')[0].getElementsByClassName('body')[0],
    textContent: document.getElementsByClassName('container')[0].getElementsByClassName('page content')[0].getElementsByClassName('text_content')[0],
};
/** 方法 */

content.setText = function(_str) {
    this.textContent.innerHTML = _str;
    content.init();
}
content.translateByIndex = function(pageIndex){ 
    if(pageIndex >= this.curPageNum){ console.error("翻页索引大于当前页面数"); return ; }
    console.log('翻页', pageIndex);
    this.textContent.style.transform = `translateX(calc( (-100% - var(--text-content-padding) * 2 ) * ${pageIndex} ))`; 
}
/** 初始化内容位置 */
content.init = async function() {
    console.log('content page init');
    this.curPageNum = Math.floor(this.textContent.getBoundingClientRect().width / this.textContent.clientWidth);
    this.curPageIndex = 0;
}
/** 向前翻页，如果当前为第0页，则 */
content.pageForward = function() { 
    console.log('pageForward: '+this.curPageIndex + ' -> ' + (this.curPageIndex - 1));
    this.curPageIndex = this.curPageIndex - 1 < 0?0:this.curPageIndex - 1;
}
/** 向后翻页 */
content.pageBackward = function() { 
    console.log('pageBackward: ' + this.curPageIndex + ' -> ' + (this.curPageIndex + 1));
    this.curPageIndex = this.curPageIndex + 1 >= this.curPageNum?this.curPageIndex:this.curPageIndex + 1;
}

/** 设置窗口尺寸变化时的监听 */
window.addEventListener('resize', (_)=>{
    console.log('window resize: ', window.innerWidth, window.innerHeight);
    /*更新curPageIndex和curPageNum，现在先暂定为重置为默认值然后重新计算*/
    content.init();
})

/** 文本阅读界面事件 */
content.contentBody.addEventListener('click', (e) => {
    const rect = content.contentBody.getBoundingClientRect();
    const x = e.pageX - rect.left, y = e.pageY - rect.top, width = rect.width, height = rect.height; /*鼠标在contentBody节点中点击的位置，contentBody的宽高*/
    const w_1_3 = width / 3, w_2_3 = width * 2 / 3; /*将界面分成9个方块，中间“菜单”，左“上一页”，右“下一页”，中上“上一页”，中下“下一页”*/
    const h_1_3 = height / 3, h_2_3 = height * 2 / 3;
    let state = null;
    /** 如果在菜单栏弹出的状态，点哪里都是切换菜单显示和隐藏 */
    if ( content.contentHead.classList.contains('hide')) {
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

    console.log('点击位置：', w_1_3, x, h_1_3, y, state);
    switch(state){
        case '菜单':{
            _changeDomHide(content.contentHead);
            _changeDomHide(content.contentFoot);
            break;
        }
        case '上一页': { content.pageForward(); break; }
        case '下一页': { content.pageBackward(); break; }
    }
});