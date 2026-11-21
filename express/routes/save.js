var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var functions = require('./functions');
var request = require('request');
var uuid = require('uuid/v4');
const _ = require('lodash');
var { spawn, exec, execFile } = require('child_process');

router.post('/redeem', (req, res) => {
    const refreshToken = (key) => { //will refresh only when necessary
        const expires_at = key.created_at
        expires_at.setMinutes(key.expires_in + expires_at.getMinutes())
        if (key.created_at == null || expires_at < new Date()) {
            const body = new FormData
            body.append("client_id", "F9HckpMwb4rG7EnnrlMFnLgt1hwuMsBwPTnJxQH4")
            body.append("grant_type", "refresh_token")
            body.append("client_secret", "2DYzfnKBWaCH2X4e2Isu4BXuPUd9kDC3qznG8xOb")
            body.append("redirect_uri", "http://www.papscopoints.com/streamlabssignup")
            body.append("refresh_token", key.refresh_token)

            return fetch("https://streamlabs.com/api/v1.0/token", {
                body,
                headers: {
                    "Cache-Control": "no-cache",
                    "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
                    "Postman-Token": "0c555d17-be63-3f84-f739-3f94fc715e0a"
                },
                method: "POST"
            }).then(response => response.json())
                .then(j => ({
                    channel: key.channel,
                    code: j.access_token,
                    refresh_token: j.refresh_token,
                    expires_in: j.expires_in,
                    created_at: new Date()
                }))
                .then(k => Promise.all([k, req.helper.updateStreamlabsKey(k)]))
                .then(([k]) => k)
        } else return Promise.resolve(key)
    }

    const sendAlert = (message, duration, token) => {
        const body = new FormData
        body.append("access_token", token)
        body.append("type", "subscription")
        body.append("message", message)
        body.append("image_href", "http://i.imgur.com/zJ9w5sF.png")
        body.append("duration", duration)
        body.append("sound_href", "https://streamlabs.com/sounds/gallery/default.ogg")
        body.append("special_text_color", "#eb42f4")

        return fetch("https://streamlabs.com/api/v1.0/alerts", {
            body,
            headers: {
                "Cache-Control": "no-cache",
                "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
                "Postman-Token": "74108ede-5d6e-f54c-dbc8-d159ca2aa0d6"
            },
            method: "POST"
        })
    }

    const doAlert = (reward, _key) => {
        //TODO: test
        if (!key || !key.refresh_token || !key.code) return

        return refreshToken(_key)
            .then(key => {
                const message = reward.do_twitchalert ? req.cookies.username + " redeemed *" + reward.reward_name + "*" : ""
                const duration = reward.do_twitchalert ? 5000 : 1000
                return sendAlert(message, duration, key.code)
            }).catch(err => console.log(err))
    }

    req.helper.validateCookies(req.cookies)
        .then(() =>
            req.helper.getReward(req.body.reward_id))
        .then(([reward, key]) => {
            const redeemed = {
                channel: reward.channel,
                reward_id: reward.id,
                refund_cost: reward.reward_price,
                reward_info: req.body.reward_info,
                redeem_time: new Date(),
                redeemer_channel: req.cookies.username
            }
            return Promise.all([
                reward,
                req.helper.insert(redeemed, 'redeemed_rewards'),
                req.helper.addPoints(req.cookies.username, reward.channel, -reward.reward_price)
            ])
        }).then(([reward]) =>
            req.helper.getStreamlabsKey(req.body.channel)
                .then(key => doAlert(reward, key)))
        .then(() => res.sendStatus(200))
})

router.post('/redeemed/done/', (req, res) => {
    req.helper.finishReward(req.cookies.username, req.body.redeemer, req.body.reward_id, req.body.reward_info)
        .then(() => res.sendStatus(200))
})

