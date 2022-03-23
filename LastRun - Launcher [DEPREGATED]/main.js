const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');

const log = require('electron-log');

const fileSystem = require('./file-system/file-system');
const installer = require('./file-system/installer');
const loginSystem = require('./file-system/login-system');
const requests = require('./networking/requests');
const Installer = new installer();
const FileSystem = new fileSystem();
const Requests = new requests();
const LoginSystem = new loginSystem();

const WINDOWS = {};
let RUNNING = false;
let LOGIN = false;

const createWindow = async () => {
    const win = new BrowserWindow({
        width: 900,
        height: 600,
        minWidth: 900,
        minHeight: 600,
        maxWidth: 1200,
        maxHeight: 800,
        frame: false,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(app.getAppPath(), 'windows/window-main.js')
        }
    });

    WINDOWS['MAIN'] = win;
    win.loadFile(path.join(__dirname, 'windows/window-main.html'));

    win.webContents.once('did-finish-load', () => {
        win.show();
        log.info('Window Initialized.');
    })

    win.on('focus', () => {
        if(WINDOWS['LOGIN'] != null){
            WINDOWS['LOGIN'].focus();
        }
    });

    win.on('close', () => {
        delete WINDOWS['MAIN'];
    });

}

const createLoginWindow = async () => {
    if(LOGIN) return;

    const win = new BrowserWindow({
        parent: WINDOWS['MAIN'],
        width: 450,
        height: 600,
        minWidth: 450,
        minHeight: 600,
        maxWidth: 450,
        maxHeight: 600,
        frame: false,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(app.getAppPath(), 'windows/window-login.js')
        }
    });

    win.setAlwaysOnTop(true);

    WINDOWS['LOGIN'] = win;
    win.loadFile(path.join(__dirname, 'windows/window-login.html'));

    LOGIN = true;
    WINDOWS['MAIN'].webContents.send('login:start', null);

    win.webContents.once('did-finish-load', () => {
        win.show();
    });

    win.on('close', () => {
        delete WINDOWS['LOGIN'];
        LOGIN = false;
        WINDOWS['MAIN'].webContents.send('login:end', null);
    });
}

const InitializeSystems = async () => {

    try{
        await FileSystem.Initialize(app);
    } catch(err) {
        log.error(err);
        throw err;
    }

    try{
        await Installer.Initialize(WINDOWS['MAIN'], FileSystem);
    } catch(err) {
        log.error(err);
    }
    
    await Requests.getVersionData()
    .then(versionData => {
        FileSystem.InitializeVersion(versionData);
    })
    .catch(err => {
        log.error(err);
    });

    try{
        await LoginSystem.Initialize(Requests, FileSystem);
    } catch(err) {
        log.error(err);
    }

    try{
        await FileSystem.GetSessionDetails()
        .then(details => {
            LoginSystem.LoginFromSessionDetails(details.username, details.session_id)
            .then(account => {
                WINDOWS['MAIN'].webContents.send('login:update', {status: true, username: account.username});
            })
            .catch(err => {
                log.error(err);
                WINDOWS['MAIN'].webContents.send('login:update', {status: false, username: null});
            });

        });
    } catch(err) {
        log.error(err);
    }

}

const initializeVersions = async (event, args) => {
    await InitializeSystems();

    log.info('Systems initialized');

    await FileSystem.getVersion()
    .then(version => {

        const data = {
            name: String,
            upToDate: Boolean,
            beta: Boolean
        };

        data.name = version.name;
        data.upToDate = version.upToDate;
        data.beta = version.beta;
        data.isInitial = version.isInitial;
        event.returnValue = data;

        log.info('Successfully returned version data');
    })
    .catch(err => {

        if(err == 404){ 
            event.returnValue = {
                title: `Couldn't connect to servers [${404}]`,
                errorCode: 404,
                fields: [
                    {
                        textContent: "> Launcher couldn't connect to servers. Please check your internet connection and server status from :link:",
                        primary: true
                    },
                    {
                        textContent: "> Offline mode is not currently supported. ",
                        primary: false
                    }
                ],
                buttonText: '> Okay'
            };
        }
        else{
            log.error(err);
            throw err;
        }
    });
}

