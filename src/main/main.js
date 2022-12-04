console.log('[main.js] - 开始执行main.js脚本 ' + (new Date()).toLocaleString());
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const request = require('./request.js');
const config = require('./config.js');
const opener = require('opener');
console.log('[main.js] - 完成加载库' + (new Date()).toLocaleString());

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true; /*阻止渲染进程弹出无用的安全警告*/

/**
 * 主窗口对象
 * @type BrowserWindow
 */
let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400, height: 700,
        webPreferences: {
            preload: path.join(__dirname, './preload.js'),
            devTools: true,
        }
    });
    // mainWindow.setMenu(null);
    mainWindow.loadFile('src/renderer/index.html');
    mainWindow.webContents.openDevTools(); /*开启*/
}
/*在打开窗口之前执行的初始化方法*/
function init() {
    /*检查本地路径的目录是否存在*/
    if (fs.existsSync(config.project_dir) == false) {
        console.log('path not exists: ', config.project_dir);
        fs.mkdirSync(config.project_dir);
    }
    if (fs.existsSync(config.project_data_dir) == false) {
        console.log('path not exists: ', config.project_data_dir);
        fs.mkdirSync(config.project_data_dir);
    }
    console.log('project dir is: ', __dirname);
}

app.whenReady().then(() => {
    console.log('[main.js] - 后台准备完毕，开始创建窗口' + (new Date()).toLocaleString());
    init();
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length == 0) { createWindow(); } });
    console.log('[main.js] - 窗口创建完毕' + (new Date()).toLocaleString());
});

app.on('window-all-closed', () => {
    if (process.platform != 'darwin') { app.quit(); }
});


async function onRendererRequest(url, reqType, args) {
    return await request(url, reqType, args);
}

ipcMain.handle('request-url', async (e, args) => {
    console.log("handle message: request-url");
    console.log(args);
    return await onRendererRequest(args.url, args.reqType, args.arguments);
});
ipcMain.handle('get-config', async (e, args) => {
    console.log('get-config', JSON.stringify(config));
    return config;
});
ipcMain.handle('save-chapter-content', async (e, args) => {
    return new Promise((resolveFunc, _) => {
        const bookName = args.bookName, chapterIndex = args.chapterIndex, text = args.text;
        console.log('save chapter content: ', bookName, chapterIndex, text.length);
        const bookDir = path.resolve(config.project_data_dir, bookName);
        const chapterContentPath = path.resolve(bookDir, chapterIndex + '.txt');
        if (fs.existsSync(bookDir) == false) { fs.mkdirSync(bookDir); }
        fs.writeFile(chapterContentPath, text, (err) => {
            console.log('write file state: ', err);
            if (err) { resolveFunc(false); } else { resolveFunc(true); }
        });
    });

});
ipcMain.handle('get-chapter-content', async (e, args) => {
    return new Promise((resolveFunc, _) => {
        const bookName = args.bookName, chapterIndex = args.chapterIndex;
        console.log('get chapter content: ', bookName, chapterIndex);
        const bookDir = path.resolve(config.project_data_dir, bookName);
        const chapterContentPath = path.resolve(bookDir, chapterIndex + '.txt');
        if (fs.existsSync(bookDir) == false) { resolveFunc({ state: -1, text: null }); }
        fs.readFile(chapterContentPath, { encoding: 'utf-8' }, (err, data) => {
            console.log('get data: ', data);
            if (err) { resolveFunc({ state: -2, text: null }); } else { resolveFunc({ state: 1, text: data }); }
        });
    });
});
ipcMain.handle('open-url-by-default-browser', async (e, args)=>{
    const url = args.url;
    opener(url);
});
