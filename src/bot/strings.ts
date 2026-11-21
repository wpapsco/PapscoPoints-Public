import { Duel, Streak } from "../types";
import { Stream } from "stream";

const padStart = (s: string, size: number, fill: string) => fill.repeat(size - s.length) + s

class strings {

    s = (n) => n == 1 ? "" : "s"

    timedOut = "I guess I'll just be on my way..."

    somePoints = (points, pointsName) => points + " " + pointsName

    points = (name, points, pointsName) => name + " has " + points + " " + pointsName

    joinMessage = () => ["Hello!", "Hello there!", "sup"][Math.floor(Math.random() * 3)]

    gambleTooSmall = "You must choose an amount to gamble"

    notEnoughPoints = (name, pointsName) => name + ", you don't have enough " + pointsName + " for that"

    gambleTooSoon = (seconds, displayName) => displayName + ", you must wait for an additional " +
        Math.floor(seconds / 60) + ":" + padStart((seconds % 60).toString(), 2, '0') +
        " before you may gamble again."

    gambleTime = (minutes) => "You must wait " + minutes + " minute" + ((minutes == 1) ? "" : "s") + " between gambles."

    gambleOdds = (odds) => "You must roll higher than a " + odds + " to win. " +
        "Subs must roll higher than an " + (odds - 5) + "."

    gambleSuperWin = (name, roll, won, pointsName, total) =>
        name + " rolled a " + roll + ", won " + this.somePoints(won, pointsName) + " and now has " + this.somePoints(total, pointsName) + "!"

    gambleWin = (name, roll, won, pointsName, total) =>
        name + " rolled a " + roll + ", won " + this.somePoints(won, pointsName) + " and now has " + this.somePoints(total, pointsName)

    gambleLose = (name, roll, pointsName, total, gambled) =>
        name + " rolled a " + roll + ", lost " + this.somePoints(gambled, pointsName) + " and now has " + this.somePoints(total, pointsName)

    notANumber = "That isn't a number"
    noValue = "You must enter a value"
    newLottery = "A new raffle has started! Type \"!raffle\" to see more."
    noLottery = "There is no raffle"

    lottery = (users, tickets, cost, max, pointsName) =>
        "Current raffle has " + users + " entrants with " + tickets + " tickets. Tickets cost " + cost +
        " " + pointsName + ". Type \"!ticket x\" to buy x tickets (max: " + max + ")"

    lotteryTooManyA = (name, max) => name + ", you can't buy that many tickets; the max is " + max

    lotteryTooMany = (name, max, current?) => (current) ?
        this.lotteryTooManyA(name, max) + " and you already have " + current :
        this.lotteryTooManyA(name, max)

    boughtTickets = (displayName, tickets) => displayName + ", you bought " + tickets + " ticket" + this.s(tickets) + "!"

    commands = (commands, modCommands) =>
        "Commands are " + commands.reduce((a, b) => a + ", " + b) + " Broadcaster commands: " + modCommands.reduce((a, b) => a + ", " + b)

    exit = "Goodbye!"

    bonusAll = (user, points, pointsName) =>
        user + ", everyone has been given " + this.somePoints(points, pointsName) + "!"

    newContest = "A new contest has started! Type \"!contest\" to see more."

    noContest = (user) => user + ", there is no contest"

    contest = ({ contest, options }) =>
        contest.description + ":" +
        options.reduce((acc, c) => acc + " " + (c.option_number + 1) + ")" + c.text, "") +
        "; max bet is " + contest.max_bet + "."

    alreadyBet = (user) => user + ", you have already bet!"

    betOverMax = (user, max) => user + ", that is over the max bet of " + max

    wrongBetOption = (user, options) =>
        user + ", the option you have selected is invalid; you must select a number between 1 and " + options

    bet = (user, bet, option) => user + " has bet " + bet + " on option " + option

    contestStarted = (user, description) => user + ", \"" + description + "\" has already started"

    lotteryClosed = "The raffle has now been closed!"
    betsClosed = "Bets have closed!"
    contestClosed = (winner, points, pointsName) =>
        "The contest is now over! The biggest winner is " + winner + " who won " + this.somePoints(points, pointsName) + "!"

    donation = (name, amount, donationsMul, pointsName) => "Thank you, " + name +
        " for your donation of $" + amount + "! You have been given " + this.somePoints(amount * donationsMul, pointsName) + "!"

    subMessage = (dollars, name, points, pointsName) =>
        "Thanks for the " + dollars + " sub, " + name + "! You have been given " + this.somePoints(points, pointsName) + "!"

    subGift = (dollars, giftee, gifter, giftee_points, gifter_points, pointsName) =>
        gifter + " has gifted a " + dollars + " sub to " + giftee + "! They receive " +
        this.somePoints(gifter_points, pointsName) + " and " + this.somePoints(giftee_points, pointsName) + " respectively"

    bits = (username, bits, points, pointsName) => "Thanks, " + username + " for the " +
        bits + " bits! You have been given " + this.somePoints(points, pointsName) + "!"

    noSuchChallenge = (displayName: string) =>
        displayName + ", there is no such duel."

    challengeIssued = (duel: Duel, pointsName: string) =>
        duel.opponent + "! You have been challenged to a gamble duel vs " + duel.challenger + " in "
        + duel.channel + "'s channel! Reply \"!accept " + duel.challenger + " " + duel.channel +
        "\" to wager " + this.somePoints(duel.points, pointsName) +
        " and accept, or \"!decline " + duel.challenger + " " + duel.channel + "\" to decline."

    challengeGood = (duel: Duel, pointsName: string) =>
        duel.challenger + "! You have challenged " + duel.opponent + " to a gamble duel in "
        + duel.channel + "'s channel for " + this.somePoints(duel.points, pointsName) + "!"

    challengeDeclined = (duel: Duel) =>
        "The duel has been declined by " + duel.opponent + "."

    duelEquals = (duel: Duel, pointsName) =>
        duel.challenger + " has tied in a gamble duel vs " + duel.opponent + "! No " + pointsName + " are exchanged."

    duelCompleted = (duel: Duel, pointsName: string) => {
        const winner = duel.challenger_roll > duel.opponent_roll ? duel.challenger : duel.opponent
        const loser = duel.challenger_roll < duel.opponent_roll ? duel.challenger : duel.opponent
        const winner_points = duel.challenger_roll > duel.opponent_roll ? duel.challenger_points + duel.points : duel.opponent_points + duel.points
        const loser_points = duel.challenger_roll < duel.opponent_roll ? duel.challenger_points - duel.points : duel.opponent_points - duel.points
        return winner + " has won in a gamble duel worth " + this.somePoints(duel.points, pointsName) + " vs " + loser +
            " and now has " + this.somePoints(winner_points, pointsName) + "! " + loser + " has " + this.somePoints(loser_points, pointsName)
    }

    noSuchUser = (displayName: string) =>
        displayName + ", that user does not exist or has no points."

    duelNoPoints = (duel: Duel) =>
        "The duel between " + duel.challenger + " and " + duel.opponent + " cannot be completed because someone has lost too many points"

    noSongs = () => "There are no songs in the queue."

    streak = (streak: Streak, pointsName: string) => streak.gambler + " is on a " + (streak.winning ? "winning" : "losing") + " streak of " +
        streak.streak + " gambles and has " + (streak.winning ? "won" : "lost") + " a total of " + streak.total + " " + pointsName + "."
}


export default strings