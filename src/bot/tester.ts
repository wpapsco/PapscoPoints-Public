import { Settings } from "../types"
import str from "./strings"
const strings = new str()
const tmi = require("./tmi.js")
const helper = {
    getSettings: (channel: string) => Promise.resolve(<Settings>{
        points_name: "points",
        subs_mul: 50
    }),
    addPoints: (a: string, b: string, c: number) => Promise.resolve(console.log(a, b, c))
}
const options = {
    options: { debug: true },
    connection: { reconnect: true },
    identity: {
        username: "PapscoPointsBot",
        password: "oauth:xjsg1cjjza6odlf0m8xsxlj1yov3m7"
    },
    channels: ['linkus7']
}
const client = new tmi.client(options)
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
        .then(message => console.log(channel, message))
}

// const obj = {
//     channel: '#linkus7',
//     userstate: null,
//     months: 99,
//     username: 'ztkerls',
//     method:
//     {
//         prime: true,
//         plan: 'Prime',
//         planName: 'Channel Subscription (linkus7)'
//     }
// }

client.on("subscription", (channel, username, method, message, userstate) => {
    onSub(channel, username, 0, userstate, method)
})
client.on("resub", (channel, username, months, message, userstate, methods) => {
    onSub(channel, username, months, userstate, methods)
})
// const obj = {
//     channel: '#linkus7',
//     userstate: null,
//     months: 5,
//     username: 'sbeast27',
//     methods:
//     {
//         prime: false,
//         plan: '1000',
//         planName: 'Channel Subscription (linkus7)'
//     }
// }

// const obj = {
//     channel: '#linkus7',
//     userstate: null,
//     months: 1,
//     username: 'PandaZettoMafia',
//     method:
//     {
//         prime: true,
//         plan: 'Prime',
//         planName: 'Channel Subscription (linkus7)'
//     }
// }
client.on("cheer", (channel, userstate, message) => {
    // console.log({
    //     channel, userstate, message
    // })
})

// const obj = {
//     channel: '#mang0',
//     username: 'nberr',
//     recipient: 'Bozman7880',
//     plan: '1000',
//     planName: 'Channel Subscription (mang0)',
//     userstate:
//     {
//         badges: { subscriber: '12', 'sub-gifter': '1' },
//         color: null,
//         'display-name': 'nberr',
//         emotes: null,
//         id: 'b4346a0d-098c-45ce-8d14-1cb8d2ef98c6',
//         login: 'nberr',
//         mod: false,
//         'msg-id': 'subgift',
//         'msg-param-months': true,
//         'msg-param-recipient-display-name': 'Bozman7880',
//         'msg-param-recipient-id': '52091269',
//         'msg-param-recipient-user-name': 'bozman7880',
//         'msg-param-sender-count': '2',
//         'msg-param-sub-plan-name': 'Channel\\sSubscription\\s(mang0)',
//         'msg-param-sub-plan': '1000',
//         'room-id': '26551727',
//         subscriber: true,
//         'system-msg': 'nberr\\sgifted\\sa\\sTier\\s1\\ssub\\sto\\sBozman7880!\\sThey\\shave\\sgiven\\s2\\sGift\\sSubs\\sin\\sthe\\schannel!',
//         'tmi-sent-ts': '1531454306459',
//         turbo: false,
//         'user-id': '146678251',
//         'user-type': null,
//         'emotes-raw': null,
//         'badges-raw': 'subscriber/12,sub-gifter/1'
//     },
//     subgift: 'subgift'
// }
client.on("subgift", (channel, username, recipient, { plan, planName }, userstate) => {
    console.log({
        channel,
        username,
        recipient,
        plan,
        planName,
        userstate,
        subgift: "subgift"
    })
})
client.connect()