const express = require('express');
const rateLimit = require('express-rate-limit');
const apiLeaderboards = require('./routers/leaderboards_router');
const apiVersionControl = require('./routers/version_control_router');
const apiLoginSystem = require('./routers/login_system_router')
const apiSessionStorage = require('./routers/session_storage_router');

const app = express(); // setups server
const PORT = process.env.PORT || 3000;

const APIRateLimit = rateLimit({
    windowMs: 30 * 1000,
    max: 2,
    message: "Too many requests, please try again later. (30s cooldown)"
});

// app.use(APIRateLimit);
app.use(express.json());
app.use('/api/leaderboards', apiLeaderboards);
app.use('/api/version-control', apiVersionControl);
app.use('/api/login', apiLoginSystem);
app.use('/api/session-storage', apiSessionStorage);


// PORT
app.listen(PORT, () => {
    console.log(`Listening on ${PORT}...`);
});