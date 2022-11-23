const main = {
    page: document.getElementsByClassName('container')[0].getElementsByClassName('page main')[0],
    head: document.getElementsByClassName('container')[0].getElementsByClassName('page main')[0].getElementsByClassName('head')[0],
    body: document.getElementsByClassName('container')[0].getElementsByClassName('page main')[0].getElementsByClassName('body')[0],
    searchBtn: document.getElementsByClassName('container')[0].getElementsByClassName('page main')[0].getElementsByClassName('head')[0].getElementsByClassName('btn search')[0], 
    settingBtn: document.getElementsByClassName('container')[0].getElementsByClassName('page main')[0].getElementsByClassName('head')[0].getElementsByClassName('btn setting')[0], 
};


/** 设置用户响应事件 */
main.searchBtn.addEventListener('click', (e)=>{
    console.log(e.target);
    utils.gotoPage('search');

});

main.settingBtn.addEventListener('click', (e)=>{
    console.log(e.target);
    utils.gotoPage('setting');
});