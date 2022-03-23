const fileSystem = require('./file-system');
const requests = require('../networking/requests');
const { BrowserWindow } = require('electron');

class LoginSystem{
    constructor(){
        this.Requests = requests;
        this.FileSystem = fileSystem;

        this.window = BrowserWindow;
    }

    Initialize = async (Requests = requests, FileSystem = fileSystem) => {
        this.Requests = Requests;
        this.FileSystem = FileSystem;
    }

    InitializeLoginSession = async (window = BrowserWindow) => {
        this.window = window;
        console.log("Initialized login session!");
    }

    TryToLogin = async (username = String, password = String) => {
        return new Promise( async (resolve, reject) => {
            await this.Requests.login(username, password)
            .then(async (account) => {
                const username = account.username;
                const session_id = account.session_id;

                await this.FileSystem.SetLoginDetails({username: username, session_id: session_id});


                return resolve(account);
            })
            .catch(err => {
                return reject(err);
            })
        });
    }

    LoginFromSessionDetails = async (username = String, session_id = String) => {
        return new Promise( async (resolve, reject) => {
            await this.Requests.validateSessionID(username, session_id)
            .then(async (result) => {
                return resolve(result);
            })
            .catch(err => {
                return reject(err);
            });
        });
    }
} 

module.exports = LoginSystem;