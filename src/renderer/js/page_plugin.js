const plugin = (function () {
    const _container = document.getElementsByClassName('container')[0];
    const _pluginPage = _container.getElementsByClassName('page plugin')[0];
    const _view = _pluginPage.getElementsByClassName('view')[0];
    const _head = _view.getElementsByClassName('head')[0];
    const _body = _view.getElementsByClassName('body')[0];
    const _foot = _view.getElementsByClassName('foot')[0];
    const _pluginList = _body.getElementsByClassName('plugin_list')[0];
    const _selectAllBtn = document.getElementById('sleect_all_plugins');
    const _selectInvertBtn = _foot.getElementsByClassName('btn select_invert')[0];
    const _deleteBtn = _foot.getElementsByClassName('btn delete')[0];
    const _backBtn = _head.getElementsByClassName('btn btn-back-page')[0];
    const _addBtn = _head.getElementsByClassName('btn btn-add-plugin')[0];

    async function __init() {
        await __updateWindowPluginList(); /*更新插件列表界面*/
    }

    async function __update() {
        await __updateWindowPluginList();
    }

    /** 新增书源 */
    function openAddPluginItemDialog() {
        const dialogLayer = utils.clearDialogLayer();
        dialogLayer.innerHTML = '';
        const textArea = document.createElement('textarea');
        textArea.rows = 15; textArea.cols = 60;
        const okBtn = document.createElement('button'); okBtn.innerText = '确定';
        okBtn.addEventListener('click', async function (e) {
            console.log('[openAddPluginItemDialog] click ok');
            const str = textArea.value;
            console.log(str);
            const state = await sourceManager.addSource(str);
            if (state) {
                console.log("[openAddPluginItemDialog] 书源添加成功");
                await __updateWindowPluginList();
                utils.hideDialogLayer();
            } else {
                console.log("[openAddPluginItemDialog] 书源添加失败");
            }
        });
        const cancelBtn = document.createElement('button'); cancelBtn.innerText = '取消';
        cancelBtn.addEventListener('click', (e) => { console.log('[openAddPluginItemDialog] click cancel'); utils.hideDialogLayer(); });
        const dialog = document.createElement('div');
        dialog.classList.add('dialog');
        dialog.append(textArea, okBtn, cancelBtn);
        dialogLayer.append(dialog);
        utils.showDialogLayer();
    }

    /** 更新 编辑书源按钮点击事件 */
    async function __onSourceEditBtnClicked(e) {
        /* 获取书源 */
        console.log(e);
        const _url = e.getAttribute('url');
        const source = await sourceManager.getSourceByUrl(_url);
        const jsonStr = source['source_json'];
        /* 创建弹窗 */
        const dialogLayer = utils.clearDialogLayer();
        dialogLayer.innerHTML = '';
        const textArea = document.createElement('textarea');
        textArea.rows = 15; textArea.cols = 60; textArea.value = jsonStr;
        const okBtn = document.createElement('button'); okBtn.innerText = '确定';
        okBtn.addEventListener('click', async function (e) {
            console.log('[onSourceEditBtnClicked] click ok');
            const newStr = textArea.value;
            const state = await sourceManager.updateSource(_url, newStr);
            if (state) {
                console.log("[onSourceEditBtnClicked] 书源更新成功");
                await __updateWindowPluginList();
                utils.hideDialogLayer();
            } else {
                console.log("[onSourceEditBtnClicked] 书源更新失败");
            }
        });
        const cancelBtn = document.createElement('button'); cancelBtn.innerText = '取消';
        cancelBtn.addEventListener('click', (e) => {
            console.log('[onSourceEditBtnClicked] click cancel');
            utils.hideDialogLayer();
        });
        const dialog = document.createElement('div');
        dialog.classList.add('dialog');
        dialog.append(textArea, okBtn, cancelBtn);
        dialogLayer.append(dialog);
        utils.showDialogLayer();
    }

    /** 更新界面上的书源列表 */
    async function __updateWindowPluginList() {
        const sourceList = await sourceManager.getAllSource();
        _pluginList.innerHTML = "";
        if (sourceList) {
            const sourceItemHtmlList = [];
            for (const source of sourceList) {
                const url = source['source_url'], name = source['source_name'], is_use = source['is_use'];
                const itemHTML = `<div class="item" url="${url}"> 
                    <input class="checkbox selected" type="checkbox" name="" > 
                    <div class="name">${name}</div>
                    <div>|启用:</div> <input class='checkbox enable' type="checkbox" ${is_use == 1 ? "checked='checked'" : ""} > 
                    <div> | </div> <div class="btn edit">编辑</div> 
                    </div>`;
                sourceItemHtmlList.push(itemHTML);
            }
            _pluginList.innerHTML = sourceItemHtmlList.join('\n');
        }
    }

    /** 新增书源按钮点击事件 */
    _addBtn.addEventListener('click', (e) => {
        openAddPluginItemDialog();
    })

    /** 页面返回按钮点击事件 */
    _backBtn.addEventListener('click', (e) => {
        utils.backPage();
    });

    /** 书源列表点击事件，根据不同的点击元素来执行不同的事件 */
    _pluginList.addEventListener('click', async (e) => {
        console.log(e.target, e.target.classList, e.target.parentNode);
        /*书源项 - 编辑按钮点击事件*/
        if (e.target.classList.contains('edit')) {
            const _item = e.target.parentNode;
            await __onSourceEditBtnClicked(_item);
            return true;
        }
        /*书源项 - 生效选项框点击事件*/
        if (e.target.classList.contains('enable') && e.target.classList.contains('checkbox')) {
            const _item = e.target.parentNode;
            await sourceManager.updateSourceUseState(_item.getAttribute('url'), e.target.checked ? 1 : 0);
            return true;
        }
    });
    /*全选选项框点击事件*/
    _selectAllBtn.addEventListener('click', (e)=>{
        const checkState = e.target.checked;
        console.log('全选选项框点击事件', checkState);
        for (const sourceItem of _pluginList.getElementsByClassName('item')) {
            sourceItem.getElementsByClassName('checkbox selected')[0].checked = checkState;
        }
        return true;
    });
    /*反选按钮点击事件*/
    _selectInvertBtn.addEventListener('click', (e)=>{
        for (const sourceItem of _pluginList.getElementsByClassName('item')) {
            const checkedBox = sourceItem.getElementsByClassName('checkbox selected')[0] ; 
            checkedBox.checked = checkedBox.checked == true ? false:true;
        }
        return true;
    });
    /** 删除选中按钮点击事件 */
    _deleteBtn.addEventListener('click', async (e)=>{
        const sourceUrlList = [];
        for(const sourceItem of _pluginList.getElementsByClassName('item')){
            const checkedBox = sourceItem.getElementsByClassName('checkbox selected')[0] ; 
            if(checkedBox.checked){
                sourceUrlList.push(sourceItem.getAttribute('url'));
            }
        }
        let rows = 0;
        if(sourceUrlList.length > 0){
            console.log('需要删除：', sourceUrlList);
            rows = await sourceManager.removeSource(sourceUrlList);
            await __updateWindowPluginList();
        }
        console.log("删除书源，数量：", rows);
    });
    

    return {
        init: __init,
        update: __update
    };
})();