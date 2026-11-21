// router.post('/redeem/', functions.validateCookies, function (req, res) {
//     console.log("posted to!");
//     console.log(req.body);
//     console.log(req.cookies);

//     req.dbpool.getConnection(function (dberr, connection) {
//         if (dberr) throw dberr;
//         connection.query('SELECT * FROM streamlabs_keys WHERE channel = ?;', [req.body.channel], function (sqerr1, key) {
//             if (sqerr1) throw sqerr1;
//             connection.changeUser({ database: 'rewards' });
//             connection.query('SELECT * FROM ?? WHERE reward_id = ?;', [req.body.channel, req.body.reward_id], function (sqerr, rows, fields) {
//                 if (sqerr) throw sqerr;
//                 connection.changeUser({ database: 'redeemed_rewards' });
//                 values = [req.body.channel, req.body.reward_id, rows[0].reward_price, req.cookies.username, req.body.reward_info, new Date()];
//                 console.log(values);
//                 connection.query('INSERT INTO ?? VALUES (?, ?, ?, ?, ?);', values);
//                 connection.changeUser({ database: 'channels' });
//                 connection.query('UPDATE ?? SET points = points - ? WHERE name = ?', [req.body.channel, rows[0].reward_price, req.cookies.username]);
//                 //send a twitchalert if neccessary
//                 var m = "";
//                 var d = 1000;
//                 console.log(rows[0]);
//                 if (rows[0].do_twitchalert == 1) {
//                     m = req.cookies.username + " redeemed *" + rows[0].reward_name + "*";
//                     d = 5000;
//                 }
//                 console.log(m);
//                 sendAlert = function (k, message, duration) {
//                     var options = {
//                         method: 'POST',
//                         url: 'https://streamlabs.com/api/v1.0/alerts',
//                         headers:
//                         {
//                             'postman-token': '92262633-14aa-6a27-d389-81a38a0ef1b7',
//                             'cache-control': 'no-cache',
//                             'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
//                         },
//                         formData:
//                         {
//                             access_token: k,
//                             type: 'subscription',
//                             message: message,
//                             image_href: "http://i.imgur.com/zJ9w5sF.png",
//                             sound_href: 'https://streamlabs.com/sounds/gallery/default.ogg',
//                             special_text_color: "#eb42f4",
//                             duration: duration
//                         }
//                     };

//                     request(options, function (error, response, body) {
//                         if (error) throw new Error(error);
//                     });
//                 }

//                 //if we need a new token get a new one FUCK this date shit
//                 console.log(key[0]);
//                 if (key[0].created_at) {
//                     var expires_at = key[0].created_at;
//                     expires_at.setMinutes(expires_at.getMinutes() + key[0].expires_in);
//                 }

//                 if (key[0].created_at == null || expires_at < new Date()) {
//                     var options = {
//                         method: 'POST',
//                         url: 'https://streamlabs.com/api/v1.0/token',
//                         headers:
//                         {
//                             'postman-token': 'fa6f39a7-a26e-2b7d-d293-5de6e5f9d75a',
//                             'cache-control': 'no-cache',
//                             'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
//                         },
//                         formData:
//                         {
//                             client_id: 'F9HckpMwb4rG7EnnrlMFnLgt1hwuMsBwPTnJxQH4',
//                             grant_type: 'refresh_token',
//                             client_secret: '2DYzfnKBWaCH2X4e2Isu4BXuPUd9kDC3qznG8xOb',
//                             redirect_uri: 'http://www.papscopoints.com/streamlabssignup',
//                             refresh_token: key[0].refresh_token
//                         }
//                     };

//                     request(options, function (error, response, body) {
//                         if (error) throw new Error(error);
//                         console.log(body);
//                         var bo = JSON.parse(body);
//                         console.log(bo);
//                         values = [bo.access_token, bo.refresh_token, bo.expires_in, new Date(), req.body.channel];
//                         sql = 'UPDATE streamlabs_keys SET code = ?, refresh_token = ?, expires_in = ?, created_at = ? where channel = ?;';
//                         console.log(values);
//                         connection.changeUser({ database: 'settings' });
//                         connection.query(sql, values);
//                         connection.release();
//                         sendAlert(bo.access_token, m, d);
//                         res.send({ 'OK': 200 });
//                     });
//                 } else {
//                     sendAlert(key[0].code, m, d);
//                     connection.release();
//                     res.send({ 'OK': 200 });
//                 }
//             });
//         });
//     });
// });