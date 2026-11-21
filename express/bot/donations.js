"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strings_1 = require("./strings");
const strings = new strings_1.default();
exports.default = (helper, client) => {
    let lastids = {};
    const doDonations = (key, settings) => {
        const lastid = settings.channel in lastids ? lastids[settings.channel] : 0;
        return fetch("https://streamlabs.com/api/v1.0/donations?access_token=" + key.code + "&limit=1&currency=USD&after=" + lastid)
            .then(r => r.json())
            .then(j => {
            if (j.data.length > 0)
                return j.data[0];
            return Promise.reject('no donation');
        })
            .then(donation => {
            if (donation.donation_id === lastids[settings.channel])
                return Promise.reject("no new donation");
            lastids[settings.channel] = donation.donation_id;
            if (lastid === 0)
                return Promise.reject("first check");
            return Promise.all([
                helper.addPoints(donation.name.toLowerCase(), settings.channel, Math.round(settings.donations_mul * parseFloat(donation.amount))),
                client.say(settings.channel, strings.donation(donation.name, donation.amount, settings.donations_mul, settings.points_name))
            ]);
        });
    };
    const interval = () => {
        helper.listOnlineUsers()
            .then(users => Promise.all(users.map((settings) => helper.getStreamlabsKey(settings.channel)
            .then(key => doDonations(key, settings))
            .catch(x => null))));
    };
    setInterval(interval, 30 * 1000);
    interval();
};
