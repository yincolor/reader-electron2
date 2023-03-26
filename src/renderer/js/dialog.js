/** 控制弹窗 */

document.getElementsByClassName('dialog_layer')[0].addEventListener('click', (e) => {
    console.log('dialog layer 被点击', e.target, e.target.innerText);
    // if (e.target.classList.contains('dialog_layer')) { __hideDialogLayer(); __clearDialogLayer(); }
});

function __onDialogMenuItemClicked(ele, callback) {
    const str = ele.innerText;
    callback(str);
}

function __createDialogMenu(strList, onBtnClickCallBack) {
    const dMenu = document.createElement('div');
    dMenu.classList.add('dialog', 'menu');
    const items = [];
    for (const s of strList) {
        const b = document.createElement('div');
        b.innerText = s;
        b.classList.add('btn');
        b.addEventListener('click', (e) => { onBtnClickCallBack(e.target.innerText) });
        items.push(b);
    }
    dMenu.append(...items);
    return dMenu;
}

function __createDialogAlert(str) {
    const alertDiv = document.createElement('div');
    const textDiv = document.createElement('div');
    const btnOkDiv = document.createElement('div');
    alertDiv.classList.add('dialog', 'alert');
    textDiv.classList.add('text');
    btnOkDiv.classList.add('btn');
    textDiv.innerText = str;
    btnOkDiv.innerText = '确定';
    alertDiv.append(textDiv, btnOkDiv);
    btnOkDiv.addEventListener('click', (e) => { __hideDialogLayer(); __clearDialogLayer(); })
    return alertDiv;
}

function __createDialogLoading(str){
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('dialog', 'loading');
    loadingDiv.innerText = str;
    return loadingDiv;
}

function __hideDialogLayer() {
    document.getElementsByClassName('dialog_layer')[0].classList.add('hide');
}

function __showDialogLayer() {
    document.getElementsByClassName('dialog_layer')[0].classList.remove('hide');
}

function __clearDialogLayer() {
    document.getElementsByClassName('dialog_layer')[0].innerHTML = "";
}

const dialog = {
    close: function(){
        __hideDialogLayer(); __clearDialogLayer();
    },
    menu: function (strList, onBtnClickCallBack) {
        __hideDialogLayer(); __clearDialogLayer();
        const dm = __createDialogMenu(strList, onBtnClickCallBack);
        document.getElementsByClassName('dialog_layer')[0].append(dm);
        __showDialogLayer();
    },
    alert: function (str) {
        __hideDialogLayer(); __clearDialogLayer();
        const alertDiv = __createDialogAlert(str);
        document.getElementsByClassName('dialog_layer')[0].append(alertDiv);
        __showDialogLayer();
    },
    loading: function(str){
        __hideDialogLayer(); __clearDialogLayer();
        const loadingDiv = __createDialogLoading(str);
        document.getElementsByClassName('dialog_layer')[0].append(loadingDiv);
        __showDialogLayer();
    },


}