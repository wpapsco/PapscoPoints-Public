import str from "./strings"
import sqlhelper from "../sqlhelper";
import { Duel, Streak, Settings as MySettings } from "../types";
import { promises } from "fs";
import { google } from "googleapis"
import getYoutubeId = require("get-youtube-id");
import { Settings } from "http2";
const strings = new str()

/*
{gambler, time_up, channel}
*/

let gambleUsers = []
let duels: Duel[] = [] //add timeouts
let streaks: Streak[] = []

const gamble = (amount: number, settings: MySettings, userstate, helper: sqlhelper, points: number, gambler: string, channel: string) => {
    if (amount <= 0) return strings.gambleTooSmall
    if (amount > points) return strings.notEnoughPoints(userstate['display-name'], settings.points_name)
    gambleUsers = gambleUsers.concat([{ gambler, channel, time_up: Date.now() + (1000 * 60 * settings.gamble_time) }])
    const roll = Math.floor(Math.random() * 100) + 1
    const toWin = userstate.subscriber ? settings.gamble_odds - 5 : settings.gamble_odds
    const streak: Streak =
        streaks.find(s => s.gambler == gambler && s.channel == channel) ||
        { channel, gambler, streak: 0, total: 0, winning: false }
    const message: string = (() => {
        if (roll > 98) {
            helper.addPoints(gambler, channel, amount * settings.gamble_multiplier)
            streak.streak = streak.winning ? streak.streak + 1 : 1
            streak.total = streak.winning ? streak.total + amount * settings.gamble_multiplier : amount * settings.gamble_multiplier
            streak.winning = true
            return strings.gambleSuperWin(userstate['display-name'],
                roll, amount * settings.gamble_multiplier,
                settings.points_name, points + amount * settings.gamble_multiplier)
        } else if (roll > toWin) {
            streak.streak = streak.winning ? streak.streak + 1 : 1
            streak.total = streak.winning ? streak.total + amount : amount
            streak.winning = true
            helper.addPoints(gambler, channel, amount)
            return strings.gambleWin(userstate['display-name'], roll, amount, settings.points_name, points + amount)
        } else {
            streak.streak = streak.winning ? 1 : streak.streak + 1
            streak.total = streak.winning ? amount : streak.total + amount
            streak.winning = false
            helper.addPoints(gambler, channel, -amount)
            return strings.gambleLose(userstate['display-name'], roll, settings.points_name, points - amount, amount)
        }
    })()
    streaks = streaks.filter(s => !(s.gambler == gambler && s.channel == channel))
    streaks.push(streak)
    return message
}

const modCommands = (helper: sqlhelper, exit) => {
    const cmds = {
        "!setodds": (channel, userstate, args) =>
            (isNaN(args[0]) ?
                Promise.reject('args[0] is not a number') :
                helper.updateSettings(channel, { gamble_odds: args[0] })
                    .then(() => "Odds set to " + args[0] + "."))
                .catch(() => strings.notANumber),

        "!setgambletime": (channel, userstate, args) =>
            (isNaN(args[0]) ?
                Promise.reject('args[0] is not a number') :
                helper.updateSettings(channel, { gamble_time: args[0] })
                    .then(() => "Gamble time set to " + args[0] + "."))
                .catch(() => strings.notANumber),

        "!setgamblemul": (channel, userstate, args) =>
            (isNaN(args[0]) ?
                Promise.reject('args[0] is not a number') :
                helper.updateSettings(channel, { gamble_multiplier: args[0] })
                    .then(() => "Gamble multiplier set to " + args[0] + "."))
                .catch(() => strings.notANumber),

        "!bonus": (channel, userstate, args) => {
            const [owner_channel, points] = args
            const displayName = userstate['display-name']
            return Promise.all([
                helper.getSettings(channel),
                helper.addPoints(owner_channel, channel, points)
            ]).then(([settings, x]) => {
                if (points > 0)
                    return displayName + ", " + owner_channel + " has been given " + points + " " + settings.points_name
                if (points <= 0)
                    return displayName + ", " + owner_channel + " has had " + -points + " " + settings.points_name + " taken from them."
            })
        },

        "!bonusall": (channel, userstate, args) => {
            const amount = parseInt(args[0])
            if (isNaN(amount)) return strings.notANumber
            return Promise.all([
                helper.getSettings(channel).then(helper.debug),
                helper.bonusAll(amount, channel)])
                .then(([settings]) =>
                    strings.bonusAll(userstate['display-name'], amount, settings.points_name))
        },

        "!exit": (channel) => exit(strings.exit, "#" + channel)
    }

    const commandsFunction = (channel, userstate, args) =>
        "Mod commands are: " + Object.keys(cmds).concat("!modcommands").join(", ")

    return Object.assign(cmds, { "!modcommands": commandsFunction })
}

