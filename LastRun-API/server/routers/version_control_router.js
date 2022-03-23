const express = require('express');
const router = express.Router();
const db = require('../db/database');
const router_errors = require('../router_errors');


router.get('/', async (req, res, next) => {
    try{
        let result = await db.version_control.getVersion();
        res.json(result);

    } catch(e) {
        router_errors(req, res, e);
    }
});

module.exports = router;