var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var sha1 = require('sha1');
var request = require('request');

router.get('/', (req, res) => { //TODO: test
    const options = {
        method: 'POST',
        url: 'https://api.twitch.tv/kraken/oauth2/token',
        qs:
        {
            client_id: process.env.TWITCH_ID,
            client_secret: process.env.TWITCH_SECRET,
            code: req.query.code,
            grant_type: 'authorization_code',
            redirect_uri: 'http://www.papscopoints.com/twitchsignin'
        },
        headers:
        {
            'postman-token': '61c25973-0a6d-5762-27f2-1019e0f738e1',
            'cache-control': 'no-cache'
        }
    };

    request(options, (error1, response, body) => {
        if (error1) throw new Error(error1);
        const access_token = JSON.parse(body).access_token; //get access token for twitch
        const options2 = {
            method: 'GET',
            url: 'https://api.twitch.tv/kraken/user',
            headers:
            {
                'postman-token': '676f3269-5648-710f-e2af-36cec9feefc2',
                'cache-control': 'no-cache',
                'client-id': process.env.TWITCH_ID,
                authorization: 'OAuth ' + access_token,
                accept: 'application/vnd.twitchtv.v5+json'
            }
        };

        request(options2, (error2, response2, body2) => {
            if (error2) throw new Error(error2);
            const username = JSON.parse(body2).name; //get their username via api
            console.log(username);
            console.log(access_token);
            req.helper.getSettings(username, access_token)
                .catch(() =>
                    req.helper.newUser(username, access_token))
                .then(() => {
                    res.cookie('username', username); //create cookies for the user
                    res.cookie('hash', access_token);
                }).then(() => res.redirect('/settings'))
        })
    })
})

// router.get('/', function (req, res) {
//     var options = {
//         method: 'POST',
//         url: 'https://api.twitch.tv/kraken/oauth2/token',
//         qs:
//         {
//             client_id: process.env.TWITCH_ID,
//             client_secret: process.env.TWITCH_SECRET,
//             code: req.query.code,
//             grant_type: 'authorization_code',
//             redirect_uri: 'http://www.papscopoints.com/twitchsignin'
//         },
//         headers:
//         {
//             'postman-token': '61c25973-0a6d-5762-27f2-1019e0f738e1',
//             'cache-control': 'no-cache'
//         }
//     };

//     request(options, function (error1, response, body) {
//         if (error1) throw new Error(error1);
//         var access_token = JSON.parse(body).access_token;
//         var options2 = {
//             method: 'GET',
//             url: 'https://api.twitch.tv/kraken/user',
//             headers:
//             {
//                 'postman-token': '676f3269-5648-710f-e2af-36cec9feefc2',
//                 'cache-control': 'no-cache',
//                 'client-id': process.env.TWITCH_ID,
//                 authorization: 'OAuth ' + access_token,
//                 accept: 'application/vnd.twitchtv.v5+json'
//             }
//         };

//         request(options2, function (error2, response2, body2) {
//             if (error2) throw new Error(error2);
//             var username = JSON.parse(body2).name;
//             console.log(username);
//             console.log(access_token);
//             req.dbpool.getConnection(function (dberr, connection) {
//                 if (dberr) throw dberr;
//                 var sql = "SELECT (channel) FROM channel_settings WHERE channel = ?;"
//                 var values = [username];
//                 connection.query(sql, values, function (sqerr, rows, fields) {
//                     if (sqerr) throw sqerr;
//                     //create cookies for the user
//                     res.cookie('username', username);
//                     res.cookie('hash', access_token);
//                     //is the user already in our db?
//                     if (rows.length > 0) {
//                         connection.query("UPDATE channel_settings SET twitch_oauth = ? WHERE channel = ?;", [access_token, username]);
//                         connection.release();
//                         res.redirect('/settings');
//                         return;
//                     }
//                     connection.query("INSERT INTO channel_settings VALUES (1, 'Points', ?, '', '', '', 3, 60, 1, 0.33334, 50, 20, '', 0, ?, '0000-01-01');", [username, access_token]);
//                     //create rewards DB
//                     connection.changeUser({ 'database': 'rewards' });
//                     connection.query("CREATE TABLE ?? (reward_name VARCHAR(255), reward_price int not null, reward_description VARCHAR(255), reward_id VARCHAR(255), do_twitchalert int default 0, is_songrequest int default 0);", [username]);
//                     console.log("rewards done");
//                     //create lotteries db
//                     connection.changeUser({ 'database': 'lotteries' });
//                     connection.query("CREATE TABLE ?? (users VARCHAR(255), start_time DATETIME, ticket_cost int not null, ticket_max int not null, is_ongoing int default 0, donations_value int default 0, show_donations int default 0);", [username]);
//                     console.log("lotteries done");
//                     //create redeemed_rewards db
//                     connection.changeUser({ 'database': 'redeemed_rewards' });
//                     connection.query("CREATE TABLE ?? (reward_id VARCHAR(255), refund_cost int not null, redeemer VARCHAR(255), reward_info VARCHAR(255), redeem_time DATETIME);", [username]);
//                     console.log("redeemed rewards done");
//                     //create channel db
//                     // channels = functions.getDbConnection('channels');
//                     // channels.connect((err) => {
//                     //     if (err) throw err;

//                     // })
//                     connection.release();
//                     res.redirect('/settings');
//                 });
//             });
//             console.log(body2);
//         });
//         console.log(body);
//     });
// });
module.exports = router;