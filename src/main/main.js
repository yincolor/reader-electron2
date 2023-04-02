console.log((new Date()).toLocaleString() + ' [main.js] - Start load main.js script. ');
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const request = require('./request.js');
const opener = require('opener');
console.log((new Date()).toLocaleString() + ' [main.js] - Library loading completed. ');

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true; /*阻止渲染进程弹出无用的安全警告*/

/** 根据是否已经打包返回对应的资源文件目录的路径 */
function __getResourceDir(){ 
    if(__dirname.indexOf('app.asar') >= 0){
        return path.join(__dirname, '../../../res/');
    } else {
        return path.join(__dirname, '../../res/') ; 
    }
}

/**
 * 主窗口对象
 * @type BrowserWindow
 */
let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({ 
        width: 700, height: 700, 
        webPreferences: { preload: path.join(__dirname, './preload.js'), devTools: true, }, 
        icon: path.join( __getResourceDir(), './icon.ico')
    });
    // mainWindow.setMenu(null);
    console.log((new Date()).toLocaleString() + ' [main.js] - icon path is: ' + path.join(__dirname, '../../..', 'res/icon.ico') );
    // mainWindow.setIcon( path.join( __getResourceDir(), 'icon.ico' ) );

    mainWindow.loadFile('src/renderer/index.html');
}

app.whenReady().then(() => {
    console.log((new Date()).toLocaleString() + ' [main.js] - App ready, start create main window. ');
    console.log((new Date()).toLocaleString() + ' [main.js] - Local dir is: ' + __dirname);
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length == 0) { createWindow(); } });
    console.log((new Date()).toLocaleString() + ' [main.js] - Main window creation completed. ');
});

app.on('window-all-closed', () => {
    console.log((new Date()).toLocaleString() + ' [main.js] - All windows closed, app close. ');
    if (process.platform != 'darwin') { app.quit(); }
});

async function onRendererRequest(url, reqType, args) { return await request(url, reqType, args); }

/** 主进程与渲染进程通信 */
ipcMain.handle('request-url', async (e, args) => { return await onRendererRequest(args.url, args.reqType, args.arguments); });
ipcMain.handle('open-url-by-default-browser', async (e, args) => {
    console.log((new Date()).toLocaleString() + ' [main.js] - Open url: ' + args.url);
    opener(args.url);
});
ipcMain.on('open-dev-tools', () => { mainWindow.webContents.openDevTools(); });
ipcMain.once('renderer-init-end', () => { console.log((new Date()).toLocaleString() + ' [main.js] - renderer process init end. '); });