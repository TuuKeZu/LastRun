const mysql = require('mysql');
const authenticator = require('../authenticator');

const pool = mysql.createPool({
    connectionLimit: 10,
    password: '',
    user: 'root',
    database: 'LastRun_API',
    host: 'localhost',
    port: 3306
});

let LastRunDB = {
    leaderboards: {},
    login_system: {},
    session_storage: {},
    version_control: {}
};

LastRunDB.leaderboards.test = () => {
    return new Promise((resolve, reject) => {
        /*
        SELECT leaderboard_global.*, rank() over(order by score desc) placement from leaderboard_global order by score DESC LIMIT 0,10
        */
        pool.query('SELECT POSITION(', (err, results) => {

            if(err){
                return reject(err);
            }

            return resolve(results);
        });

    });
}

LastRunDB.leaderboards.all = () => {

    return new Promise((resolve, reject) => {

        pool.query('SELECT leaderboard_global.*, rank() over(order by score desc) placement from leaderboard_global order by score DESC LIMIT 0,10', (err, results) => {

            if(err){
                return reject(err);
            }

            return resolve(results);
        });

    });
}


LastRunDB.leaderboards.allIndex = (startIndex, count, sortMethod) => {
    let sql_get = 'SELECT leaderboard_global.*, rank() over(order by score desc) placement from leaderboard_global order by score ? LIMIT ?,?';

    return new Promise((resolve, reject) => {

        switch(sortMethod){
            case 'ASC':
                sql_get = 'SELECT leaderboard_global.*, rank() over(order by score desc) placement from leaderboard_global order by score ASC LIMIT ?,?';
                break;
            case 'DESC':
                sql_get = 'SELECT leaderboard_global.*, rank() over(order by score desc) placement from leaderboard_global order by score DESC LIMIT ?,?';
                break;
        }

        pool.query(sql_get, [startIndex, count], (err, results) => {

            if(err){
                return reject(err); 
            }

            return resolve(results);
        });

    });
}

LastRunDB.leaderboards.getByID = (id) => {

    return new Promise((resolve, reject) => {
        const sql_request = 'SELECT * FROM leaderboard_global WHERE entry_id = ?';
        const sql_placement = 'SELECT COUNT(*)+1 as placement FROM leaderboard_global WHERE score > ?';

        let data = {};
        pool.query(sql_request, [id], (err, results) => {

            if(err){
                return reject(err);
            }

            if(results[0] == null){
                return reject(610);
            }

            data = Object.assign(data, results[0]);

            pool.query(sql_placement, [data.score], (err, results) => {

                if(err){
                    return reject(err);
                }

                console.log(results);

                data = Object.assign(data, results[0]);

                return resolve(data);
            });

        });

    });
}

LastRunDB.leaderboards.getByName = (name) => {

    return new Promise((resolve, reject) => {
        const sql_request = 'SELECT * FROM leaderboard_global WHERE name = ?';
        const sql_placement = 'SELECT COUNT(*)+1 as placement FROM leaderboard_global WHERE score > ?';
        let data = {};

        pool.query(sql_request, [name], (err, results) => {

            if(err){
                return reject(err);
            }

            if(results[0] == null){
                return reject(610);
            }

            data = Object.assign(data, results[0]);
            
            pool.query(sql_placement, [data.score], (err, results) => {

                if(err){
                    return reject(err);
                }

                data = Object.assign(data, results[0]);

                return resolve(data);
            });
            
        });
        
    });

}

