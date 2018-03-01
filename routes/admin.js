var express = require('express');
var router = express.Router();
var robot = require('../robot');


/* admin */
router.get('/', function(req, res) {
    res.render('admin', {
        title: '百度云后台管理'
    });
});

router.get('/robot/start', function(req, res) {
    robot.start();
    res.send(robot.isRuning);
});
router.get('/robot/stop', function(req, res) {
    robot.stop();
    res.send(robot.isRuning);
});

router.get('/robot/info', function(req, res) {
    res.send(robot);
});


module.exports = router;
