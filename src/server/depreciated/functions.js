module.exports = {
    validateCookies: function (req, res, next) {
        if (req.cookies.username && req.cookies.hash) {
            req.dbpool.getConnection(function (dberr, connection) {
                if (dberr) throw dberr;
                connection.query('SELECT * FROM channel_settings WHERE channel=? AND twitch_oauth=?;', [req.cookies.username, req.cookies.hash], function (sqerr, rows, fields) {
                    if (sqerr) throw sqerr;
                    if (rows.length == 1) {
                        next();
                        console.log('cookies validated');
                    } else {
                        res.redirect('/');
                    }
                    connection.release();
                });
            });
        } else {
            res.redirect('/');
        }
    },
    validateCookiesCallback: function (req, callback) {
        if (req.cookies.username && req.cookies.hash) {
            req.dbpool.getConnection(function (dberr, connection) {
                if (dberr) throw dberr;
                connection.query('SELECT * FROM channel_settings WHERE channel=? AND twitch_oauth=?;', [req.cookies.username, req.cookies.hash], function (sqerr, rows, fields) {
                    if (sqerr) throw sqerr;
                    callback(rows.length == 1);
                    connection.release();
                });
            });
        } else {
            callback(false);
        }
    },
    getContest: function (req, callback) {
        req.dbpool.getConnection(function (dberr, connection) {
            if (dberr) throw dberr;
            connection.changeUser({ database: "contests" });
            var sql = "SELECT * FROM contest WHERE channel=? AND is_ongoing=1;";
            var values = [req.cookies.username];
            connection.query(sql, values, function (sqerr, contest) {
                if (sqerr) throw sqerr;
                if (contest.length == 0) {
                    callback({});
                    connection.release();
                } else {
                    sql = "SELECT * FROM options WHERE uuid=? ORDER BY option_number ASC;";
                    values = [contest[0].options];
                    connection.query(sql, values, function (sqerr1, options) {
                        if (sqerr1) throw sqerr1;
                        sql = "SELECT * FROM entrants WHERE uuid=?;";
                        values = [contest[0].entrants];
                        connection.query(sql, values, function (sqerr2, entrants) {
                            if (sqerr2) throw sqerr2;
                            console.log(entrants);
                            console.log(contest[0].entrants);
                            callback({ options: options, entrants: entrants, contest: contest[0] });
                            connection.release();
                        });
                    });
                }
            });
        });
    },
    addPoints: function (user, points, req) {
        req.dbpool.getConnection(function (dberr, connection) {
            if (dberr) throw dberr;
            connection.changeUser({ database: 'channels' });
            var sql = "UPDATE ?? SET points = points + ? WHERE name=?;";
            var values = [req.cookies.username, points, user];
            connection.query(sql, values);
            connection.release();
        });
    },
    getSettings: function (req, callback) {
        req.dbpool.getConnection(function (dberr, connection) {
            if (dberr) throw dberr;
            connection.changeUser({ database: 'settings' });
            var sql = "SELECT * FROM channel_settings WHERE channel = ?;";
            var values = [req.cookies.username];
            connection.query(sql, values, function (sqerr, settings) {
                if (sqerr) throw sqerr;
                callback(settings[0]);
                connection.release();
            });
        });
    },
    getAllSettings: function (req, callback) {
        req.dbpool.getConnection(function (dberr, connection) {
            if (dberr) throw dberr;
            connection.changeUser({ database: 'settings' });
            var sql = "SELECT * FROM channel_settings;";
            var values = [req.cookies.username];
            connection.query(sql, values, function (sqerr, settings) {
                if (sqerr) throw sqerr;
                callback(settings);
                connection.release();
            });
        });
    },
    setBotRunning: function (req, value) {
        req.dbpool.getConnection(function (dberr, connection) {
            if (dberr) throw dberr;
            connection.changeUser({ database: 'settings' });
            var sql = "UPDATE channel_settings SET is_running = ? WHERE channel = ?;";
            var values = [(value ? 1 : 0), req.cookies.username];
            connection.query(sql, values);
            connection.release();
        });
    },
}