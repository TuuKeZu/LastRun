const Joi = require('joi');
const express = require('express');

const leaderboardAppend = Joi.object({
    name: Joi.string().min(3).required(),
    score: Joi.number().required(),
    authentication: Joi.string().min(24).required()
});

const leaderboardGetAll = Joi.object({ // this is the validation object. Here using JOI library, the code will check if the parameters are correct.
    startIndex: Joi.number().required(), // we will want a number indicating the indes of where the search starts,
    count: Joi.number().required(), // number of elements from that index
    sortMethod: Joi.string().valid('DESC', 'ASC') // and our sorting method, which can only be one of these.
});

const leaderboardGetByID = Joi.object({
    id: Joi.number().required()
});

const leaderboardGetByName = Joi.object({
    name: Joi.string().required()
});

const loginRequest = Joi.object({
    username: Joi.string().min(3).required(),
    password: Joi.string().min(5).required()
});

const userCreationRequest = Joi.object({
    username: Joi.string().min(3).required(),
    password: Joi.string().min(5).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    email: Joi.string().email().required(),
    discord: Joi.string().min(5)
});

const runAuthenticationRequest = Joi.object({
    session_id: Joi.string().min(24).required(),
    user_id: Joi.number().required(),
    username: Joi.string().min(5).required(),
    startTime: Joi.string().required(),
    seed: Joi.string().min(12).required()
});

const sessionIDValidationRequest = Joi.object({
    session_id: Joi.string().min(24).required(),
    username: Joi.string().required()
});

function validateRequestParameters(req, res, schema = {}){
    const result = schema.validate(req.params);
    if(result.error){
        res.status(400).send({error: result.error.details[0].message});
        return null;
    }

    return result.value;
}

function validateRequestBody(req, res, schema = {}){
    const result = schema.validate(req.body);

    if(result.error){
        res.status(400).send({error: result.error.details[0].message});
        return null;
    }
    
    return result.value;
}


let validator = {
    validateGetAllRequest: (req, res) => validateRequestParameters(req, res, leaderboardGetAll),
    validateGetRequestID: (req, res) => validateRequestParameters(req, res, leaderboardGetByID),
    validatePutRequest: (req, res) => validateRequestBody(req, res, leaderboardAppend),
    validateGetRequestName: (req, res) => validateRequestParameters(req, res, leaderboardGetByName),
    validateLoginRequest: (req, res) => validateRequestBody(req, res, loginRequest),
    validateUserCreation: (req, res) => validateRequestBody(req, res, userCreationRequest),
    validateAuthenticationTokenRequest: (req, res) => validateRequestBody(req, res, runAuthenticationRequest),
    validateSessionIDRequest: (req, res) => validateRequestBody(req, res, sessionIDValidationRequest)
};

module.exports = validator;