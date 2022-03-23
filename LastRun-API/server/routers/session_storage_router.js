const express = require('express');
const router = express.Router();
const db = require('../db/database');
const validator = require('../validator')
const router_errors = require('../router_errors');

router.post('/', async (req, res, next) => {
    const results = validator.validateAuthenticationTokenRequest(req, res);
    
    if(results == null){ return; }

    console.log(results);

    try{
        let result = await db.session_storage.createRunSession(results.session_id, results.user_id, results.username, results.startTime, results.seed);
        res.json(result);
    } catch(e) {
        router_errors(req, res, e);
    }
});

router.post('/validate/', async (req, res, next) => {
    const results = validator.validateSessionIDRequest(req, res);
    if(results == null){ return; }

    try{
        let result = await db.session_storage.validateSessionID(results.session_id, results.username);
        delete result['user_id'];
        delete result['password'];
        delete result['data'];
        result['success'] = 1;
        res.json(result);
    } catch(e) {
        router_errors(req, res, e);
    }
});

module.exports = router;