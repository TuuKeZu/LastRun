const { ipcRenderer, BrowserWindow } = require('electron');
const errors = require('../utility/window-errors');

document.addEventListener('DOMContentLoaded', async () => {
    await Initialize();
    InitializeSideBar();
    InitializeNavBar();
});

const state = {
    isRunning: false,
    isInstalling: false,
    hasUpdate: true,
    isInitalInstallation: false,
    version: {
        name: String,
        beta: Boolean,
    },
    paths: {
        versions: String,
        logs: String,
    },
    account: {
        username: String
    }
}

const menu = {
    open: false
}

const Initialize = async () => {
    const version = await ipcRenderer.sendSync('intialize:list-versions', null);

    console.log(version);

    if(version.name == null){ 
        const error = errors.createError(version);

        document.getElementById('CONTAINER').appendChild(error.element);
        error.button.addEventListener('click', () => { onClickError(error.element, true)})
    }
    
    state.isInitalInstallation = version.isInitial;
    state.hasUpdate = !version.upToDate;
    state.version.name = version.name;
    state.version.beta = version.beta;

    const paths = await ipcRenderer.sendSync('filesystem:paths', '');

    state.paths.versions = paths.versions;
    state.paths.logs = paths.logs;

    UpdateButtons();
}


ipcRenderer.on('error', (event, err) => {
    const fatal = err.fatal;
    const error = errors.createError(err);

    document.getElementById('CONTAINER').appendChild(error.element);
    error.button.addEventListener('click', () => { onClickError(error.element, fatal)})

});



ipcRenderer.on('installer:start-installation', () => {

    startInstallation();

});

ipcRenderer.on('installer:installation-status', (event, options) => {

    onUpdateInstallationStatus(options);

});

ipcRenderer.on('installer:finish-installation', () => {

    finishInstallation();

});

ipcRenderer.on('main:game-start', () => {

    state.isRunning = true;
    UpdateButtons();

});

ipcRenderer.on('main:game-quit', () => {

    state.isRunning = false;
    UpdateButtons();

});

ipcRenderer.on('login:start', () => {
    onUpdateLoginOverlay(true);
});

ipcRenderer.on('login:end', () => {
    onUpdateLoginOverlay(false);
});

ipcRenderer.on('login:update', (event, details) => {
    onUpdateLoginDetails(details);
});

const InitializeSideBar = async () => {

    document.getElementById('INTERCATION-BUTTON').addEventListener('click', () => {
        onClick();
    });

    document.getElementById('LOGIN-BUTTON').addEventListener('click', () => {
        onLogin();
    });

    const SIDE_BAR_BUTTON = document.getElementById('SIDE-BAR-BUTTON');

    const MENU_OPEN_VERSIONS = document.getElementById('MENU-OPEN-VERSIONS');
    const MENU_REINSTALL = document.getElementById('MENU-REINSTALL');
    const MENU_OPEN_LOGS = document.getElementById('MENU-OPEN-LOGS');
    const MENU_F12 = document.getElementById('MENU-F12');
    const MENU_RESTART = document.getElementById('MENU-RELAUNCH');
    const MENU_QUIT = document.getElementById('MENU-QUIT');

    const VERSION_PATH = document.getElementById('VERSION-PATH');
    const LOG_PATH = document.getElementById('LOG-PATH');
    const MENU_VERSION_TEXT = document.getElementById('MENU-VERSION-TEXT');

    SIDE_BAR_BUTTON.addEventListener('click', () => { onSidebarClick(); });
    
    MENU_OPEN_VERSIONS.addEventListener('click', () => { onMenuClick(0); });
    MENU_REINSTALL.addEventListener('click', () => { onMenuClick(1); });
    MENU_OPEN_LOGS.addEventListener('click', () => { onMenuClick(2); });
    MENU_F12.addEventListener('click', () => { onMenuClick(3); });
    MENU_RESTART.addEventListener('click', () => { onMenuClick(4); });
    MENU_QUIT.addEventListener('click', () => { onMenuClick(5); });

    VERSION_PATH.textContent = `${state.paths.versions.substring(0, 20)}...`;
    LOG_PATH.textContent = `${state.paths.logs.substring(0, 20)}...`;
    MENU_VERSION_TEXT.textContent = state.version.name;
}

const InitializeNavBar = () => {
    const MINIMIZE = document.getElementById('MINIMIZE');
    const MAXIMIZE = document.getElementById('MAXIMIZE');
    const CLOSE = document.getElementById('CLOSE');

    MINIMIZE.addEventListener('click', () => {
        ipcRenderer.send('main:minimize', null);
    });

    MAXIMIZE.addEventListener('click', () => {
        ipcRenderer.send('main:maximize', null);
    });

    CLOSE.addEventListener('click', () => {
        ipcRenderer.send('main:close', null);
    });
}

const onUpdateLoginDetails = (details = {status: Boolean, username: String}) => {
    const USERNAME_FIELD = document.getElementById('USERNAME-FIELD');
    const LOGIN_STATUS_FIELD = document.getElementById('LOGIN-STATUS');

    console.log(details);

    switch(details.status){
        case true:
            state.account.username = details.username;

            USERNAME_FIELD.textContent = details.username;
            LOGIN_STATUS_FIELD.textContent = '> Logged in';
            break;
        case false:
            state.account.username = null;

            USERNAME_FIELD.textContent = 'Log In';
            LOGIN_STATUS_FIELD.textContent = '> Logged out';
            break;
    }
}   