LastRunDB.leaderboards.putScore = (name, score, authentication) => {

    return new Promise((resolve, reject) => {
        const sql_reset_token = 'DELETE FROM session_storage WHERE authentication_token = ?';
        const sql_validate_token = 'SELECT * FROM session_storage WHERE authentication_token = ?'
        const sql_exists = 'SELECT * FROM leaderboard_global WHERE name = ?';
        const sql_insert = 'INSERT INTO leaderboard_global (name, score, verified, supporter) VALUES (?, ?, false, false);';
        const sql_update = 'UPDATE leaderboard_global SET score = ? WHERE name = ?';

        pool.query(sql_validate_token, [authentication], (err, results) => {

            if(err){
                // SERVER ERROR
                return reject(err);
            }

            if(results[0] == null){
                // AUTHENTICATION FAILED
                return reject(401);
            }
        })

        pool.query(sql_reset_token, [authentication], (err, results) => {

            if(err){
                // SERVER ERROR
                return reject(err);
            }
        });

        pool.query(sql_exists, [name], (err, results) => {

            if(err){
                // SERVER ERROR
                return reject(err);
            }

            
            if(results[0] == null){
                
                // FIRST TIME POSTING SCORE TO LEADERBOARDS
                pool.query(sql_insert, [name, score], (err, results) => {
                    
                    if(err){
                        return reject(err);
                    }
                    
                    return resolve([results[0], 210]);
                });
            }
            else{
                if(score <= results[0].score){return reject(660);}
                // UPDATING EXISTING SCORE
                pool.query(sql_update, [score, name], (err, results) => {

                    if(err){
                        return reject(err);
                    }
        
                    return resolve([results[0], 220]);
                });
            }
        });

    });

}

LastRunDB.version_control.getVersion = () => {

    return new Promise((resolve, reject) => {
        const sql_request = 'SELECT * FROM version_control';

        pool.query(sql_request, [], (err, results) => {

            if(err){
                // SERVER ERROR
                reject(err);
            }
            
            return resolve(results[0]);

        });
    });
};

LastRunDB.login_system.loginToAccount = (name, password) => {

    return new Promise((resolve, reject) => {
        const sql_exists = 'SELECT * FROM user_schema WHERE username = ?';
        const sql_validate_password = 'SELECT * FROM user_schema WHERE username = ? and password = ?';

        pool.query(sql_exists, [name], (err, results) => {
            
            if(err){
                // SERVER ERROR
                reject(err);
            }

            if(results[0] == null){
                // ACCOUNT DOESN'T EXIST
                return reject(610);
            }

            pool.query(sql_validate_password, [name, password], (err, results) => {

                if(err){
                    // SERVER ERROR
                    return reject(err);
                }

                if(results[0] == null){
                    // ACCOUND PASSWORD DOESN'T MATCH
                    return reject(620);
                }

                return resolve(results[0]);
            });
        });

    });
}

LastRunDB.login_system.regenerateSessionID = (user_id) => {

    return new Promise( async (resolve, reject) => {
        const sql_update = 'UPDATE user_schema SET data = ? where user_id = ?';
        const session_id = await authenticator.generateID();
        const data = {session_id: session_id}
        
        pool.query(sql_update, [JSON.stringify(data), user_id], (err, results) => {

            if(err){
                // SERVER ERROR
                return reject(err);
            }

            return resolve(session_id);

            
        });
    });
}

LastRunDB.session_storage.createRunSession = (session_id, user_id, username, startTime, seed) => {

    return new  Promise( async (resolve, reject) => {
        const sql_exists = 'SELECT * FROM session_storage WHERE session_id = ?';
        const sql_deletion = 'DELETE FROM session_storage WHERE session_id = ?';
        const sql_insertion = 'INSERT INTO session_storage (session_id, user_id, username, start_time, seed, authentication_token) VALUES (?, ?, ?, ?, ?, ?);';
        const auth_token = await authenticator.generateToken();

        pool.query(sql_exists, [session_id], (err, results) => {

            if(err){
                // SERVER ERROR
                return reject(err);
            }

            console.log(results);

            if(results[0] =! null){
                // SESSION ALREADY EXISTS
                pool.query(sql_deletion, [session_id], (err, results) => {

                    if(err){
                        // SERVER ERROR
                        return reject(err);
                    }
                });

            }

            pool.query(sql_insertion, [session_id, user_id, username, startTime, seed, auth_token], (err, results) => {
                    
                if(err){
                    return reject(err);
                }
    
                return resolve(auth_token);
            });
            
        });

    });

}

LastRunDB.session_storage.validateSessionID = (session_id, username) => {

    return new Promise((resolve, reject) => {
        const sql_exists = 'SELECT * FROM user_schema WHERE data = ? and username = ?';
        const data = {session_id: session_id};
        pool.query(sql_exists, [JSON.stringify(data), username], (err, results) => {

            if(err){
                // SERVER ERROR
                return reject(err);
            }

            if(results[0] == null){
                // SESSION ID IS INVALID
                return reject(650);
            }

            return resolve(results[0]);
        });
    });
}

module.exports = LastRunDB;