"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require('lodash');
const uuid = require('uuid/v4');
const DEBUG = true;
class sqlhelper {
    constructor(dbpool) {
        this.dbpool = dbpool;
        this.flattenOnce = arr => arr.reduce((acc, c) => acc.concat(c), []);
        this.flatten = arr => arr.some(e => Array.isArray(e)) ? this.flatten(this.flattenOnce(arr)) : arr;
        this.values = (obj) => Object.keys(obj).map(key => obj[key]);
        this.entries = (obj) => Object.keys(obj).map((key, i) => [key, this.values(obj)[i]]);
        this.debug = (e) => {
            if (DEBUG)
                console.log(e);
            return e;
        };
        this.logAnd = (val) => (x) => {
            console.log(x);
            return val;
        };
        this.headOrReject = (wit) => (arr) => new Promise((resolve, reject) => {
            if (arr.length > 0)
                resolve(arr[0]);
            else
                reject(wit);
        });
        this.getConnection = (db) => new Promise((resolve, reject) => {
            this.dbpool.getConnection((dberr, connection) => {
                if (dberr)
                    reject(dberr);
                connection.changeUser({ database: db });
                resolve(connection);
            });
        });
        this.query = (sql, values, db) => new Promise((resolve, reject) => {
            this.getConnection(db).then((connection) => {
                connection.query(sql, values, (sqerr, value) => {
                    if (sqerr)
                        reject(sqerr);
                    resolve(value);
                    connection.release();
                });
            });
        });
        this.insert = (obj, table) => {
            const values = this.values(obj);
            const sql = "INSERT INTO " + table + " (" +
                Object.keys(obj).join(", ") + ") VALUES(" +
                values.map(e => "?").join(", ") + ");";
            return this.query(sql, values, 'ppdb').then(() => {
                return "Inserted into " + table;
            });
        };
        this.insertAll = (objs, table) => {
            if (objs.length === 0)
                return Promise.resolve([]);
            const values = this.flatten(objs.map(o => this.values(o)));
            const sql = "INSERT INTO " + table + " (" + Object.keys(objs[0]).join(", ") + ") VALUES" +
                objs.map(o => "(" + this.values(o).map(e => "?").join(", ") + ")").join(", ") + ";";
            return this.query(sql, values, 'ppdb');
        };
        this.getOldSettings = (channel) => {
            if (channel === null)
                return Promise.reject("channel is null in getOldSettings");
            const sql = "SELECT * FROM channel_settings WHERE channel = ?";
            const values = [channel];
            return this.query(sql, values, 'settings')
                .then(this.headOrReject('no old settings'));
        };
        this.insertNewSettings = (settings) => this.insert(settings, 'channel_settings').then(e => e + " channel " + settings.channel);
        this.listOldUsersBySettings = () => this.query("SELECT channel FROM channel_settings;", [], 'settings')
            .then(users => users.map(e => e.channel).filter(c => c !== null));
        this.listUsersBySettings = () => this.query("SELECT channel FROM channel_settings;", [], 'ppdb')
            .then(users => users.map(e => e.channel).filter(c => c !== null));
        this.getOldRewards = () => this.listOldUsersBySettings()
            .then(users => Promise.all(users.map(user => this.query("SELECT * FROM " + user + ";", [], 'rewards')
            .catch(err => [])
            .then(rewards => ({ rewards, user })))));
        this.insertNewReward = (reward) => this.insert(reward, 'rewards').then(e => e + " channel " + reward.channel);
        this.getOldRedeemedRewards = () => this.listOldUsersBySettings()
            .then(users => Promise.all(users.map(user => this.query("SELECT * FROM " + user + ";", [], 'redeemed_rewards')
            .catch(err => [])
            .then(redeemeds => ({ redeemeds, channel: user })))));
        this.insertNewRedeemedReward = (redeemed) => this.insert(redeemed, 'redeemed_rewards').then(e => e + " channel " + redeemed.channel);
        this.getOldPoints = () => this.listOldUsersBySettings()
            .then(users => Promise.all(users.map(user => this.query("SELECT * FROM " + user + ";", [], 'channels')
            .catch(err => [])
            .then(entries => ({ entries, channel: user })))));
        this.insertNewPoints = (points) => this.insert(points, 'points').then(e => e + " channel " + points.broadcaster_channel);
        this.updatePoints = (points) => {
            const sql = "UPDATE points SET " +
                this.entries(points).map(e => e[0] + " = ?").join(', ') +
                " WHERE owner_channel = ? AND broadcaster_channel = ?;";
            this.query(sql, this.values(points).concat([points.owner_channel, points.broadcaster_channel]), 'ppdb');
        };
        this.getPoints = (owner_channel, broadcaster_channel) => {
            const sql = "SELECT points FROM points WHERE broadcaster_channel = ? AND owner_channel = ?;";
            return this.query(sql, [broadcaster_channel, owner_channel], 'ppdb')
                .then(this.headOrReject('no points'))
                .then(entry => entry.points);
        };
        this.getLeaderboard = (channel) => {
            const sql = "SELECT * FROM points WHERE broadcaster_channel = ? ORDER BY points DESC LIMIT 100;";
            return this.query(sql, [channel], 'ppdb');
        };
        this.getSettingsWithHash = (channel, hash) => {
            const sql = "SELECT * FROM channel_settings WHERE channel = ? AND twitch_oauth = ?;";
            return this.query(sql, [channel, hash], 'ppdb')
                .then(this.headOrReject("no settings for channel and hash"));
        };
        this.getSettings = (channel, hash) => {
            if (hash)
                return this.getSettingsWithHash(channel, hash);
            const sql = "SELECT * FROM channel_settings WHERE channel = ?;";
            return this.query(sql, [channel], 'ppdb')
                .then(this.headOrReject('no settings for channel'));
        };
        this.updateSettings = (channel, settings) => {
            const sql = "UPDATE channel_settings SET " +
                this.entries(settings).map(e => e[0] + " = ?").join(', ') +
                " WHERE channel = ?;";
            if (this.values(settings).some(e => e === null || e === undefined)) {
                return Promise.reject("null or undefined setting");
            }
            return this.query(sql, this.values(settings).concat([channel]), 'ppdb');
        };
        this.addPoints = (owner_channel, broadcaster_channel, points) => this.incrementPointsBy([{
                owner_channel,
                broadcaster_channel,
                points
            }]);
        this.listOnlineUsers = () => this.query("SELECT * FROM channel_settings WHERE is_joined = 1;", [], 'ppdb');
        this.incrementAllPoints = (owner_channels, broadcaster_channel) => {
            if (owner_channels.length == 0)
                return Promise.resolve([]);
            const sql = "SELECT * FROM points WHERE owner_channel IN (?) AND broadcaster_channel = ?;";
            return this.query(sql, [owner_channels, broadcaster_channel], 'ppdb')
                .then(entries => entries.map(entry => entry.owner_channel))
                .then(owners => {
                if (owners.length == 0)
                    return Promise.resolve([[]]);
                const sql = "UPDATE points " +
                    "INNER JOIN channel_settings ON points.broadcaster_channel = channel_settings.channel " +
                    "SET points = points + points_per_minute, all_points = all_points + points_per_minute " +
                    "WHERE owner_channel IN (?) AND broadcaster_channel = ?;";
                return Promise.all([
                    owner_channels.filter(channel => !owners.includes(channel)),
                    this.query(sql, [owners, broadcaster_channel], 'ppdb')
                ]);
            }).then(([owners, x]) => owners.map(owner_channel => ({ points: 0, all_points: 0, owner_channel, broadcaster_channel })))
                .then(entries => this.insertAll(entries, 'points'));
        };
        this.incrementPointsBy = (entries) => {
            if (entries.length === 0)
                return Promise.resolve([]);
            const values = entries.map(entry => [
                entry.owner_channel,
                entry.broadcaster_channel,
                entry.points,
                (entry.points < 0 ? 0 : entry.points)
            ])
                .reduce((acc, c) => acc.concat(c));
            const sql = "INSERT INTO points (owner_channel, broadcaster_channel, points, all_points)" +
                "VALUES " + entries.map(() => "(?, ?, ?, ?)").join(", ") +
                "ON DUPLICATE KEY UPDATE " +
                "points = points + VALUES(points), " +
                "all_points = all_points + VALUES(all_points);";
            return this.query(sql, values, 'ppdb');
        };
        this.getRewards = (channel) => {
            const sql = "SELECT * FROM rewards WHERE channel = ? ORDER BY reward_price ASC;";
            return this.query(sql, [channel], 'ppdb');
        };
        this.filterRewards = (toKeepIds, channel) => {
            const sql = toKeepIds.length > 0 ? "DELETE FROM rewards WHERE id NOT IN (?) AND channel = ?;" :
                "DELETE FROM rewards WHERE channel = ?;";
            const values = toKeepIds.length > 0 ? [toKeepIds, channel] : [channel];
            return this.query(sql, values, 'ppdb');
        };
        this.validateCookies = (cookie) => this.getSettings(cookie.username, cookie.hash);
        this.updateReward = (reward) => {
            const sql = "UPDATE rewards SET ? WHERE id = ?";
            return this.query(sql, [reward, reward.id], 'ppdb');
        };
        this.getReward = (id) => {
            const sql = "SELECT * FROM rewards WHERE id = ?;";
            return this.query(sql, [id], 'ppdb')
                .then(this.headOrReject('no reward'));
        };
        this.getStreamlabsKey = (channel) => {
            const sql = "SELECT * FROM streamlabs_keys WHERE channel = ? ORDER BY created_at DESC;";
            return this.query(sql, [channel], 'ppdb')
                .then(this.headOrReject('No Streamlabs key for channel ' + channel));
        };
        this.updateStreamlabsKey = (key) => {
            const sql = "UPDATE streamlabs_keys SET ? WHERE channel = ?;";
            return this.query(sql, [key, key.channel], 'ppdb');
        };
        this.getRedeemedRewards = (channel) => {
            const sql = "SELECT * FROM redeemed_rewards LEFT JOIN rewards ON rewards.id = redeemed_rewards.reward_id WHERE redeemed_rewards.channel = ? ORDER BY redeem_time ASC;";
            return this.query(sql, [channel], 'ppdb')
                .then(redeemeds => redeemeds.map(redeemed => (Object.assign({}, redeemed, { channel }))));
        };
        this.getMacthingRedeemedReward = (channel, redeemer, id, info) => {
            const sql = "SELECT * FROM redeemed_rewards WHERE channel = ? AND redeemer_channel = ? AND reward_id = ? AND reward_info = ? ORDER BY redeem_time ASC LIMIT 1;";
            return this.query(sql, [channel, redeemer, id, info], 'ppdb')
                .then(this.headOrReject('no redeemed reward'));
        };
        this.finishReward = (channel, redeemer, id, info) => {
            const sql = "DELETE FROM redeemed_rewards WHERE reward_id = ? AND channel = ? AND redeemer_channel = ? AND reward_info = ? ORDER BY redeem_time ASC LIMIT 1;";
            return this.query(sql, [id, channel, redeemer, info], 'ppdb');
        };
        this.getCurrentLottery = (channel) => {
            const sql = "SELECT * FROM lotteries WHERE channel = ? AND is_ongoing = 1;";
            return this.query(sql, [channel], 'ppdb')
                .then(this.headOrReject('no lottery'))
                .then(lottery => Promise.all([
                this.query("SELECT * FROM lottery_entrants WHERE id = ?;", [lottery.entrants_id], 'ppdb'),
                lottery
            ]))
                .then(([users, lottery]) => ({ users, lottery }));
        };
        this.updateLotteryEntrant = (entrant) => {
            const sql = "UPDATE lottery_entrants SET ? WHERE id = ? AND entrant_channel = ?;";
            return this.query(sql, [entrant, entrant.id, entrant.entrant_channel], 'ppdb');
        };
        this.setPlacings = (winners, entrants_id) => {
            if (winners.length === 0)
                return Promise.resolve([]);
            const sql = winners
                .map(winner => "UPDATE lottery_entrants SET place = ? WHERE id = ? AND entrant_channel = ?;")
                .join(" ");
            const values = winners
                .map((winner, i) => [i + 1, entrants_id, winner])
                .reduce((a, b) => a.concat(b));
            return this.query(sql, values, 'ppdb');
        };
        this.endCurrentLottery = (channel) => {
            const sql = "UPDATE lotteries SET is_ongoing = 0 WHERE channel = ?;";
            return this.query(sql, [channel], 'ppdb');
        };
        this.insertContest = (contest, options) => {
            const options_id = uuid();
            return Promise.all([
                this.insert(Object.assign({}, contest, { options_id, entrants_id: uuid() }), 'contests'),
                this.insertAll(options.map((option, option_number) => (Object.assign({}, option, { id: options_id, option_number }))), 'contest_options')
            ]);
        };
        this.getCurrentContest = (channel) => {
            const sql = "SELECT * FROM contests WHERE channel = ? AND is_ongoing = 1 LIMIT 1;";
            return this.query(sql, [channel], 'ppdb')
                .then(this.headOrReject('no contest'))
                .then(contest => Promise.all([
                contest,
                this.query("SELECT * FROM contest_options WHERE id = ? ORDER BY option_number ASC;", [contest.options_id], 'ppdb'),
                this.query("SELECT * FROM contest_entrants WHERE id = ?;", [contest.entrants_id], 'ppdb')
            ]))
                .then(([contest, options, entrants]) => ({ contest, options, entrants }));
        };
        this.closeBets = (channel) => {
            const sql = "UPDATE contests SET is_started = 1 WHERE is_ongoing = 1 AND channel = ?;";
            return this.query(sql, [channel], 'ppdb');
        };
        this.endContest = (channel, option) => {
            return Promise.all([
                this.getCurrentContest(channel),
                this.query("UPDATE contests SET is_ongoing = 0 WHERE channel = ?;", [channel], 'ppdb')
            ])
                .then(x => x[0])
                .then(({ options, entrants }) => {
                if (entrants.length == 0)
                    return Promise.resolve([]);
                if (!options.some(opt => opt.option_number == option))
                    return Promise.reject("incorrect option");
                const winners = entrants.filter(entrant => entrant.bet_option == option);
                const pot = entrants.reduce((acc, c) => acc + c.points, 0);
                const winnerspot = winners.reduce((acc, c) => acc + c.points, 0);
                const entries = winners.map(winner => ({
                    owner_channel: winner.entrant_channel,
                    broadcaster_channel: channel,
                    points: (winner.points / winnerspot) * pot
                }));
                return this.incrementPointsBy(entries)
                    .then(() => entries);
            });
        };
        this.startBot = (channel) => {
            const sql = "UPDATE channel_settings SET should_start = 1 WHERE channel = ?;";
            return this.query(sql, [channel], 'ppdb');
        };
        this.newUser = (username, access_token) => {
            const entry = {
                channel: username,
                twitch_oauth: access_token,
                points_name: "Points",
                points_per_minute: 1,
                bits_message: '',
                sub_message: '',
                donation_message: '',
                gamble_multiplier: 3,
                gamble_odds: 60,
                gamble_time: 1,
                bits_mul: 1 / 3,
                subs_mul: 50,
                donations_mul: 20,
                password_hash: '',
                should_start: 0,
                is_joined: 0,
            };
            return this.insert(entry, 'channel_settings');
        };
        this.bonusAll = (points, channel) => {
            const sql = "UPDATE points SET points = points + ?, all_points = all_points + ? WHERE broadcaster_channel = ?;";
            return this.query(sql, [points, points, channel], 'ppdb');
        };
        this.listUnstartedUsers = () => {
            const sql = "SELECT channel FROM channel_settings WHERE is_joined = 0 AND should_start = 1;";
            return this.query(sql, [], 'ppdb')
                .then(res => res.map(r => r.channel));
        };
        this.onStart = () => {
            const sql = "UPDATE channel_settings SET is_joined = 0;";
            return this.query(sql, [], 'ppdb');
        };
        this.getRank = (broadcaster, owner) => {
            if (owner === "")
                return Promise.resolve(0);
            const sql = "SELECT count(*) FROM points WHERE points > " +
                "(SELECT points FROM points WHERE owner_channel = ? AND broadcaster_channel = ?) AND broadcaster_channel = ?;";
            return this.query(sql, [owner, broadcaster, broadcaster], 'ppdb')
                .then(this.headOrReject('count failed for rank'))
                .then(e => e["count(*)"])
                .then(this.debug)
                .catch(e => console.log(e));
        };
        this.getNewLeaderboard = (broadcaster, from = 0, limit = 100, points = Number.MAX_SAFE_INTEGER) => {
            const sql = "SELECT * FROM points WHERE broadcaster_channel = ? AND points < ? ORDER BY points DESC LIMIT ? OFFSET ?;";
            return this.query("SELECT count(*) FROM points WHERE broadcaster_channel = ?;", [broadcaster], 'ppdb')
                .then(this.headOrReject("count failed for leaderboard"))
                .then(e => e["count(*)"])
                .then(count => Promise.all([this.query(sql, [broadcaster, points + 1, limit, from], 'ppdb'), count]))
                .then(([leaderboard, count]) => ({ leaderboard, count }));
        };
        this.getSongRequests = (broadcaster) => this.getRedeemedRewards(broadcaster)
            .then((rewards) => rewards.filter((r) => r.is_songrequest)).then(rewards => {
            if (rewards.length > 0) {
                return rewards;
            }
            else
                Promise.reject("no songs");
        });
    }
}
exports.default = sqlhelper;
