require('isomorphic-fetch')
import sqlhelper from "../sqlhelper"

const values = <T>(obj) => Object.keys(obj).map(key => <T>obj[key])

function pointgiver(helper: sqlhelper) {
    setInterval(() => {
        helper.listOnlineUsers()
            .then(users =>
                Promise.all(users.map(({ channel }) =>
                    fetch("https://tmi.twitch.tv/group/user/" + channel + "/chatters")
                        .then(r => r.json())
                        .then(j =>
                            (j === Object(j) && 'chatters' in j) ? j.chatters : Promise.reject('no chatters'))
                        .then(chatters => (values<string[]>(chatters)).reduce((a: string[], b:string[]) => a.concat(b)))
                        .then(chatters => helper.incrementAllPoints(chatters, channel))
                ))).catch(e => null)
    }, 1000 * 60)
}

export default pointgiver