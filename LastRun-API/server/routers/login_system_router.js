const express = require('express');
const db = require('../db/database');
const router_errors = require('../router_errors');
const validator = require('../validator');

const router = express.Router();

router.post('/', async (req, res, next) => {
    const results = validator.validateLoginRequest(req, res);

    if(results == null){ return; }
    
    try{
        let result = await db.login_system.loginToAccount(results.username, results.password);
        let session_id = await db.login_system.regenerateSessionID(result.user_id);
        delete result['password'];
        delete result['user_id'];
        delete result['data'];
        result['session_id'] = session_id;
        res.json(result);

    } catch(e) {
        router_errors(req, res, e);
    }
});


module.exports = router;