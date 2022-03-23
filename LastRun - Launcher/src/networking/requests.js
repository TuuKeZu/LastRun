const request = require('request');
const CONFIG = require('./network-config.json');

class Requests{
    constructor(){

    }

    getVersionData = async () => {
        return new Promise((resolve, reject) => {
            request(CONFIG['version-control-api'], async (err, res, body) => {

                if(err) return reject(err);

                return resolve(JSON.parse(body));
            });
        });
    }

    login = async (username = String, password = String) => {
        return new Promise( async (resolve, reject) => {
            request.post(
            {
                headers: {'content-type': 'application/json'},
                url: CONFIG['login-system-api'],
                body: JSON.stringify(
                {
                    username: username,
                    password: password
                })
            }, async (err, res, body) => {

                if(err) return reject(err);

                switch(res.statusCode){
                    case 200:
                        return resolve(JSON.parse(body));
                    default:
                        return reject(JSON.parse(body));
                }
            });
        });
    }

    validateSessionID = async (username = String, session_id = String) => {
        return new Promise( async (resolve, reject) => {
            request.post(
            {
                headers: {'content-type': 'application/json'},
                url: CONFIG['session-system-api'],
                body: JSON.stringify(
                {
                    username: username,
                    session_id: session_id
                })
            }, async (err, res, body) => {

                if(err) return reject(err);

                switch(res.statusCode){
                    case 200:
                        return resolve(JSON.parse(body));
                    default:
                        return reject(JSON.parse(body));
                }
            });
        });
    }

}

module.exports = Requests;