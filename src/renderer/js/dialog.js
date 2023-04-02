/** 控制弹窗 */

// document.getElementsByClassName('dialog_layer')[0].addEventListener('click', (e) => {
//     console.log('dialog layer 被点击', e.target, e.target.innerText);
//     if (e.target.classList.contains('dialog_layer')) { __hideDialogLayer(); __clearDialogLayer(); }
// });

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

function __createDialogAddLocalBook() {
    const addLocalBookDiv = document.createElement('div');
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');
    const fLable = document.createElement('label');
    const fInput = document.createElement('input');
    const sLable = document.createElement('label');
    const selectEncode = document.createElement('select');
    const optionUTF8 = document.createElement('option');
    const optionGBK = document.createElement('option');
    const hr = document.createElement('hr');
    const okBtn = document.createElement('button');
    const noBtn = document.createElement('button');
    const msgLabel = document.createElement('label');

    sLable.innerText = '选择编码格式: ';
    optionUTF8.innerText = 'UTF-8';
    optionGBK.innerText = 'GBK';
    optionUTF8.classList.add('encode-utf8');
    optionGBK.classList.add('encode-gbk');
    selectEncode.append(optionUTF8, optionGBK);

    fLable.innerText = '选择本地文件: ';
    okBtn.innerText = '确定';
    noBtn.innerText = '取消';
    fInput.type = 'file';
    fInput.accept = 'text/*';

    okBtn.style.minWidth = '6em';
    noBtn.style.minWidth = '6em';
    div1.style.margin = '10px';
    div2.style.display = 'flex';
    div2.style.justifyContent = 'right';
    div2.style.gap = '1em';
    div2.style.margin = '10px';

    msgLabel.style.fontSize = '0.8em';
    msgLabel.style.color = 'red';

    div1.append(fLable, fInput, document.createElement('br'), sLable, selectEncode, document.createElement('br'), msgLabel);
    div2.append(okBtn, noBtn);
    addLocalBookDiv.append(div1, hr, div2);

    okBtn.addEventListener('click', async () => {
        console.log('加载文件：', fInput.value);
        if (fInput.value == "") {
            msgLabel.innerText = '没有选择文件';
            return null;
        }
        msgLabel.innerText = '正在加载文件...';
        if (fInput.files[0]) {
            const fname = fInput.files[0].name;
            const fdata = await utils.readTextFile(fInput.files[0], selectEncode.value);
            if(fdata){
                msgLabel.innerText = '正在将文件导入软件'; 
                await shelfManager.addBookFromText(fname, fdata); 
                msgLabel.innerText = '导入文本成功';
            } else {
                msgLabel.innerText = '读取文本失败';
            }
        } else {
            msgLabel.innerText = '读取文本失败';
        }

    });
    noBtn.addEventListener('click', () => { dialog.close(); });
    return addLocalBookDiv;
}

function __createDialogLoading(str) {
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
    close: function () {
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
    loading: function (str) {
        __hideDialogLayer(); __clearDialogLayer();
        const loadingDiv = __createDialogLoading(str);
        document.getElementsByClassName('dialog_layer')[0].append(loadingDiv);
        __showDialogLayer();
    },
    addLocalBook: function () {
        __hideDialogLayer(); __clearDialogLayer();
        const _div = __createDialogAddLocalBook();
        document.getElementsByClassName('dialog_layer')[0].append(_div);
        __showDialogLayer();
    }

}