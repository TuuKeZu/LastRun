// here we have a list of error codes in a very clean hashmap / dictionary || What about error code 666?
const ERROR_DETAILS = {
    400: {error: "Invalid request"},
    401: {error: "Invalid authentication"},
    404: {error: "Resource couldn't be located."},
    610: {error: "Account doesn't exist."},
    620: {error: "Invalid login credentials."},
    650: {error: "Invalid session ID.", success: 0},
    660: {error: "Score less or equal to the currect highscore."}
}

module.exports = (req, res, err) => { // this is the fucntion (errors_handler()), and can be called from all the files that use databases.
    
    // simple switch statement, that returns the error message and error code to the user. Let's get back to the databse:
    
    switch(err){
        case 400:
            res.status(400).send(ERROR_DETAILS[400]);
            break;
        case 401:
            res.status(401).send(ERROR_DETAILS[401]);
            break;
        case 404:
            res.status(404).send(ERROR_DETAILS[404]);
            break;
        case 610:
            res.status(610).send(ERROR_DETAILS[610]);
            break;
        case 620:
            res.status(620).send(ERROR_DETAILS[620]);
            break;
        case 650:
            res.status(650).send(ERROR_DETAILS[650]);
            break;
        case 660:
            res.status(660).send(ERROR_DETAILS[660]);
            break;
        default:
            console.log(err);
            res.status(500).send("Internal server error.");
            break;
    }
}