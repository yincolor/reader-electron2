(function(){
    const _container = document.getElementsByClassName('container')[0];
    const _aboutPage = _container.getElementsByClassName('page about')[0];
    const _view = _aboutPage.getElementsByClassName('view')[0];
    const _head = _view.getElementsByClassName('head')[0];
    const _backBtn = _head.getElementsByClassName('btn-back-page')[0];
    const _shareApplicationBtn = _head.getElementsByClassName('btn-share-application')[0];

    _backBtn.addEventListener('click', (e)=>{
        utils.backPage();
    });

    _shareApplicationBtn.addEventListener('click', (e)=>{
        local.openUrlByDefaultBrowser('https://github.com/yincolor/reader-electron2');
    });
})();