const commands = (helper: sqlhelper, client) => {

    const gambleCommand = (al) => (channel, userstate, args) => {
        const gambler = userstate.username
        const amount = parseInt(args[0])
        const all = al || (args[0] === "all")
        gambleUsers = gambleUsers.filter(e => e.time_up > Date.now())
        const user = gambleUsers.find(e => e.gambler == gambler && e.channel == channel)
        if (user) { // if there user is gambling before the timeout
            return Promise.resolve(
                strings.gambleTooSoon(Math.round((user.time_up - Date.now()) / (1000)),
                    userstate['display-name']))
        }
        if ((isNaN(amount) || !Number.isInteger(amount)) && !all) { // error checking
            return Promise.resolve(strings.notANumber)
        } else { // successful gamble
            return helper.getSettings(channel).then(settings =>
                helper.getPoints(gambler, channel)
                    .then(points => gamble(all ? points : amount, settings, userstate, helper, points, gambler, channel))
                    .catch(() => strings.notEnoughPoints(userstate['display-name'], settings.points_name)))
        }
    }

    const ticket = (channel, userstate, args) => { //TODO: use primary key to update instead of splitting code paths
        return Promise.all([
            helper.getCurrentLottery(channel),
            helper.getPoints(userstate.username, channel)
        ]).then(([{ lottery, users }, points]) => {
            const tickets = parseInt(args[0])

            if (isNaN(tickets) || tickets <= 0)
                return strings.notANumber

            if (tickets > lottery.ticket_max)
                return strings.lotteryTooMany(userstate['display-name'], lottery.ticket_max)

            if (points < lottery.ticket_cost * tickets)
                return helper.getSettings(channel)
                    .then(settings => strings.notEnoughPoints(userstate['display-name'], settings.points_name))

            const entry = users.find(u => u.entrant_channel === userstate.username)
            if (entry) {
                if (entry.tickets + tickets > lottery.ticket_max)
                    return strings.lotteryTooMany(userstate['display-name'], lottery.ticket_max, entry.tickets)
                const obj = { ...entry, tickets: entry.tickets + tickets }
                return helper.updateLotteryEntrant(obj)
                    .then(() => helper.addPoints(userstate.username, channel, -(tickets * lottery.ticket_cost)))
                    .then(() => strings.boughtTickets(userstate['display-name'], tickets))
                    .catch(err => {
                        console.log(err)
                        return ""
                    })
            } else {
                const obj = {
                    id: lottery.entrants_id,
                    entrant_channel: userstate.username,
                    tickets
                }
                return Promise.all([
                    helper.insert(obj, 'lottery_entrants'),
                    helper.addPoints(userstate.username, channel, -(tickets * lottery.ticket_cost))
                ]).then(() => strings.boughtTickets(userstate['display-name'], tickets))
            }
        }).catch(() => strings.noLottery)
    }

    const cmds: { [command: string]: (channel: string, userstate: any, args: string[]) => Promise<String> } = {
        "!points": (channel, userstate, args) => Promise.all([
            helper.getPoints(userstate.username, channel),
            helper.getSettings(channel)
        ]).then(([points, settings]) =>
            strings.points(userstate['display-name'], points, settings.points_name)),

        "!gamble": gambleCommand(false),

        "!gambleall": gambleCommand(true),

        "!odds": (channel, userstate, args) =>
            helper.getSettings(channel)
                .then(settings => strings.gambleOdds(settings.gamble_odds)),

        "!gambletime": (channel, userstate, args) =>
            helper.getSettings(channel)
                .then(settings => strings.gambleTime(settings.gamble_time)),

        "!raffle": (channel, userstate, args) =>
            Promise.all([
                helper.getSettings(channel),
                helper.getCurrentLottery(channel)
            ]).then(([settings, { lottery, users }]) =>
                strings.lottery(
                    users.length,
                    users.reduce((a, b) => a + b.tickets, 0),
                    lottery.ticket_cost,
                    lottery.ticket_max,
                    settings.points_name))
                .catch(() => strings.noLottery),

        "!ticket": ticket,

        "!tickets": ticket,

        "!playlist": (channel, userstate, args): Promise<string> =>
            helper.getSongRequests(channel)
                .then(requests => requests.slice(0, 5))
                .then(requests => {
                    const yt = google.youtube('v3')
                    const ids = requests.map(request =>
                        getYoutubeId(request.reward_info)
                    ).join(",")
                    return yt.videos.list({ auth: 'YOUR_API_KEY_HERE', id: ids, part: "snippet" })
                }).then((data) => {
                    const str = data.data.items.map(item => item.snippet.title).join(", ")
                    return str
                }).catch((err) => {
                    console.log(err)
                    return strings.noSongs()
                }),

        "!song": (channel, userstate, args) =>
            helper.getSongRequests(channel)
                .then(requests =>
                    requests[0].reward_info
                ).catch(err => {
                    console.log(err)
                    return strings.noSongs()
                }),

        "!contest": (channel, userstate, args) =>
            helper.getCurrentContest(channel)
                .then(strings.contest)
                .catch(() => strings.noContest(userstate['display-name'])),

        "!bet": (channel, userstate, args) => Promise.all([
            helper.getCurrentContest(channel),
            helper.getPoints(userstate.username, channel)
        ]).then(([{ contest, options, entrants }, points]) => {
            if (args.length < 2) return strings.contest({ contest, options })
            if (entrants.some(entrant => entrant.entrant_channel === userstate.username)) //untested
                return strings.alreadyBet(userstate['display-name'])
            const bet = parseInt(args[1])
            const option = parseInt(args[0])
            if (isNaN(bet + option))
                return strings.notANumber
            if (points < bet)
                return helper.getSettings(channel)
                    .then(settings => strings.notEnoughPoints(userstate['display-name'], settings.points_name))
            if (bet > contest.max_bet)
                return strings.betOverMax(userstate['display-name'], contest.max_bet)
            if (option > options.length || option < 1)
                return strings.wrongBetOption(userstate['display-name'], options.length)
            if (contest.is_started)
                return strings.contestStarted(userstate['display-name'], contest.description)
            return Promise.all([
                helper.insert({
                    entrant_channel: userstate.username,
                    broadcaster_channel: channel,
                    points: bet,
                    bet_option: option - 1,
                    id: contest.entrants_id
                }, 'contest_entrants'),
                helper.addPoints(userstate.username, channel, -bet)])
                .then(() => strings.bet(userstate['display-name'], bet, option))
        }).catch(() => strings.noContest(userstate['display-name'])),

        "!duel": (channel: string, userstate, args: string[]) => {
            duels = duels.filter(d => d.timeout < new Date().getMilliseconds())
            if (args[0]) {
                return Promise.all([helper.getPoints(userstate.username, channel), helper.getPoints(args[0].toLowerCase(), channel)])
                    .then(([challenger_points, opponent_points]) => {
                        const dool: Duel = {
                            channel, challenger_points, opponent_points,
                            challenger: userstate.username,
                            opponent: args[0].toLowerCase(),
                            points: Math.min(challenger_points, opponent_points, 5000),
                            timeout: new Date().getMilliseconds() + 1000 * 60 * 10
                        }
                        duels = duels.concat(dool)
                        return dool
                    }).then(dool => helper.getSettings(channel).then(({ points_name }) =>
                        Promise.all([
                            client.whisper(dool.opponent, strings.challengeIssued(dool, points_name)),
                            client.whisper(dool.challenger, strings.challengeGood(dool, points_name))])))
                    .catch(err => client.whisper(userstate.username, strings.noSuchUser(userstate['display-name'])))
                    .then(() => Promise.reject())

            } else {
                return Promise.resolve(`Usage: !duel opponent`)
            }
        },

        "!streak": (channel, userstate, args) => helper.getSettings(channel)
            .then((settings) =>
                strings.streak(streaks.find(s => s.gambler == userstate.username && s.channel == channel) ||
                    { gambler: userstate.username, channel, streak: 0, total: 0, winning: false }, settings.points_name))

    }

    const commandsFunction = (channel, userstate, args) =>
        "Commands are: " + Object.keys(cmds).concat("!commands").join(", ")

    return Object.assign(cmds, { "!commands": commandsFunction })
}

