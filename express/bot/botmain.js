const sqlhelper = require('../sqlhelper')
const mysql = require('mysql')
const tmi = require('./tmi.js')
const getCommands = require('./commands')
const strings = require('./strings')
const pointgiver = require('./pointgiver')
const donations = require('./donations')

let joined = []

const start = (dbpool) => {
    const helper = sqlhelper.gethelper(dbpool)
    const options = {
        options: { debug: true },
        connection: { reconnect: true },
        identity: {
            username: "PapscoPointsBot",
            password: "oauth:xjsg1cjjza6odlf0m8xsxlj1yov3m7"
        },
        channels: [],
        silent: false
    }
    const client = new tmi.client(options)
    if (options.silent) {
        client.say = (channel, message) => console.log(channel, message)
    }
    const exit = (str, channel) =>
        helper.updateSettings(channel.slice(1), { is_joined: false, should_start: false })
            .then(() => client.part(channel))
            .then(() => {
                joined = joined.splice(0, joined.indexOf("#" + channel)).concat(joined.slice(1)) //TODO: fix/test, weird and hacky way to remove an element by value
            })
            .then(() => str)
    const { commands, modCommands } = getCommands(helper, exit)
    client.on('message', (channel, userstate, message, self) => {
        if (self) return
        if (message.startsWith("!")) {
            new Promise((resolve, reject) => {
                const command = message.split(' ')[0].trim()
                const f = ('broadcaster' in userstate.badges) ? modCommands[command] : commands[command]
                if (f !== undefined) {
                    const args = message.split(' ').slice(1).map(arg => arg.trim())
                    resolve(f(channel.slice(1), userstate, args))
                } else {
                    reject("no command")
                }
            }).then(e => e.toString())
                .then(msg => client.say(channel, msg))
                .catch(err => null)
        }
    })
    client.on("join", (channel, userstate, self) => {
        if (self) {
            Promise.all([
                client.say(channel, strings.joinMessage()),
                helper.updateSettings(channel.slice(1), { is_joined: true, should_start: false })
            ])
        }
    })
    client.on("cheer", (channel, userstate, message) => { //TODO: test
        const bits = parseInt(userstate.bits)
        helper.getSettings(channel.slice(1))
            .then(settings => Promise.all([
                strings.bits(userstate['display-name'], bits,
                    bits * settings.bits_mul, settings.points_name),
                helper.addPoints(userstate.username, channel.slice(1), bits * settings.bits_mul)]))
            .then(([message]) =>
                client.say(channel, message)
            ).catch(err => null)
    })
    const onSub = (channel, displayName, months, userstate, method) => {
        //TODO: test
        const subtype = { //some pattern matching for the sub type
            '1000': ["$4.99", 1],
            '2000': ["$9.99", 2],
            '3000': ["$24.99", 5],
            'Prime': ["prime", 1]
        }[method.plan] || ["", 1]
        const { username } = userstate
        helper.getSettings(channel.slice(1))
            .then(settings => {
                const points = months * subs_mul
                return [settings, Math.round((points > 0 ? points : settings.subs_mul) * subtype[1])]
            }).then(([settings, points]) => Promise.all([
                settings,
                points,
                helper.addPoints(username, channel.slice(1), points)
            ])).then(([{ points_name }, points]) => strings.subMessage(subtype[0], displayName, points, points_name))
            .then(message => client.say(channel, message))
    }
    client.on("subscription", (channel, username, method, message, userstate) => {
        onSub(channel, username, 0, userstate, method)
    })
    client.on("resub", (channel, username, months, message, userstate, methods) => {
        onSub(channel, username, months, userstate, methods)
    })
    client.on("subgift", (channel, username, recipient, { plan, planName }, userstate) => {
        //TODO: test
        const subtype = { //some pattern matching for the sub type
            '1000': ["$4.99", 1],
            '2000': ["$9.99", 2],
            '3000': ["$24.99", 5],
            'Prime': ["prime", 1]
        }[plan] || ["", 1]
        helper.getSettings(channel.slice(1)) //get our settings
            .then(({ subs_mul, points_name }) => Promise.all([
                client.say(channel, strings.subGift(subtype[0], userstate['msg-param-recipient-user-name'],
                    userstate.login, subs_mul, Math.round(subs_mul / 2), points_name)), //say a message in chat
                helper.addPoints(userstate['msg-param-recipient-user-name'], channel.slice(1), subs_mul), //add points for the recipient
                helper.addPoints(userstate.login, channel.slice(1), Math.round(subs_mul / 2))]) //add points for the gifter
            )
    })
    //TODO: check for lotteries and contests and send appropriate messages on an interval...?
    client.connect() //start everything up
    helper.onStart()
    donations(helper, client)
    pointgiver(helper)
    // const joinChannels = () => {
    //     helper.listUnstartedUsers()
    //         .then(users => Promise.all([users.map(user => client.join("#" + user))])) //join each unjoined user
    //         .catch(e => console.log(e))
    // }
    // setInterval(joinChannels, 1000 * 30) //every 30 seconds
    // joinChannels() // including now
    return {
        join: (channel) => { //expose helpful functions
            if (joined.includes(channel)) return
            client.join("#" + channel)
            joined = joined.concat(channel)
        },
        newContest: (channel) => {
            client.say("#" + channel, strings.newContest)
        },
        betsClosed: (channel) => {
            client.say("#" + channel, strings.betsClosed)
        },
        contestClosed: (channel, entries) => {
            console.log("contest closed")
            if (entries.length === 0)
                return client.say("#" + channel, strings.contestClosed("nobody", 0, "nothing"))
            const winner = entries.reduce((acc, c) => c.points > acc.points ? c : acc, { points: 0 })
            return helper.getSettings(channel)
                .then(({ points_name }) =>
                    client.say("#" + channel, strings.contestClosed(winner.owner_channel, winner.points, points_name)))
        },
        newLottery: (channel) => {
            client.say("#" + channel, strings.newLottery)
        },
        lotteryClosed: (channel) => {
            client.say('#' + channel, strings.lotteryClosed)
        }
    }
}

module.exports = { start }