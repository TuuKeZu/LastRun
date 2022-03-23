const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const request = require('request');
const progress = require('request-progress');

const fileSystem = require('./file-system');
const extract = require('extract-zip');


class Installer{
    constructor(){
        this.window = BrowserWindow;
        this.FileSystem = fileSystem;
    }

    Initialize = async (window = BrowserWindow, FileSystem = fileSystem) => {
        this.FileSystem = FileSystem;
        this.window = window;

        console.log("Installer Initialized successfully!");
    }

    InstallVersion = async () => {
        return new Promise(async (resolve, reject) => {

            this.window.webContents.send('installer:start-installation');

            const URL = this.FileSystem.getVersionURL();
            const PATH = path.join(this.FileSystem.getDirectoryPath(), `${this.FileSystem.getVersionNumber()}.zip`);
            

            progress(request(URL), {
                throttle: 2000,
                delay: 500,
                lengthHeader: 33206272
            })
            .on('progress', (state) => {
                console.log(state);

                this.window.webContents.send('installer:installation-status', 
                {
                    currently_installed: this.toMegaBytes(state.size.transferred),
                    total_size: this.toMegaBytes(33206272),
                    status_message: 'Installing...'
                });

            })
            .on('error', (err) => {
                
                return reject(err);

            })
            .on('end', async () => {

                this.window.webContents.send('installer:installation-status', 
                {
                    currently_installed: this.toMegaBytes(33206272),
                    total_size: this.toMegaBytes(33206272),
                    status_message: 'Extracting...'
                });

                
                    await this.unzipFile(PATH)
                    .then(() => {
                        this.window.webContents.send('installer:finish-installation');
                        console.log("Installation successfully finished!");
                        return resolve();
                    })
                    .catch(e => {
                        return reject(e);
                    });

            })
            .pipe(fs.createWriteStream( PATH ));
            
        });
    }

    unzipFile = async (PATH = String) => {
        return new Promise( async (resolve, reject) => {
            await extract(PATH, {dir: this.FileSystem.getDirectoryPath()})
            .then(() => {
                console.log("Unzipped!");
                
                return resolve(200);
            })
            .catch(err => {
                return reject(err);
            })
        })
    }

    toMegaBytes = (value = Number) => {
        return Math.round(value / (10 ** 6));
    }   

}

module.exports = Installer;