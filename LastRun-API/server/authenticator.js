const crypto = require('crypto');

async function generateID(lenght) {

    return new Promise((resolve, reject) => {

        let token = '';
    
        crypto.randomBytes(lenght, (err, buffer) => {
            if(err){
                return reject(err);
            }
            
            token = buffer.toString('hex');
            return resolve(token);
        });
    
    });
}

authenticator = {
    generateID: () => generateID(24),
    generateToken: () => generateID(24)
};


module.exports = authenticator;