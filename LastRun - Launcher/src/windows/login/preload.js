const { ipcRenderer, app } = require('electron');

document.addEventListener('DOMContentLoaded', async () => {
    await Initialize();
    InitializeButtons();
});

const Initialize = async () => {
    await ipcRenderer.sendSync('account:initialize-login-window', '');
    console.log("Ready!");
}

const InitializeButtons = () => {
    const FORM = document.getElementById('FORM');
    const MINIMIZE = document.getElementById('MINIMIZE');
    const MAXIMIZE = document.getElementById('MAXIMIZE');
    const CLOSE = document.getElementById('CLOSE');
    
    FORM.addEventListener('submit', (e) =>{ tryToLogin(e); } );

    MINIMIZE.addEventListener('click', () => {
        ipcRenderer.send('login:minimize', null);
    });

    MAXIMIZE.addEventListener('click', () => {
        ipcRenderer.send('login:maximize', null);
    });

    CLOSE.addEventListener('click', () => {
        ipcRenderer.send('login:close', null);
    });

}

const tryToLogin = async (e) => {
    e.preventDefault();

    const USERNAME = document.getElementById('USERNAME');
    const PASSWORD = document.getElementById('PASSWORD');

    const login_data = {
        username: USERNAME.value,
        password: PASSWORD.value
    }

    const login = ipcRenderer.sendSync('account:login', login_data);

    switch(login.status){
        case 'SUCCESS':
            console.log("Successfully logged in!");
            console.log(login);
            break;
        case 'FAILED':
            console.log("Failed to login.");
            displayError(login.error);
            break;
    }
}

const displayError = (error = String) => {
    const LOGIN_ERROR = document.getElementById('LOGIN-ERROR');
    LOGIN_ERROR.textContent = error;
}