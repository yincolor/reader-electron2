const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('local', {
    request: async function(url, reqType, arguments){
        const res = await ipcRenderer.invoke('request-url', {url, reqType, arguments});
        return res;
    },
    /*获取项目配置*/
    getConfig: async function(){
        const res = await ipcRenderer.invoke('get-config');
        return res;
    }, 
    /** 保存某个书籍的某个章节的文本 */
    saveChapterContent: async function(bookName, chapterIndex, text){
        const state = await ipcRenderer.invoke('save-chapter-content', {bookName, chapterIndex, text});
        console.log('[saveChapterContent]: ', state);
        return state;
    }, 
    /** 读取某个书籍的某个章节的文本 */
    getChapterContent: async function(bookName, chapterIndex){
        const res = await ipcRenderer.invoke('get-chapter-content', {bookName, chapterIndex});
        console.log('[getChapterContent]: ', res);
        return res;
    }
});

