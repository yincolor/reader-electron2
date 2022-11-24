const info = (function(){
    const _infoPage = document.getElementsByClassName('page info')[0];
    const _view = _infoPage.getElementsByClassName('view')[0];
    const _head = _view.getElementsByClassName('head')[0];
    const _body = _view.getElementsByClassName('body')[0];
    const _foot = _view.getElementsByClassName('foot')[0];

    const _backBtn = _head.getElementsByClassName('btn-back-page')[0];

    const _bookNameElement = _body.getElementsByClassName('book_name')[0];
    const _bookAuthorElement=_body.getElementsByClassName('book_author')[0];
    const _sourceNameElement = _body.getElementsByClassName('source_name')[0];
    const _bookLatestChapterElement=_body.getElementsByClassName('book_latest_chapter')[0];
    const _bookIntroElement = _body.getElementsByClassName('book_intro')[0];

    function __rendererInfo(bookName, bookAuthor,sourceName, sourceUrl, bookLatestChapter, bookIntro){
        _bookNameElement.innerText = bookName;
        _bookAuthorElement.innerText=bookAuthor;
        _bookLatestChapterElement.innerText=bookLatestChapter;
        _bookIntroElement.innerText=bookIntro;

        _sourceNameElement.setAttribute('url', sourceUrl);
        _sourceNameElement.innerText = sourceName;
    }

    _backBtn.addEventListener('click', (e) => {
        utils.backPage();
    });

    return {
        renderer:__rendererInfo
    }
})();