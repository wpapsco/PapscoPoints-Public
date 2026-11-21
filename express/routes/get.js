var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var functions = require('./functions');
const sqlhelper = require('../sqlhelper');

const logAnd = (val) => (x) => {
    console.log(x)
    return val
}

router.get('/leaderboard/:channel', (req, res) => {
    req.helper.getLeaderboard(req.params.channel)
        .then(x => res.send(x))
})

router.get('/rewards/:channel', (req, res) => {
    req.helper.getRewards(req.params.channel)
        .then(rewards => res.send(rewards))
})

router.get('/rewards/', functions.validateCookies, function (req, res) {
    req.helper.getRewards(req.cookies.username)
        .then(rewards => res.send(rewards))
});

router.get('/redeemedrewards', (req, res) => {
    req.helper.validateCookies(req.cookies)
        .then(() => req.helper.getRedeemedRewards(req.cookies.username))
        .then(redeemeds => res.send(redeemeds))
})

router.get('/lottery', (req, res) => {
    req.helper.validateCookies(req.cookies)
        .then(() => req.helper.getCurrentLottery(req.cookies.username))
        .catch(logAnd({}))
        .then(lottery => res.send(lottery))
})

router.get('/contest/', (req, res) => {
    req.helper.validateCookies(req.cookies)
        .then(() => req.helper.getCurrentContest(req.cookies.username))
        .catch(logAnd({}))
        .then(contest => res.send(contest))
})

router.get('/settings', (req, res) => {
    req.helper.validateCookies(req.cookies)
        .then(req.helper.debug)
        .then(settings => ({ ...settings, twitch_oauth: null }))
        .catch(logAnd(null))
        .then(settings => res.send({ settings }))
})

router.get('/users', (req, res) => {
    req.helper.listUsersBySettings()
        .then(x => res.send(x))
})

router.get('/points/:broadcaster', (req, res) => {
    req.helper.getPoints(req.cookies.username, req.params.broadcaster)
        .then(req.helper.debug)
        .then(points => res.send({ points }))
})
module.exports = router;