const { app } = require('electron');
const { execFile } = require('child_process');

const log = require('electron-log');

const path = require('path');
const fs = require('fs');

const CONFIG = require('./config.json');

class FileSystem{
    constructor(){
        this.directoryPath = "";
        this.logPath = "";
        this.sessionDataPath = "";
        this.versions = [];

        this.version = "";
        this.versionPath = "";
        this.beta = Boolean;
        
        this.upToDate = false;
        this.versionURL = "";
    }

    Initialize = (application = app) => {
        return new Promise(async (resolve, reject) => {

            this.directoryPath = path.join(application.getPath('userData'), 'last-run');
            this.logPath = path.join(application.getPath('userData'), 'logs', 'main.log');
            this.sessionDataPath = path.join(application.getPath('appData'), '../', 'LocalLow', 'TuuKeZu', 'LastRun', 'session_data.txt');
            console.log(this.sessionDataPath);
            try{    

                await this.DirectoryExists(this.directoryPath, {create_missing: true, file: false});
                await this.DirectoryExists(this.logPath, {create_missing: true, file: true});
                await this.DirectoryExists(this.sessionDataPath, {create_missing: true, file: true});

                await this.listVersions();
                return resolve(200);

            } catch(e) {
                return reject(e);
            }


        });
    }

    InitializeVersion = (data = {}) => {
        this.version = data.version_name;
        this.beta = data.beta;
        this.versionURL = data.path;

        this.versions.forEach((version) => {
            if(version.name == this.version){
                this.versionPath = version.path;
                this.upToDate = true;
            }
        });
    }

    GetSessionDetails = () => {
        return new Promise((resolve, reject) => {
            fs.readFile(this.sessionDataPath, 'utf8', async (err, data) => {
                if(err) return reject(err);

                data = data.split('\n');

                
                if(data == null) return reject(404);
                if(data.length != 2) return reject(400);
                if(data[1].length != 48) return reject(401);
                
                const username = data[0];
                const session_id = data[1];

                return resolve({username: username, session_id: session_id});
            });
        });
    }

    listVersions = () => {
        return new Promise((resolve, reject) => {
            fs.readdir(this.directoryPath, (err, files) => {

                if(err) return reject(err);

                files.forEach(file => {
                    const data = {
                        name: file,
                        path: path.join(this.directoryPath, file)
                    }
                    this.versions.push(data);
                });

                return resolve();

            });

        });
    }

    getVersion = () => {
        
        return new Promise((resolve, reject) => {
            console.log("'" + this.version + "'");
            if(this.version == ""){ return reject(404); }

            return resolve(
            {
                isInitial: (this.versions.length == 0),
                name: this.version,
                upToDate: this.upToDate,
                beta: this.beta,
            });
        })
    }

    runVersion = async () => {
        return new Promise(async (resolve, reject) => {
            const dir_path = this.versionPath;
            const EXEC_PATH = path.join(dir_path, CONFIG.executable);

            await this.validateVersion(dir_path)
            .then(() => {

                const process = execFile(EXEC_PATH, [], (err, data) => {
                    if (err) return reject(err);
    
                    console.log(err);
    
                    console.log(`Running ${EXEC_PATH}...`);
    
                    
                });
    
                process.on('error', (err) => {
                    return reject(err);
                });
    
                process.on('close', (code) => {
    
                    console.log(`${code} - Child process terminated!`);
                    return resolve('CLOSED');
    
                });

            })
            .catch(err => {
                return reject(err);
            });
        });
    }

    SetLoginDetails = (details = {username: String, session_id: String}) => {
        return new Promise((resolve, reject) => {
            const raw = `${details.username}\n${details.session_id}`;

            fs.writeFile(this.sessionDataPath, raw, (err) => {
                if(err) return reject(err);

                console.log(`succesfully wrote session details! ${this.sessionDataPath}`);
                return resolve(200);
            });
        });
    }



    DirectoryExists = async (PATH = String, options = {create_missing: Boolean, file: Boolean}) => {
        return new Promise((resolve, reject) => {
            fs.access(PATH, (err) => {
                
                if(err){
                    switch(err.code){
                        case 'ENOENT': 

                            if(!options.create_missing) return reject({code: 404, file: PATH});

                            switch(options.file){
                                case false:
                                    fs.mkdir(PATH, {recursive: true}, (err) => {

                                        if(err) return reject(err);
        
                                        return resolve(201);
                                    });
                                    break;
                                case true:
                                    fs.mkdir(path.dirname(PATH) , {recursive: true}, (err) => {

                                        if(err) return reject(err);

                                        fs.writeFile(PATH, '', (err) => {
                                            if(err) return reject(err);
                                        });
        
                                        return resolve(201);
                                    });
                                    break;
                            }

                            break;
                            
                        default:

                            return reject(err.code);
                        
                    }
                }

                return resolve(200);
                
            });
        })
    }

    validateVersion = async (dir_path = String) => {
        return new Promise( async (resolve, reject) => {
            
            const FILES_REQUIRED = CONFIG['required-directories'];

            FILES_REQUIRED.forEach( async (FILE, index) => {

                const file_path = path.join(dir_path, FILE);

                await this.DirectoryExists(file_path, {create_missing: false, file: false}).catch(err => {
                    return reject(err);
                });

                if((FILES_REQUIRED.length - 1) == index){ return resolve(200); }
            });


        });
    }

    getDirectoryPath = () => {
        return this.directoryPath;
    }

    getApplicationLogsPath = () => {
        return this.logPath;
    }

    getVersionNumber = () => {
        return this.version;
    }

    getVersionURL = () => {
        return this.versionURL;
    }


}

module.exports = FileSystem;
