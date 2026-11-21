var express = require('express');
var router = express.Router();
var path = require("path");

router.get('/', function (req, res) {
    res.cookie('username', 'wpapsco');
    res.cookie('hash', 'otekxg9hvb335zwygj7yqphig7di7n');
    res.sendFile(path.join(__dirname+'/../public/index.html'));
});

module.exports = router;