const { gethelper } = require('../sqlhelper')
const strings = require('./strings')
module.exports = (helper, client) => { //TODO: test
    // const helper = gethelper("")
    let lastids = {} //{ channel, id } to keep track of what the last id we saw was so we can know what is new
    const doDonations = (key, settings) => { //do donations for one user
        const lastid = settings.channel in lastids ? lastids[settings.channel] : 0 //get our lastid if we have it, else 0
        return fetch("https://streamlabs.com/api/v1.0/donations?access_token=" + key.code + "&limit=1&currency=USD&after=" + lastid)
            .then(r => r.json())
            .then(j => {
                if (j.data.length > 0) return j.data[0]
                return Promise.reject('no donation') //we should have at least one so reject if we don't
            })
            .then(donation => {
                if (donation.donation_id === lastids[settings.channel])
                    return Promise.reject("no new donation") //if the ids are the same, we've already done this one
                lastids[settings.channel] = donation.donation_id //update lastids
                if (lastid === 0)
                    return Promise.reject("first check") // if lastid is 0, this is our first run-through so this donation is old so ignore it and reject
                return Promise.all([
                    helper.addPoints(donation.name.toLowerCase(), //add points for the donation to the db and...
                        settings.channel, Math.round(settings.donations_mul * parseFloat(donation.amount))),
                    client.say(settings.channel, //put a message in chat
                        strings.donation(donation.name, donation.amount, settings.donations_mul, settings.points_name))])
            })
    }
    const interval = () => {
        helper.listOnlineUsers() //first find all the users we want to watch
            .then(users => Promise.all(users.map((settings) =>
                helper.getStreamlabsKey(settings.channel) //get their keys 
                    .then(key => doDonations(key, settings))
                    .catch(x => console.log(x))))) //and do the donations (catch is added so the full promise.all is always resolved)
    }
    setInterval(interval, 30 * 1000) //do this every thirty seconds
    interval() //including now
}