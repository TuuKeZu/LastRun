const express = require('express');
const router = express.Router();
const db = require('../db/database');
const router_errors = require('../router_errors');
const validator = require('../validator');

// now, each of these router.get() requests will just return some data to the requester, I will go through the first one, as thsoe all are similar

router.get('/:startIndex/:count/:sortMethod', async (req, res, next) => {
    const results = validator.validateGetAllRequest(req, res);

    if(results == null){ return; }

    console.log(results); 

    try {
        let result = await db.leaderboards.allIndex(results.startIndex, results.count, results.sortMethod);
        

        result.forEach((entry, index) => {
            delete entry["entry_id"];
        });

        res.json(result); 
    } catch(e) {
        router_errors(req, res, e);
    }
});

router.get('/', async (req, res, next) => {

    try {
        let result = await db.leaderboards.all();

        result.forEach((entry, index) => {
            delete entry["entry_id"];
        });

        res.json(result);
    } catch(e) {
        router_errors(req, res, e);
    }
});



router.get('/id/:id', async (req, res) => {
    const results = validator.validateGetRequestID(req, res);

    if(results == null){ return; }

    try {
        let result = await db.leaderboards.getByID(results.id);
        delete result["entry_id"];
        res.json(result);
    } catch(e) {
        router_errors(req, res, e);
    }
});

router.get('/name/:name', async (req, res) => {
    const results = validator.validateGetRequestName(req, res);

    if(results == null){ return; }

    try {
        let result = await db.leaderboards.getByName(results.name);
        delete result["entry_id"];
        res.json(result);
    } catch(e) {
        router_errors(req, res, e);
    }
});



router.post('/', async (req, res) => {
    const results = validator.validatePutRequest(req, res);

    if(results == null){ return; }
    
    try {
        let result = await db.leaderboards.putScore(results.name, results.score, results.authentication);
        res.status(result[1]).json(result[0]);
    } catch(e) {
        router_errors(req, res, e);
    }
});

module.exports = router;