const whisperCommands = (helper: sqlhelper, client) => {
    const cmds = {
        "!decline": (from, userstate, args) => {
            const [challenger, channel] = args
            const x = duels.find(d => d.challenger == challenger && d.channel == channel && d.opponent == userstate.username)
            duels = duels.filter(d =>
                !(d.challenger == challenger && d.channel == channel && d.opponent == userstate.username))
            if (x) {
                return Promise.all([client.whisper(from, strings.challengeDeclined(x)), client.whisper(challenger, strings.challengeDeclined(x))])
            } else {
                return client.whisper(from, strings.noSuchChallenge(userstate['display-name']))
            }
        },
        "!accept": (from, userstate, args) => {
            const [challenger, channel] = args
            const duel = duels.find(d => d.challenger == challenger && d.channel == channel && d.opponent == userstate.username)
            duels = duels.filter(d =>
                !(d.challenger == challenger && d.channel == channel && d.opponent == userstate.username))
            if (duel) {
                const [challenger_roll, opponent_roll] =
                    [Math.random(), Math.random()].map(n => Math.round(n * 100))
                if (challenger_roll == opponent_roll) {
                    return helper.getSettings(channel).then(({ points_name }) =>
                        strings.duelEquals({ ...duel, challenger_roll, opponent_roll }, points_name))
                        .then(str => client.say("#" + channel, str))
                } else {
                    return Promise.all([helper.getPoints(duel.challenger, duel.channel), helper.getPoints(duel.opponent, duel.channel)])
                        .then(([c, o]) => {
                            console.log(c, o, duel.points)
                            if (c < duel.points || o < duel.points) {
                                return client.say("#" + channel, strings.duelNoPoints(duel))
                                    .then(() => Promise.reject())
                            } else {
                                return Promise.resolve()
                            }
                        }).then(() => Promise.all([
                            helper.getSettings(channel),
                            helper.addPoints(duel.challenger, duel.channel, (challenger_roll > opponent_roll ? 1 : -1) * duel.points),
                            helper.addPoints(duel.opponent, duel.channel, (challenger_roll > opponent_roll ? -1 : 1) * duel.points)])
                            .then(([settings]) =>
                                strings.duelCompleted({ ...duel, challenger_roll, opponent_roll }, settings.points_name))
                            .then(str => client.say("#" + channel, str)))
                }
            } else {
                return strings.noSuchChallenge(userstate['display-name'])
            }
        }
    }
    return cmds
}

const allCommands = (helper: sqlhelper, exit: (toSay: string, channel: string) => any, client) => ({
    commands: commands(helper, client),
    modCommands: Object.assign(modCommands(helper, exit), commands(helper, client)),
    whisperCommands: whisperCommands(helper, client)
})

export default allCommands