const runGame = async () => {
    if(RUNNING) { return; }

    try{

        RUNNING = true;
        
        const process = await FileSystem.runVersion()
        
        WINDOWS['MAIN'].webContents.send('main:game-start');
        switch(process){

            case 'CLOSED':
                
            RUNNING = false;

                WINDOWS['MAIN'].webContents.send('main:game-quit');
                log.info('Game was closed.');

                break;
        }

    } catch(err) {
        log.error(err);

        switch(err.code){
            case 404:
                WINDOWS['MAIN'].webContents.send('error', {
                    title: `Failed to launch the game [${err.code}]`,
                    errorCode: err.code,
                    fields: [
                        {
                            textContent: "> Game couldn't be launched. Please navigate to 'Settings' > 'Reinstall' to fix the issue.",
                            primary: true
                        },
                        {
                            textContent: "> This was caused by a missing file in game directory. Make sure you always allow the installation to complete and do not edit or remove contents of the version files.",
                            primary: false
                        },
                        {
                            textContent: `> Missing file: ${err.file}`,
                            primary: false
                        }
                    ],
                    buttonText: '> Okay'
                });
                break;

            default:
                WINDOWS['MAIN'].webContents.send('error', {
                    title: `Failed to launch the game [${err.code}]`,
                    errorCode: err.code,
                    fields: [
                        {
                            textContent: "> Game couldn't be launched. Please navigate to 'Settings' > 'Reinstall' to fix the issue.",
                            primary: true
                        },
                        {
                            textContent: "> This is most commonly caused by corrupted file or failed installation. Everything should be fixed by reinstalling the game.",
                            primary: false
                        }
                    ],
                    buttonText: '> Okay'
                });
                break;
        }

        return;
    }
}

const updateGame = async () => {
    try{

        await Installer.InstallVersion();

    } catch(err) {
        switch(err.errno){
            case -4073:
                WINDOWS['MAIN'].webContents.send('error', {
                    title: `Installation aborted due to network conditions [${err.errno}]`,
                    errorCode: err.errno,
                    fields: [
                        {
                            textContent: "> Installation couln't be finished due to error that occured in the download process.",
                            primary: true
                        },
                        {
                            textContent: "> Please check your network connection.",
                            primary: false
                        }
                    ],
                    buttonText: '> Okay'
                });
                break;
            case -408:
                WINDOWS['MAIN'].webContents.send('error', {
                    title: `Installation aborted due to network conditions [${err.errno}]`,
                    errorCode: err.errno,
                    fields: [
                        {
                            textContent: "> Installation couln't be finished due to error that occured in the download process.",
                            primary: true
                        },
                        {
                            textContent: "> Please check your network connection.",
                            primary: false
                        }
                    ],
                    buttonText: '> Okay'
                });
                break;

            default:
                log.error(err);
                throw err;
        }

        log.error(err);

    }
}

const getPaths = async (event, args) => {
    event.returnValue = {
        versions: FileSystem.getDirectoryPath(),
        logs: FileSystem.getApplicationLogsPath()
    };
}

const login = async (event, args) => {
    log.info('Loggin in...');

    await LoginSystem.TryToLogin(args.username, args.password)
    .then(account => {

        event.returnValue = {status: 'SUCCESS'}

        WINDOWS['LOGIN'].close();
        WINDOWS['MAIN'].webContents.send('login:update', {status: true, username: account.username})
    })
    .catch(err => {
        log.error(err);

        event.returnValue = {status: 'FAILED', error: err.error}
    });
    
    
}

app.whenReady().then(async() => {
    createWindow();
});

ipcMain.on('intialize:list-versions', async (event, args) => {
    initializeVersions(event, args);
})

ipcMain.on('game:start', async () => {
    runGame();
});

ipcMain.on('update:start', async () => {
    updateGame();
});

ipcMain.on('main:reinitialize', async (event, ergs) => {
    await InitializeSystems();
    event.returnValue = 'DONE';
});

ipcMain.on('filesystem:paths', (event, args) => {
    getPaths(event, args);
});

ipcMain.on('file-explorer:versions', () => {
    const path = FileSystem.getDirectoryPath();
    shell.openPath(path);
});

ipcMain.on('file-explorer:logs', () => {
    const path = FileSystem.getApplicationLogsPath();
    shell.openPath(path);
});

ipcMain.on('dev:devtools', () => {
    WINDOWS['MAIN'].webContents.openDevTools();
});

ipcMain.on('dev:relaunch', () => {
    app.relaunch();
    app.quit();
});



ipcMain.on('account:start-login', () => {
    createLoginWindow();
});

ipcMain.on('account:initialize-login-window', (event, args) => {
    LoginSystem.InitializeLoginSession(WINDOWS['LOGIN-SYSTEM']);
    event.returnValue = 200;
})

ipcMain.on('account:login', (event, args) => {
    login(event, args);
});

ipcMain.on('main:minimize', () => {
    WINDOWS['MAIN'].minimize();
});

ipcMain.on('main:maximize', () => {
    WINDOWS['MAIN'].maximize();
});

ipcMain.on('main:close', () => {
    app.quit();
});

ipcMain.on('login:minimize', () => {
    WINDOWS['MAIN'].minimize();
});

ipcMain.on('login:maximize', () => {
    WINDOWS['LOGIN'].maximize();
});

ipcMain.on('login:close', () => {
    WINDOWS['LOGIN'].close();
});