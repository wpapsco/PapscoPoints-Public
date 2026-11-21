import express = require('express');
import { MyRouter } from "../../types"
var ro = express.Router();
const router = new MyRouter(ro)

const logAnd = <T>(val: T) => (x) => {
    console.log(x)
    return val
}

router.get('/leaderboard/:channel', (req, res) => {
    // req.helper.getLeaderboard(req.params.channel)
    //     .then(x => res.send(x))
    console.log(req.query)
    req.helper.getNewLeaderboard(req.params.channel, parseInt(req.query.f), parseInt(req.query.l))
        .then(x => res.send(x))
        .catch(e => console.log(e))
})

router.get('/rank/:channel/:user', (req, res) => {
    req.helper.getRank(req.params.channel, req.params.user)
        .then(rank => res.send({ rank }))
})

router.get('/rewards/:channel', (req, res) => {
    req.helper.getRewards(req.params.channel)
        .then(rewards => res.send(rewards))
})

router.get('/rewards/', function (req, res) {
    req.helper.validateCookies(req.cookies)
        .then(() => req.helper.getRewards(req.cookies.username))
        .then(rewards => res.send(rewards))
        .catch(logAnd(null))
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
        .then(settings => ({ ...settings, twitch_oauth: null }))
        .catch(logAnd(<never>null))
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
export default router.router;