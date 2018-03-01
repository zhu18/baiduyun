var Geter = require('./geter.js');
var db = require('./db');
var config = require('./config');
var async = require('async');
var File = db.File;

var queue = [];
var geter = new Geter(queue);

//爬虫
var robot = {
    isRuning: false,
    log:Geter.log,
    curThreadCount: 0,
    maxLevel: 3000, //人脉扫描深度
    maxThreadCount: 20,
    newCount: 0,
    newCount1:0,
    queryLog:[],
    start: function () {
        robot.isRuning=true;
        console.log('======================== 爬虫已启动 ==================');
  //    geter.getUserSpecial('1515570336', parseSpecial);
        //得到订阅
        geter.getUserFollow(config.beginUserID, function (data) {
            parseFollow(data, null);
        });

    },
    stop: function () {
        robot.isRuning = false;
        console.log('====================== 爬虫准备停止[等待当前任务完成] ====================');
    }
};



function parseFollow2(data,next) {
    if (!robot.isRuning)
        return;

    console.log("当前用户订阅数："+data.total_count);
    if (data.errno == 0 && data.total_count > 0) {

    }
}



function parseFollow1(data) {
    if(!robot.isRuning)
        return;

    console.log("当前用户订阅数："+data.total_count);
    var uindex = 0;
    if (data.errno == 0 && data.total_count > 0) {
        //所有订阅用户的ID
        var userids=data.follow_list.map(function(user){
            return user.follow_uk;
        });

        //串行访问，防止并发封IP  获取用户资源
        async.mapLimit(userids,asyncNum,function(uid,callback){

                  console.log("准备获取第"+(++uindex)+"位用户["+uid+"]分享资源");
                  geter.getUserShare(uid, function(res){
                      parseShare(res,function(){
                          callback(null, uid);
                      });
                  });

        },function(err,res){
            if(err){
                console.log("[error]获取用户资源错误:"+err);
            }
            else {
                console.log(res.length+"位用户资源获取成功:"+res.join(','));
                //串行访问，获当前用户的订阅用户

                async.mapLimit(userids,asyncNum,function(uid,callback){
                    geter.getUserFollow(uid, function (data) {
                        parseFollow1(data);
                    });
                    callback(null,uid);

                },function(err,res){
                    if(err)
                    {

                    }
                    else
                    {
                        console.log(res.length+"位用户订阅信息获取成功");
                    }
                })


            }
        });
    }
}

var wait = function (mils) {
    var now = new Date;
    while (new Date - now <= mils);
};

var allCount = 0;
var lastUser='';
var waitTime=100;
var asyncNum=1;
//用户订阅callback [遍历已订阅的用户的分享资源]
function parseFollow(data, level) {
    console.log('==========================level ' + level + '===' + (allCount++) + '==================');

    if (data.errno == 0 && data.total_count > 0) {       
            //遍历已订阅的用户
            data.follow_list.forEach(function (user) {

                //得到用户的分享文件并入库
                if (user.pubshare_count > 0) {
                    geter.getUserShare(user.follow_uk, parseShare);

                    // geter.getUserSpecial(user.follow_uk, parseSpecial);
                }
               
                if (user.follow_count > 0) {
                    var curlevel = level + 1; //人脉深度

                    if (curlevel <= robot.maxLevel) {
                        setImmediate(function () {
                            lastUser=user.follow_uk;
                            geter.getUserFollow(user.follow_uk, function (data) {
                                parseFollow(data, curlevel);
                            });
                            wait(waitTime);
                        });
                    }
                }
            });
       
          wait(waitTime);

    }
}




//用户分享资源callback 资源入库
function parseShare(data,next) {
    console.log('===========================用户资源总数:'+data.total_count+'==================');
    if (data.errno == 0 && data.total_count > 0) {
        data.records.forEach(function (e) {           
            var file = new File({
                uk: e.uk,
                username: e.username,
                avatar_url: e.avatar_url,
                total_count: data.total_count,
                source_id: e.source_id,
                title: e.title,
                feed_time: new Date(e.feed_time),
                shorturl: e.shorturl,
                desc: e.desc,
                create_at: new Date(),
                update_at: new Date(),
            });
            file.save(function (error) {
                if (error) {
                    //  console.log('------save err-----')
                    if (error.code == 11000) {
                        console.log('资源重复：' + e.title + ",忽略");
                    } else {
                        console.error(error);
                    }
                } else {
                    robot.newCount++;
                    console.log('添加新资源：' + e.title + "," + robot.newCount);

                }
                if(next)next();
            });
        });

    }
}
//"album_id": "8411422132082564847",
//"title": "生活大爆炸(第8季)",
//"desc": "《生活大爆炸》（The Big Bang Theory）是由查克·洛尔和比尔·普拉迪创作的一出美国情景喜剧，此剧由华纳兄弟电视公司和查克·洛尔制片公司共同制作。由马克·森德罗斯基导演，吉姆·帕森斯，约翰尼·盖尔克奇，凯莉·库柯，西蒙·黑尔贝格、昆瑙·纳亚尔等人主演。该剧讲述的是四个宅男科学家和一个...",
//"cover": 576466367811720,
//"create_time": 1417744070,
//"update_time": 1417744097,
//"cover_thumb": "http://d.pcs.baidu.com/thumbnail/ac9f024f19d1d2c21f8d24bba9788a08?fid=1515570336-250528-576466367811720&time=1446339600&rt=sh&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-4wNMBa4szamUc%2Bg4QccUJ99oz3U%3D&expires=2h&chkv=0&chkbd=0&chkpc=&dp-logid=7059536137866261653&dp-callid=0&size=c200_u200&quality=100",
//"vCnt": 70,
//"tCnt": 1,
//"dCnt": 0,
//"filecount": 1
//用户专辑资源callback 资源入库
function parseSpecial(data) {
    //console.log('===========================rparseShare==================');
    if (data.errno == 0 && data.count > 0) {
        data.album_list.forEach(function (e) {         
            var file = new File({
               // uk: e.uk,
               // username: e.username,
               // avatar_url: e.avatar_url,
               // total_count: data.total_count,
                source_id: e.album_id,
                album_id:e.album_id,
                title: e.title,
                cover_thumb:e.cover_thumb,                
                feed_time: e.update_at,
                filecount:e.filecount,
                type:1,
              //  shorturl: e.shorturl,
                desc: e.desc,
                create_at: new Date(),
                update_at: new Date(),
            });
            file.save(function (error) {
                if (error) {
                    //  console.log('------save err-----')
                    if (error.code == 11000) {
                        console.log('资源重复11：' + e.title + ",忽略");
                    } else {
                        console.error(error);
                    }
                } else {
                    robot.newCount1++;
                    console.log('添加新资源11：' + e.title + "," + robot.newCount1);
                }

            });
        });

    }
}

exports = module.exports = robot;