const UpdateButtons = () => {

    const VERSION_NUMBER = document.getElementById('VERSION-NUMBER')
    const VERSION_FIELD = document.getElementById('VERSION-FIELD')
    const DOWNLOAD_CONTAINER = document.getElementById('DOWNLOAD-CONTAINER')
    const BUTTON_CONTAINER = document.getElementById('INTERCATION-BUTTON')
    const BUTTON_FIELD = document.getElementById('INTERACTION-TEXT')

    VERSION_NUMBER.textContent = state.version.name;
    VERSION_FIELD.textContent = state.version.beta ? 'Beta' : 'Public'

    switch(state.isInstalling){
        case true:
            DOWNLOAD_CONTAINER.style.display = 'flex';
            BUTTON_CONTAINER.style.display = 'none';
            break;
        case false:
            DOWNLOAD_CONTAINER.style.display = 'none';
            BUTTON_CONTAINER.style.display = 'flex';
            break;
    }

    // Game is running
    if(state.isRunning){
        BUTTON_FIELD.textContent = 'Running...'
        return;
    }

    // No versions installed
    if(state.isInitalInstallation){ BUTTON_FIELD.textContent = '> install'; return; }

    switch(state.hasUpdate){
        case true:
            BUTTON_FIELD.textContent = '> Update';
            break;
        case false:
            BUTTON_FIELD.textContent = '> Play';
            break;
    }

}

const onClick = () => {

    if(state.isInitalInstallation) ipcRenderer.send('installation:start');
    if(state.hasUpdate) ipcRenderer.send('update:start');
    if(!state.hasUpdate && !state.isInitalInstallation) ipcRenderer.send('game:start');

}

const onClickError = (element = HTMLElement, fatal = boolean) => {
    if(fatal){ ipcRenderer.send('main:close'); }

    element.parentNode.removeChild(element);

}

const onSidebarClick = () => {
    const SIDE_BAR_BUTTON = document.getElementById('SIDE-BAR-BUTTON');
    const SIDE_MENU = document.getElementById('SIDE-MENU');
    const MENU_CONTENT = document.getElementById('MENU-CONTENT');
    const SIDE_BAR_TEXT = document.getElementById('SIDE-BAR-TEXT')

    switch(menu.open){
        case true:
            SIDE_BAR_BUTTON.style.transform = 'rotate(0deg)';
            SIDE_BAR_BUTTON.className = 'side-bar-button-closed'
            SIDE_MENU.style.transform = 'scaleX(0)'
            SIDE_BAR_TEXT.style.transform = 'translateX(0px) rotate(-90deg)'
            SIDE_BAR_TEXT.textContent = 'Open settings';

            MENU_CONTENT.style.opacity = 0;
            break;
        case false:
            SIDE_BAR_BUTTON.style.transform = 'rotate(180deg)';
            SIDE_BAR_BUTTON.className = 'side-bar-button-open'
            SIDE_MENU.style.transform = 'scaleX(1)'
            SIDE_BAR_TEXT.style.transform = 'translateX(300px) rotate(-90deg)'
            SIDE_BAR_TEXT.textContent = 'Close settings';

            setTimeout(() => {
                MENU_CONTENT.style.opacity = 100;
            }, 500);

            break;
    }

    menu.open = !menu.open;
}

const onMenuClick = (btn = Number) => {
    /*
    0 - open file explorer
    1 - launch app
    2 - reinstall app
    3 - open logs in file explorer
    4 - f12
    5 - relaunch
    6 - quit
    */


    switch(btn){
        case 0:
            ipcRenderer.send('file-explorer:versions');
            break;
        case 1:
            if(state.isInstalling ||state.isRunning) return;

            ipcRenderer.send('update:start');
            break;
        case 2:
            ipcRenderer.send('file-explorer:logs');
            break;
        case 3:
            ipcRenderer.send('dev:devtools');
            break;
        case 4:
            ipcRenderer.send('dev:relaunch');
            break;
        case 5:
            ipcRenderer.send('main:close');
            break;
    }
}

const onLogin = () => {
    ipcRenderer.send('account:start-login', '');
}

const onUpdateLoginOverlay = (active = Boolean) => {
    const LOGIN_OVERLAY = document.getElementById('LOGIN-OVERLAY');

    switch(active){
        case true:
            LOGIN_OVERLAY.style.display = 'flex';
            break;
        case false:
            LOGIN_OVERLAY.style.display = 'none';
            break;
    }
}


const startInstallation = () => {

    state.isInstalling = true;
    UpdateButtons();

}

const finishInstallation = async () => {

    state.isInstalling = false;
    await ipcRenderer.sendSync('main:reinitialize')
    
    console.log("Initializing...")
    Initialize();
    
    UpdateButtons();

}

const onUpdateInstallationStatus = (options = {currently_installed: Number, total_size: Number, status_message: String} ) => {

    const DOWNLOAD_BAR = document.getElementById('DOWNLOAD-BAR');
    const DOWNLOAD_STATUS_NUMBER = document.getElementById('DOWNLOAD-STATUS-NUMBER');
    const DOWNLOAD_STATUS_FIELD = document.getElementById('DOWNLOAD-STATUS-FIELD');

    const percentage = Math.round((options.currently_installed / options.total_size)* 100)
    console.log(percentage);

    DOWNLOAD_BAR.style.width = `${percentage}%`;
    DOWNLOAD_STATUS_FIELD.textContent = options.status_message;
    DOWNLOAD_STATUS_NUMBER.textContent = `${options.currently_installed}MB / ${options.total_size}MB`;

}