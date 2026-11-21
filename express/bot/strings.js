"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const padStart = (s, size, fill) => fill.repeat(size - s.length) + s;
class strings {
    constructor() {
        this.s = (n) => n == 1 ? "" : "s";
        this.timedOut = "I guess I'll just be on my way...";
        this.somePoints = (points, pointsName) => points + " " + pointsName;
        this.points = (name, points, pointsName) => name + " has " + points + " " + pointsName;
        this.joinMessage = () => ["Hello!", "Hello there!", "sup"][Math.floor(Math.random() * 3)];
        this.gambleTooSmall = "You must choose an amount to gamble";
        this.notEnoughPoints = (name, pointsName) => name + ", you don't have enough " + pointsName + " for that";
        this.gambleTooSoon = (seconds, displayName) => displayName + ", you must wait for an additional " +
            Math.floor(seconds / 60) + ":" + padStart((seconds % 60).toString(), 2, '0') +
            " before you may gamble again.";
        this.gambleTime = (minutes) => "You must wait " + minutes + " minute" + ((minutes == 1) ? "" : "s") + " between gambles.";
        this.gambleOdds = (odds) => "You must roll higher than a " + odds + " to win. " +
            "Subs must roll higher than an " + (odds - 5) + ".";
        this.gambleSuperWin = (name, roll, won, pointsName, total) => name + " rolled a " + roll + ", won " + this.somePoints(won, pointsName) + " and now has " + this.somePoints(total, pointsName) + "!";
        this.gambleWin = (name, roll, won, pointsName, total) => name + " rolled a " + roll + ", won " + this.somePoints(won, pointsName) + " and now has " + this.somePoints(total, pointsName);
        this.gambleLose = (name, roll, pointsName, total, gambled) => name + " rolled a " + roll + ", lost " + this.somePoints(gambled, pointsName) + " and now has " + this.somePoints(total, pointsName);
        this.notANumber = "That isn't a number";
        this.noValue = "You must enter a value";
        this.newLottery = "A new raffle has started! Type \"!raffle\" to see more.";
        this.noLottery = "There is no raffle";
        this.lottery = (users, tickets, cost, max, pointsName) => "Current raffle has " + users + " entrants with " + tickets + " tickets. Tickets cost " + cost +
            " " + pointsName + ". Type \"!ticket x\" to buy x tickets (max: " + max + ")";
        this.lotteryTooManyA = (name, max) => name + ", you can't buy that many tickets; the max is " + max;
        this.lotteryTooMany = (name, max, current) => (current) ?
            this.lotteryTooManyA(name, max) + " and you already have " + current :
            this.lotteryTooManyA(name, max);
        this.boughtTickets = (displayName, tickets) => displayName + ", you bought " + tickets + " ticket" + this.s(tickets) + "!";
        this.commands = (commands, modCommands) => "Commands are " + commands.reduce((a, b) => a + ", " + b) + " Broadcaster commands: " + modCommands.reduce((a, b) => a + ", " + b);
        this.exit = "Goodbye!";
        this.bonusAll = (user, points, pointsName) => user + ", everyone has been given " + this.somePoints(points, pointsName) + "!";
        this.newContest = "A new contest has started! Type \"!contest\" to see more.";
        this.noContest = (user) => user + ", there is no contest";
        this.contest = ({ contest, options }) => contest.description + ":" +
            options.reduce((acc, c) => acc + " " + (c.option_number + 1) + ")" + c.text, "") +
            "; max bet is " + contest.max_bet + ".";
        this.alreadyBet = (user) => user + ", you have already bet!";
        this.betOverMax = (user, max) => user + ", that is over the max bet of " + max;
        this.wrongBetOption = (user, options) => user + ", the option you have selected is invalid; you must select a number between 1 and " + options;
        this.bet = (user, bet, option) => user + " has bet " + bet + " on option " + option;
        this.contestStarted = (user, description) => user + ", \"" + description + "\" has already started";
        this.lotteryClosed = "The raffle has now been closed!";
        this.betsClosed = "Bets have closed!";
        this.contestClosed = (winner, points, pointsName) => "The contest is now over! The biggest winner is " + winner + " who won " + this.somePoints(points, pointsName) + "!";
        this.donation = (name, amount, donationsMul, pointsName) => "Thank you, " + name +
            " for your donation of $" + amount + "! You have been given " + this.somePoints(amount * donationsMul, pointsName) + "!";
        this.subMessage = (dollars, name, points, pointsName) => "Thanks for the " + dollars + " sub, " + name + "! You have been given " + this.somePoints(points, pointsName) + "!";
        this.subGift = (dollars, giftee, gifter, giftee_points, gifter_points, pointsName) => gifter + " has gifted a " + dollars + " sub to " + giftee + "! They receive " +
            this.somePoints(gifter_points, pointsName) + " and " + this.somePoints(giftee_points, pointsName) + " respectively";
        this.bits = (username, bits, points, pointsName) => "Thanks, " + username + " for the " +
            bits + " bits! You have been given " + this.somePoints(points, pointsName) + "!";
        this.noSuchChallenge = (displayName) => displayName + ", there is no such duel.";
        this.challengeIssued = (duel, pointsName) => duel.opponent + "! You have been challenged to a gamble duel vs " + duel.challenger + " in "
            + duel.channel + "'s channel! Reply \"!accept " + duel.challenger + " " + duel.channel +
            "\" to wager " + this.somePoints(duel.points, pointsName) +
            " and accept, or \"!decline " + duel.challenger + " " + duel.channel + "\" to decline.";
        this.challengeGood = (duel, pointsName) => duel.challenger + "! You have challenged " + duel.opponent + " to a gamble duel in "
            + duel.channel + "'s channel for " + this.somePoints(duel.points, pointsName) + "!";
        this.challengeDeclined = (duel) => "The duel has been declined by " + duel.opponent + ".";
        this.duelEquals = (duel, pointsName) => duel.challenger + " has tied in a gamble duel vs " + duel.opponent + "! No " + pointsName + " are exchanged.";
        this.duelCompleted = (duel, pointsName) => {
            const winner = duel.challenger_roll > duel.opponent_roll ? duel.challenger : duel.opponent;
            const loser = duel.challenger_roll < duel.opponent_roll ? duel.challenger : duel.opponent;
            const winner_points = duel.challenger_roll > duel.opponent_roll ? duel.challenger_points + duel.points : duel.opponent_points + duel.points;
            const loser_points = duel.challenger_roll < duel.opponent_roll ? duel.challenger_points - duel.points : duel.opponent_points - duel.points;
            return winner + " has won in a gamble duel worth " + this.somePoints(duel.points, pointsName) + " vs " + loser +
                " and now has " + this.somePoints(winner_points, pointsName) + "! " + loser + " has " + this.somePoints(loser_points, pointsName);
        };
        this.noSuchUser = (displayName) => displayName + ", that user does not exist or has no points.";
        this.duelNoPoints = (duel) => "The duel between " + duel.challenger + " and " + duel.opponent + " cannot be completed because someone has lost too many points";
        this.noSongs = () => "There are no songs in the queue.";
        this.streak = (streak, pointsName) => streak.gambler + " is on a " + (streak.winning ? "winning" : "losing") + " streak of " +
            streak.streak + " gambles and has " + (streak.winning ? "won" : "lost") + " a total of " + streak.total + " " + pointsName + ".";
    }
}
exports.default = strings;
