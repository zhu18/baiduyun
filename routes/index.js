var express = require('express');
var router = express.Router();
var db = require('../db');
var File = db.File;
var robot = require('../robot');
var request = require('superagent');
var proxy = require('superagent-proxy');

proxy(request);

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', {
        title: '百度云盘搜索'
    });
});

var pageSize = 25;
router.get('/find/:key/:index', function (req, res) {
    robot.queryCount++;
    robot.addInfoToList(robot.queryLog,{ip:req.ip,key:req.params.key,time:new Date()},50);
    console.log("----------来之"+req.ip+"查询："+req.params.key);
    find(req.params.key, req.params.index, function (err, data) {
        if (err) {
            res.send({
                message: '查询失败'
            });
            return;
        }
        res.send(data);
    });
});

router.get('/new/:index', function (req, res) {
    console.log("-----------------------"+req.ip+"查询最新");
    find('', req.params.index, function (err, data) {
        if (err) {
            res.send({
                message: '最新数据查询失败'
            });
            return;
        }
        res.send(data);
    });
});

//得到热门电影movie
//得到热门电视剧tv
router.get('/hot/:type/:count', function (req, res) {
    var type=req.params.type;
    var count=req.params.count;

    var url ='https://movie.douban.com/j/search_subjects?type='+type+'&tag=%E7%83%AD%E9%97%A8&sort=recommend&page_limit='+count+'&page_start=0'
var cookie='bid=Kh_Dd9VuM04; ll="108288"; gr_user_id=f6b01873-451e-43a8-a931-030fb5b902c4; viewed="1395614_20452222_26266109_26349497"; __yadk_uid=WqNUINWIevgIx6fS7WA1U88ttiIOjEw2; ct=y; ap=1; _vwo_uuid_v2=FCD66AF35632DAFD2B24BA67960D52EC|460d2c7c68b97f929bc432f9f1b9b9e6; __ads_session=XIORT2RI6wisYokaGAA=; __utma=30149280.1885633032.1479720376.1496224429.1496372219.45; __utmb=30149280.0.10.1496372219; __utmc=30149280; __utmz=30149280.1496224429.44.38.utmcsr=baidu|utmccn=(organic)|utmcmd=organic; __utma=223695111.2005247609.1494582254.1496224429.1496372219.17; __utmb=223695111.0.10.1496372219; __utmc=223695111; __utmz=223695111.1496372219.17.12.utmcsr=baidu|utmccn=(organic)|utmcmd=organic|utmctr=%E8%B1%86%E7%93%A3; _pk_ref.100001.4cf6=%5B%22%22%2C%22%22%2C1496372223%2C%22https%3A%2F%2Fwww.baidu.com%2Fs%3Fwd%3D%25E8%25B1%2586%25E7%2593%25A3%26tn%3D98012088_5_dg%26ch%3D11%22%5D; _pk_id.100001.4cf6=e25d971a38ea9832.1494582254.15.1496372223.1496224638.; _pk_ses.100001.4cf6=*'
    request
        .get(url)
       // .proxy(robot.getNewProxy())//每次使用新IP 防止被封
         .set('Referer','https://movie.douban.com/')
         .set('Host','movie.douban.com')
        .set('User-Agent','Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.110 Safari/537.36')
        .set('X-Requested-With','XMLHttpRequest')
         .set('Cookie',cookie)
        .set('Accept-Encoding','gzip, deflate, sdch, br')
        .set('Accept-Language','zh-CN,zh;q=0.8')
        .set('Cache-Control','no-cache')
        .set('Connection','keep-alive')

        .end(function(ex,data){
            if(ex){
                res.send(ex);
            }
            else{
           // console.log(data.body)
            res.send(data.body);
            }
        })

});



function find(key, index, next) {
    if (index < 0) 
        index = 0;
    File.find({
            title: {
                $regex: key,
                $options: 'i'
            }
        })
        .sort({
            "feed_time": -1
        })
        .limit(pageSize)
        .skip(pageSize * index)
        .exec(next);
}


module.exports = router;
//{
//            $regex: '\\/' + req.params.key + '\\/'
//}
