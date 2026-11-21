const tmi = require("./tmi.js")

const options = {
    options: { debug: true },
    connection: { reconnect: true },
    identity: {
        username: "PapscoPointsBot",
        password: "oauth:xjsg1cjjza6odlf0m8xsxlj1yov3m7"
    },
    channels: ['mang0']
}
const client = new tmi.client(options)
const onSub = (channel, username, months, userstate, method) => {
    console.log({
        channel,
        userstate,
        months,
        username,
        method
    })
    // const subtype = {
    //     '1000': "$4.99",
    //     '2000': "$9.99",
    //     '3000': "$24.99",
    //     'Prime': "prime"
    // }[method.plan]
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
client.on("resub", (channel, username, months, message, userstate, methods) => {
    onSub(channel, username, months, userstate, methods)
})
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