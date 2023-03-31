const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('local', {
    request: async function(url, reqType, arguments){ return await ipcRenderer.invoke('request-url', {url, reqType, arguments}); },
    openUrlByDefaultBrowser: async function (url){ await ipcRenderer.invoke('open-url-by-default-browser', {url}); },
    openDevTools: ()=>{ ipcRenderer.send('open-dev-tools'); },
});

