const strings = require('./strings')

/*
{gambler, time_up, channel}
*/

let gambleUsers = []

const gamble = (amount, settings, userstate, helper, points, gambler, channel) => {
    if (amount <= 0) return strings.gambleTooSmall
    if (amount > points) return strings.notEnoughPoints(userstate['display-name'], settings.points_name)
    gambleUsers = gambleUsers.concat([{ gambler, channel, time_up: Date.now() + (1000 * 60 * settings.gamble_time) }])
    const roll = Math.floor(Math.random() * 100) + 1
    const toWin = userstate.subscriber ? settings.gamble_odds - 5 : settings.gamble_odds
    if (roll > 98) {
        helper.addPoints(gambler, channel, amount * settings.gamble_multiplier)
        return strings.gambleSuperWin(userstate['display-name'],
            roll, amount * settings.gamble_multiplier,
            settings.points_name, points + amount * settings.gamble_multiplier)
    } else if (roll > toWin) {
        helper.addPoints(gambler, channel, amount)
        return strings.gambleWin(userstate['display-name'], roll, amount, settings.points_name, points + amount)
    } else {
        helper.addPoints(gambler, channel, -amount)
        return strings.gambleLose(userstate['display-name'], roll, settings.points_name, points - amount, amount)
    }
}

const modCommands = (helper, exit) => {
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

const commands = (helper) => {

    const gambleCommand = (all) => (channel, userstate, args) => {
        const gambler = userstate.username
        const amount = args[0]
        gambleUsers = gambleUsers.filter(e => e.time_up > Date.now())
        const user = gambleUsers.find(e => e.gambler == gambler && e.channel == channel)
        if (user) {
            return Promise.resolve(
                strings.gambleTooSoon(Math.round((user.time_up - Date.now()) / (1000)),
                    userstate['display-name']))
        }
        if (isNaN(amount) && !all) {
            return Promise.resolve(strings.notANumber)
        } else {
            return helper.getSettings(channel).then(settings =>
                helper.getPoints(gambler, channel)
                    .then(points => gamble(all ? points : parseInt(amount), settings, userstate, helper, points, gambler, channel))
                    .catch(reason => strings.notEnoughPoints(userstate['display-name'], settings.points_name)))
        }
    }

    const cmds = {
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

        "!ticket": (channel, userstate, args) => {
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
                    console.log("there's an entry")
                    if (entry.tickets + tickets > lottery.ticket_max)
                        return strings.lotteryTooMany(userstate['display-name'], lottery.ticket_max, entry.tickets)
                    const obj = { ...entry, tickets: entry.tickets + tickets }
                    console.log(obj)
                    return helper.updateLotteryEntrant(obj)
                        .then(() => strings.boughtTickets(userstate['display-name'], tickets))
                        .catch(err => console.log(err))
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
        },

        "!contest": (channel, userstate, args) =>
            helper.getCurrentContest(channel)
                .then(strings.contest)
                .catch(() => strings.noContest(userstate['display-name'])),

        "!bet": (channel, userstate, args) => Promise.all([
            helper.getCurrentContest(channel),
            helper.getPoints(userstate.username, channel)
        ]).then(([{ contest, options, entrants }, points]) => {
            if (args.length < 2) return strings.contest({ contest, options, entrants })
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
            if (contest.is_started == 1)
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
        }).catch(() => strings.noContest(userstate['display-name']))
    }

    const commandsFunction = (channel, userstate, args) =>
        "Commands are: " + Object.keys(cmds).concat("!commands").join(", ")

    return Object.assign(cmds, { "!commands": commandsFunction })
}

const allCommands = (helper, exit) => ({
    commands: commands(helper),
    modCommands: Object.assign(modCommands(helper, exit), commands(helper))
})

module.exports = allCommands