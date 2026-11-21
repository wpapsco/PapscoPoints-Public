"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const types_1 = require("../../types");
const router = new types_1.MyRouter(express.Router());
var request = require('request');
router.get('/', (req, res) => {
    const options = {
        method: 'POST',
        url: 'https://api.twitch.tv/kraken/oauth2/token',
        qs: {
            client_id: process.env.TWITCH_ID,
            client_secret: process.env.TWITCH_SECRET,
            code: req.query.code,
            grant_type: 'authorization_code',
            redirect_uri: 'http://www.papscopoints.com/twitchsignin'
        },
        headers: {
            'postman-token': '61c25973-0a6d-5762-27f2-1019e0f738e1',
            'cache-control': 'no-cache'
        }
    };
    request(options, (error1, response, body) => {
        if (error1)
            throw new Error(error1);
        const access_token = JSON.parse(body).access_token;
        const options2 = {
            method: 'GET',
            url: 'https://api.twitch.tv/kraken/user',
            headers: {
                'postman-token': '676f3269-5648-710f-e2af-36cec9feefc2',
                'cache-control': 'no-cache',
                'client-id': process.env.TWITCH_ID,
                authorization: 'OAuth ' + access_token,
                accept: 'application/vnd.twitchtv.v5+json'
            }
        };
        request(options2, (error2, response2, body2) => {
            if (error2)
                throw new Error(error2);
            const username = JSON.parse(body2).name;
            console.log(username);
            console.log(access_token);
            req.helper.getSettings(username)
                .catch(() => req.helper.newUser(username, access_token))
                .then(() => {
                res.cookie('username', username);
                res.cookie('hash', access_token);
                return req.helper.updateSettings(username, { twitch_oauth: access_token });
            }).then(() => res.redirect('/settings'));
        });
    });
});
exports.default = router.router;
