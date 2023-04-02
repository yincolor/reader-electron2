const setting = (function(){
    const _container = document.getElementsByClassName('container')[0];
    const _settingPage = _container.getElementsByClassName('page setting')[0];
    const _view = _settingPage.getElementsByClassName('view')[0];
    const _head = _view.getElementsByClassName('head')[0];
    const _body = _view.getElementsByClassName('body')[0];
    const _backBtn = _head.getElementsByClassName('btn btn-back-page')[0];
    const _sourcePluginBtn = _body.getElementsByClassName('btn source-plugin')[0];
    const _cacheBtn = _body.getElementsByClassName('btn cache')[0];
    const _devToolsBtn = _body.getElementsByClassName('btn dev-tools')[0]; 
    const _aboutBtn = _body.getElementsByClassName('btn about')[0];
    const _addLocalBookBtn = _body.getElementsByClassName('btn add-local-book')[0]; 

    _sourcePluginBtn.addEventListener('click', (e)=>{
        utils.gotoPage('plugin');
    });
    _backBtn.addEventListener('click', (e)=>{
        utils.backPage();
    });
    _aboutBtn.addEventListener('click', (e)=>{
        utils.gotoPage('about');
    });
    _devToolsBtn.addEventListener('click', ()=>{ 
        local.openDevTools();
    }); 
    _cacheBtn.addEventListener('click', ()=>{
        utils.gotoPage('cache');
    });
    _addLocalBookBtn.addEventListener('click', ()=>{
        dialog.addLocalBook();
    });
})();