router.post('/redeemed/refund', (req, res) => {
    console.log(req.body)
    req.helper.getMacthingRedeemedReward(req.cookies.username, req.body.redeemer, req.body.reward_id, req.body.reward_info)
        .then(reward =>
            req.helper.addPoints(req.body.redeemer, req.cookies.username, reward.refund_cost))
        .then(() =>
            req.helper.finishReward(req.cookies.username, req.body.redeemer, req.body.reward_id, req.body.reward_info))
        .then(() => res.sendStatus(200))
})

router.post('/rewards', (req, res) => {
    const new_rewards = req.body.filter(reward => reward.id ? false : true)
        .map(reward => ({
            ...reward,
            reward_price: parseInt(reward.reward_price),
            id: uuid(),
            channel: req.cookies.username
        }))
    const old_rewards = req.body.filter(reward => reward.id ? true : false)
    const to_keep = old_rewards.map(reward => reward.id)
    req.helper.validateCookies(req.cookies)
        .then(() =>
            req.helper.filterRewards(to_keep, req.cookies.username))
        .then(() => Promise.all([
            req.helper.insertAll(new_rewards, 'rewards'),
            Promise.all(old_rewards.map(req.helper.updateReward))
        ]).then(res.sendStatus(200)))
})

router.post('/lottery/start/', (req, res) => {
    req.helper.validateCookies(req.cookies)
        .then(() => {
            const lottery = {
                channel: req.cookies.username,
                entrants_id: uuid(),
                start_time: new Date(),
                ticket_cost: req.body.cost,
                ticket_max: req.body.max,
                is_ongoing: 1
            }
            return req.helper.insert(lottery, 'lotteries')
        })
        .then(() => req.bot.newLottery(req.cookies.username))
        .then(() => res.sendStatus(200))
})

router.post('/lottery/close', (req, res) => {
    req.helper.validateCookies(req.cookies)
        .then(() =>
            req.helper.getCurrentLottery(req.cookies.username)
        ).then(({ lottery, users }) => Promise.all([
            req.helper.setPlacings(req.body.winners, lottery.entrants_id),
            req.helper.endCurrentLottery(req.cookies.username)
        ])).then(() => req.bot.lotteryClosed(req.cookies.username))
        .then(() => res.sendStatus(200))
})

router.post('/contest/start/', (req, res) => {
    const contest = {
        channel: req.cookies.username,
        is_ongoing: 1,
        is_started: 0,
        description: req.body.contest_title,
        start_time: new Date(),
        max_bet: parseInt(req.body.max_bet),
    }
    const options = req.body.option_list.map(text => ({
        text, channel: req.cookies.username
    }))
    return req.helper.validateCookies(req.cookies)
        .then(() => req.helper.insertContest(contest, options))
        .then(() => req.bot.newContest(req.cookies.username))
        .then(() => res.sendStatus(200))
        .catch(err => console.log(err))
})

router.post('/contest/closebets/', (req, res) => {
    req.helper.validateCookies(req.cookies)
        .then(() => req.helper.closeBets(req.cookies.username))
        .then(() => req.bot.betsClosed(req.cookies.username))
        .then(() => res.sendStatus(200))
})

router.post('/contest/close/', (req, res) => {
    req.helper.validateCookies(req.cookies)
        .then(() => req.helper.endContest(req.cookies.username, req.body.option))
        .then(entries => req.bot.contestClosed(req.cookies.username, entries))
        .catch(err => console.log(err))
        .then(() => res.sendStatus(200))
})

router.post('/bot/start', (req, res) => {
    req.helper.validateCookies(req.cookies)
        .then(() => req.bot.join(req.cookies.username))
        // .then(() => req.helper.startBot(req.cookies.username))
        // .then(() => console.log("started bot for " + req.cookies.username))
        .then(() => res.sendStatus(200))
});

router.post('/settings', (req, res) => {
    req.helper.validateCookies(req.cookies)
        .then(() => ({ ...req.body.settings, bits_mul: req.body.settings.bits_mul / 100 }))
        .then(_.pickBy)
        .then(settings => req.helper.updateSettings(req.cookies.username, settings))
        .then(() => res.sendStatus(200))
})

module.exports = router;
