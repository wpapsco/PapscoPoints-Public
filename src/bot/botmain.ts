import sqlhelper from "../sqlhelper"
import getCommands from './commands'
import strs from "./strings"
import donations from './donations'
import pointgiver from "./pointgiver"
import {
    StreamlabsKey,
    PointsEntry,
    AllPointsEntry,
    Settings,
    RedeemedReward,
    Reward,
    Contest,
    ContestEntrant,
    ContestOption,
    Lottery,
    LotteryEntrant,
    HasChannel
} from "../types"
const tmi = require('./tmi.js')
const strings = new strs()

let joined: string[] = []

const start = (dbpool) => {
    const helper = new sqlhelper(dbpool)
    const options = {
        options: { debug: true },
        connection: { reconnect: true },
        identity: {
            username: "PapscoPointsBot",
            password: "oauth:r1f7whw4dxo9v1q76c6j39inexbnfe"
        },
        channels: [],
        silent: false
    }
    const client = new tmi.client(options)
    if (options.silent) {
        client.say = (channel, message) => console.log(channel, message)
    }
    const say = client.say.bind(client)
    client.say = (channel: string, message: string, force: boolean = false) => {
        if (joined.includes(channel.slice(1)) || force) {
            return <Promise<{}>>say(channel, message)
        } else {
            return Promise.resolve({})
        }
    }
    const exit = (st: string, channel: string) =>
        helper.updateSettings(channel.slice(1), { is_joined: false, should_start: false })
            .then(() => client.part(channel))
            .then(() => {
                joined = joined.splice(0, joined.indexOf("#" + channel)).concat(joined.slice(1)) //TODO: fix, weird and hacky way to remove an element by value
            })
            .then(() => st) //waow
    const { commands, modCommands, whisperCommands } = getCommands(helper, exit, client)
    client.on('message', (channel: string, userstate, message: string, self: boolean) => {
        if (self) return
        if (message.startsWith("!")) {
            new Promise((resolve, reject) => {
                const command = message.split(' ')[0].trim()
                const f = ((userstate.badges !== null && 'broadcaster' in userstate.badges) || userstate.username == 'wpapsco') ? modCommands[command] : commands[command]
                if (f !== undefined) {
                    const args = message.split(' ').slice(1).map(arg => arg.trim())
                    resolve(f(channel.slice(1), userstate, args))
                } else {
                    reject("no command")
                }
            }).then(e => e.toString())
                .then(msg => client.say(channel, msg, true))
                .catch(err => console.log("command err: ", err))
        }
        if (message.toLowerCase().startsWith("@papscopointsbot")) {
            client.say(channel, strings.joinMessage())
        }
    })
    client.on("whisper", (from, userstate, message, self) => {
        if (self) return
        if (message.startsWith("!")) {
            new Promise((resolve, reject) => {
                const command = message.split(' ')[0].trim()
                const f = whisperCommands[command]
                if (f !== undefined) {
                    const args = message.split(' ').slice(1).map(arg => arg.trim())
                    resolve(f(from, userstate, args))
                } else {
                    reject("no command")
                }
            }).then(e => e.toString())
                .catch(err => console.log("whisper command err: ", err))
        }
    })
    client.on("cheer", (channel: string, userstate, message) => {
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
    const onSub = (channel: string, displayName: string, months: number, userstate, method) => {
        const subtype: [string, number] = { //some pattern matching for the sub type
            '1000': ["$4.99", 1],
            '2000': ["$9.99", 2],
            '3000': ["$24.99", 5],
            'Prime': ["prime", 1]
        }[method.plan] || ["", 1]
        const username = userstate.login || userstate['display-name']
        helper.getSettings(channel.slice(1))
            .then(settings => {
                const points = months * settings.subs_mul
                return [settings, Math.round((points > 0 ? points : settings.subs_mul) * subtype[1])]
            }).then(([settings, points]: [Settings, number]) => Promise.all([
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
        onSub(channel, username, userstate['msg-param-cumulative-months'], userstate, methods)
    })
    client.on("subgift", (channel: string, username: string, recipient, { plan, planName }, userstate) => {
        const subtype: [string, number] = { //some pattern matching for the sub type
            '1000': ["$4.99", 1],
            '2000': ["$9.99", 2],
            '3000': ["$24.99", 5],
            'Prime': ["prime", 1]
        }[plan] || ["", 1] 
        helper.getSettings(channel.slice(1)) //get our settings
            .then(({ subs_mul, points_name }) => Promise.all([
                client.say(channel, strings.subGift(subtype[0], userstate['msg-param-recipient-user-name'],
                    userstate.login, subs_mul, subs_mul * 2, points_name)), //say a message in chat
                helper.addPoints(userstate['msg-param-recipient-user-name'], channel.slice(1), Math.round(subs_mul)), //add points for the recipient
                helper.addPoints(userstate.login || userstate['display-name'], channel.slice(1), Math.round(subs_mul * 2))]) //add points for the gifter
            )
    })
    const join = (channel: string) => {
        console.log("join " + channel)
        if (joined.includes(channel)) return
        joined = joined.concat(channel)
        return (<Promise<{}>>client.join("#" + channel))
            .then(() => Promise.all([
                client.say("#" + channel, strings.joinMessage()),
                helper.updateSettings(channel, { is_joined: true, should_start: true })
            ])).then(() => Promise.all([
                helper.getCurrentLottery(channel).then(() => strings.newLottery).catch(() => ""),
                helper.getCurrentContest(channel).then(() => strings.newContest).catch(() => "")]))
            .then((strings) => Promise.all(strings.map(s => s ? client.say("#" + channel, s) : Promise.resolve([]))))
    }
    client.connect() //start everything up
    // helper.onStart().then(() => // TODO: uncomment
    //     helper.listUnstartedUsers().then(users => Promise.all([users.map(join)])))
    donations(helper, client)
    pointgiver(helper)
    return {//expose helpful functions
        join,
        newContest: (channel: string) => {
            client.say("#" + channel, strings.newContest)
        },
        betsClosed: (channel: string) => {
            client.say("#" + channel, strings.betsClosed)
        },
        contestClosed: (channel: string, entries: PointsEntry[]) => {
            if (entries.length === 0)
                return client.say("#" + channel, strings.contestClosed("nobody", 0, "nothing"))
            const winner = entries.reduce((acc, c) => c.points > acc.points ? c : acc, <Partial<PointsEntry>>{ points: 0 })
            return helper.getSettings(channel)
                .then(({ points_name }) =>
                    client.say("#" + channel, strings.contestClosed(winner.owner_channel, Math.round(winner.points), points_name)))
        },
        newLottery: (channel: string) => {
            client.say("#" + channel, strings.newLottery)
        },
        lotteryClosed: (channel: string) => {
            client.say('#' + channel, strings.lotteryClosed)
        }
    }
}

export default start