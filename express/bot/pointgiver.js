"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('isomorphic-fetch');
const values = (obj) => Object.keys(obj).map(key => obj[key]);
function pointgiver(helper) {
    setInterval(() => {
        helper.listOnlineUsers()
            .then(users => Promise.all(users.map(({ channel }) => fetch("https://tmi.twitch.tv/group/user/" + channel + "/chatters")
            .then(r => r.json())
            .then(j => (j === Object(j) && 'chatters' in j) ? j.chatters : Promise.reject('no chatters'))
            .then(chatters => (values(chatters)).reduce((a, b) => a.concat(b)))
            .then(chatters => helper.incrementAllPoints(chatters, channel))))).catch(e => null);
    }, 1000 * 60);
}
exports.default = pointgiver;
