"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strings_1 = require("./strings");
const strings = new strings_1.default();
const tmi = require("./tmi.js");
const helper = {
    getSettings: (channel) => Promise.resolve({
        points_name: "points",
        subs_mul: 50
    }),
    addPoints: (a, b, c) => Promise.resolve(console.log(a, b, c))
};
const options = {
    options: { debug: true },
    connection: { reconnect: true },
    identity: {
        username: "PapscoPointsBot",
        password: "oauth:xjsg1cjjza6odlf0m8xsxlj1yov3m7"
    },
    channels: ['linkus7']
};
const client = new tmi.client(options);
const onSub = (channel, displayName, months, userstate, method) => {
    const subtype = {
        '1000': ["$4.99", 1],
        '2000': ["$9.99", 2],
        '3000': ["$24.99", 5],
        'Prime': ["prime", 1]
    }[method.plan] || ["", 1];
    const username = userstate.login || userstate['display-name'];
    helper.getSettings(channel.slice(1))
        .then(settings => {
        const points = months * settings.subs_mul;
        return [settings, Math.round((points > 0 ? points : settings.subs_mul) * subtype[1])];
    }).then(([settings, points]) => Promise.all([
        settings,
        points,
        helper.addPoints(username, channel.slice(1), points)
    ])).then(([{ points_name }, points]) => strings.subMessage(subtype[0], displayName, points, points_name))
        .then(message => console.log(channel, message));
};
client.on("subscription", (channel, username, method, message, userstate) => {
    onSub(channel, username, 0, userstate, method);
});
client.on("resub", (channel, username, months, message, userstate, methods) => {
    onSub(channel, username, months, userstate, methods);
});
client.on("cheer", (channel, userstate, message) => {
});
client.on("subgift", (channel, username, recipient, { plan, planName }, userstate) => {
    console.log({
        channel,
        username,
        recipient,
        plan,
        planName,
        userstate,
        subgift: "subgift"
    });
});
client.connect();
