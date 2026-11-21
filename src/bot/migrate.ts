var mysql = require('mysql')
import sqlhelper from '../sqlhelper'

var dbpool = mysql.createPool({
    connectionLimit: 20,
    host: "papscopointsdb.cpwh0scwmizo.us-west-2.rds.amazonaws.com",
    user: "wpapsco",
    password: "zelda127865",
    database: 'settings',
    multipleStatements: true
});

const flattenOnce = arr => arr.reduce((acc, c) => acc.concat(c), []);
const flatten = arr => arr.some(e => Array.isArray(e)) ? flatten(flattenOnce(arr)) : arr;
const debug = (e) => {
    console.log(e)
    return e
}
const without = (obj, ...properties) => {
    let o = Object.assign({}, obj)
    const ps = (properties.length == 1 && Array.isArray(properties[0])) ? properties[0] : properties
    for (var property of ps) {
        delete o[property]
    }
    return o
}

const helper = new sqlhelper(dbpool)

const migrateChannelSettings = () =>
    helper.listOldUsersBySettings()
        .then(channels =>
            Promise.all(channels.map(channel => helper.getOldSettings(channel))))
        .then(settingses => settingses.map(settings => ({
            ...without(settings, "is_running", "is_started"),
            should_start: 0,
            is_joined: 0
        })))
        .then(settingses =>
            Promise.all(settingses.map(settings => helper.insertNewSettings(settings).then(debug))))

const migrateRewards = () =>
    helper.getOldRewards()
        .then(allrewards => allrewards.map(({ user, rewards }) => rewards.map(reward => {
            const { reward_name, reward_price, reward_description, do_twitchalert, is_songrequest } = reward
            const channel = user
            const id = reward.reward_id
            return { reward_name, reward_description, reward_price, id, do_twitchalert, is_songrequest, channel }
        })))
        .then(flatten)
        .then(rewards =>
            Promise.all(rewards.map(reward =>
                helper.insertNewReward(reward).then(debug))))

const migrateRedeemedRewards = () =>
    helper.getOldRedeemedRewards()
        .then(allredeemed => allredeemed.map(({ redeemeds, channel }) => redeemeds.map(redeemed => {
            const { reward_id, refund_cost, reward_info, redeem_time } = redeemed
            const redeemer_channel = redeemed.redeemer
            return { reward_id, refund_cost, reward_info, redeem_time, redeemer_channel, channel }
        })))
        .then(flatten)
        .then(redeemeds =>
            Promise.all(redeemeds.map(redeemed =>
                helper.insertNewRedeemedReward(redeemed).then(debug))))

const migratePoints = () =>
    helper.getOldPoints()
        .then(allpoints => allpoints.map(({ entries, channel }) => entries.map(entry => {
            const { points, all_points } = entry
            const owner_channel = entry.name
            const broadcaster_channel = channel
            return { points, all_points, owner_channel, broadcaster_channel }
        })))
        .then(flatten)
        .then(entries =>
            Promise.all(entries.map(entry =>
                helper.insertNewPoints(entry).then(debug))))



const migrateAll = () => {
    Promise.all([
        migrateChannelSettings(),
        migrateRewards(),
        migrateRedeemedRewards(),
        migratePoints()
    ]).then(() => dbpool.end())
}


migrateAll()