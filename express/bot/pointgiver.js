require('isomorphic-fetch')

function pointgiver(helper) {
    setInterval(() => {
        helper.listOnlineUsers()
            .then(users =>
                users.map(({ channel }) =>
                    fetch("https://tmi.twitch.tv/group/user/" + channel + "/chatters")
                        .then(r => r.json())
                        .then(j =>
                            (j === Object(j) && 'chatters' in j) ? j.chatters : Promise.reject('no chatters'))
                        .then(chatters => Object.values(chatters).reduce((a, b) => a.concat(b)))
                        .then(chatters => helper.incrementAllPoints(chatters, channel))
                )).catch(() => null)
    }, 1000 * 60)
}

module.exports = (helper) => new pointgiver(helper)