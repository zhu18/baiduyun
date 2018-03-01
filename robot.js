
import db from './db';
import config from './config';
import request from 'superagent';
import proxy from 'superagent-proxy';
import colors from 'colors';
import moment from 'moment';

//init color
colors.setTheme({
    silly: 'rainbow',
    input: 'white',
    verbose: 'zebra',
    prompt: 'blue',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'magenta',
    error: 'red'
});
//init request proxy.format 'http://xxx.xxx.xxx.xxx:80'
proxy(request);


var File = db.File;





//要爬取的相关url
var yunpan_url={
    //得到用户粉丝
    fanslist: 'https://pan.baidu.com/pcloud/friend/getfanslist?query_uk={uid}&limit=24&start=0&bdstoken=2eacc9670635a8b59bb3e770b3442819&channel=chunlei&clienttype=0&web=1',
    //得到用户分享资源列表
    sharelist:'https://pan.baidu.com/pcloud/feed/getsharelist?t=1445847228683&category=0&auth_type=1&request_location=share_home&start=0&limit=60&query_uk={uid}&channel=chunlei&clienttype=0&web=1&bdstoken=2eacc9670635a8b59bb3e770b3442819',
    //得到专辑
    speciallist:'https://pan.baidu.com/pcloud/album/getlist?t=1446340380059&start=0&limit=60&query_uk={uid}&channel=chunlei&clienttype=0&web=1&bdstoken=2eacc9670635a8b59bb3e770b3442819',
    //得到用户订阅用户
    followlist: 'https://pan.baidu.com/pcloud/friend/getfollowlist?query_uk={uid}&limit=24&start={start}&bdstoken=2eacc9670635a8b59bb3e770b3442819&channel=chunlei&clienttype=0&web=1',
    //用户信息
    userinfo:'https://pan.baidu.com/pcloud/user/getinfo?bdstoken=2eacc9670635a8b59bb3e770b3442819&query_uk={0}&t=1446530699323&channel=chunlei&clienttype=0&web=1',
    //该用户的订阅用户
    getFollowlistUrl:(uid)=>{
        return yunpan_url.followlist.replace('{uid}', uid).replace('{start}', 0);
    },
    getSharelistUrl:(uid)=>{
        return yunpan_url.sharelist.replace('{uid}', uid);
    }
}


//爬虫
var robot = {
    maxLevel:250,
    newCount:0,
    ignoreCount:0,
    errorCount:0,
    queryCount:0,
    newList:[],         //记录最近新添加10条的资源信息  参考listMaxLenght
    ignoreList:[],     //记录最近已忽略10条的资源信息
    errorList:[],       //记录最近10条错误信息
    queryLog:[],
    isRuning: false,
    proxy:config.proxy,
    proxyUsedCount:0,
    totalUserCount:0,
    totalRequestCount:0,
    startTime:0,
    endTime:0,
    start: function () {
        if(robot.isRuning)return;
        console.log('=========================================');
        console.log('               百度云盘爬虫启动            ');
        console.log('=========================================');

        robot.isRuning=true;
        this.startTime = new Date().getTime();//起始时间
        dowork();
    },
    stop: function () {
        robot.isRuning = false;
    },
    getRunTime:function(isFormat){
        this.endTime=(new Date().getTime())-this.startTime;
        if(isFormat)
            return formatDuring(this.endTime);
        else
            return this.endTime;
    },
    onError:async function(err){
        //记录错误
        robot.errorCount++;
        addInfoToList(robot.errorList,err);

        robot.proxy=robot.getNewProxy();
        console.log(("错误:"+err.message+",切换IP:"+robot.proxy+"重新请求, 使用总IP数:"+robot.proxyUsedCount).error);
        console.log(("错误url:"+err.url).data);
        let querystr=err.url.split('?')[1];
        let ps=querystr.split('&');
        let uid='';
        ps.forEach(function(p){
            let pname=p.split('=')[0];
            let pvalue=p.split('=')[1];
            if(pname=='query_uk')
                uid=pvalue;
        })

        if(uid){
            console.log('重新请求：uid：'+uid);
        await getFollowUser(uid);
        }

    },
    getNewProxy:function(){
        //192.168.10.3~254
        //192.168.11.6~155
        //192.168.13.3~154
        //192.168.14.155~254
        robot.proxyUsedCount++;
        let max=154,min=4;
        let ip='192.168.13.'+Math.floor(Math.random()*(max-min+1)+min);
        return 'http://'+ip+':80';
    },
    addInfoToList:function(list,data,maxCount){
        addInfoToList(list,data,maxCount);
    }
};
async function dowork(){
    if(config.beginUserID){
        console.log('--开始爬取目标用户uid:'+config.beginUserID+'--');
        await getFollowUser(config.beginUserID);
        console.log('--规划任务已完成--');
    }
    else{
        console.log('--未设置爬取用户目标--');
    }

    while(robot.isRuning){
        let uid=createRandomUserId();
        console.log('--执行随机种子爬取任务:'+uid+'--');
        await getFollowUser(uid);
    }
    console.log('=====爬虫已停止======');
}

var listMaxLenght=10;
function addInfoToList(list,data,maxCount){
    var count=maxCount||listMaxLenght;
    list.unshift({time:moment().format('hh:mm:ss'),data:data});
    if(list.length>count)
        list.length=count;
}

var parsedUserList=[];//{uid,count}  已经读取过的用户缓存不在读取。
var level=0;
//解析用户的订阅用户
 function getFollowUser(uid){
     console.log(("运行状态："+robot.isRuning).error);
     if(!robot.isRuning)
         return;

     if(parsedUserList.indexOf(uid)!=-1)
     {
         console.log(('用户:'+uid+' 已爬取,跳过').warn);
         return;
     }

     parsedUserList.push(uid);

    return get(yunpan_url.getFollowlistUrl(uid)).then(async function(data){
        if (data.errno == 0 && data.total_count > 0) {
            console.log(('获取用户uid:'+uid+' 的订阅用户数:'+data.total_count+" === level:"+level).warn);

            for(let user of data.follow_list)
            {
                //得到用户的分享文件并入库
                if (user.pubshare_count > 0) {
                    await getUserShare(user.follow_uk);
                    // geter.getUserSpecial(user.follow_uk, parseSpecial);
                }

                if (user.follow_count > 0) {
                    level++; //人脉深度

                   // if (level <= robot.maxLevel) {
                        await getFollowUser(user.follow_uk);
                        // setImmediate(function () {
                        //     geter.getUserFollow(user.follow_uk);
                        // });
                  //  }
                }
            }

        }
    },robot.onError);
}

//得到用户的分享文件
function getUserShare(uid){
    if(!robot.isRuning)
        return;
     console.log('序号:'+(++robot.totalUserCount)+' 准备获取用户uid:'+uid+' 的分享文件');
     return get(yunpan_url.getSharelistUrl(uid)).then(function(data){
         parseShare(data);
     },robot.onError)
}








function createRandomUserId(){
    let len=9,userId='';//len：用户ID生成位数
    for(let i=0;i<len;i++)
    {
        userId+=Math.floor(Math.random()*10);
    }
    return userId;
}


function get(url) {
    return new Promise(function(next, err){
        setTimeout(function () {
            request.get(url)
            .proxy(robot.proxy)
            //添加请求头
            // .set('Cookie',getCK())
            //  .set('User-Agent',getUA())
                .set('Referer','https://pan.baidu.com/share/home')
                .end(function (ex, res) {
                    console.log("总请求数:"+(++robot.totalRequestCount)+" 总用时:"+formatDuring(robot.getRunTime()));
                    if (ex) {
                        //Geter.log.errCount++;
                        //Geter.onError(err, url, next);
                        ex.url=url;
                        err(ex);
                        //console.log(err.message.error);
                    } else {

                        //Geter.log.okCount++;

                        if (res.body.errno != '0') {
                            if(res.body.errno == '-55'){
                                //ip 限制 {errno:'-55',error_msg:'to fast'} 请求太快
                                err({message:'ip限制',url:url});
                            }
                            else{
                                res.body.url=url;
                                err(res.body);
                            }

                        } else {

                                next(res.body);
                        }
                    }
                });
        },500);
    });
}

function formatDuring(mss) {
    var days = parseInt(mss / (1000 * 60 * 60 * 24));
    var hours = parseInt((mss % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = parseInt((mss % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((mss % (1000 * 60)) / 1000);
    return  hours + ":" + minutes + ":" + seconds + "";
}





//用户分享资源callback 资源入库
function parseShare(data,next) {
    if (data.errno == 0 && data.total_count > 0) {
        console.log('=========用户id:'+data.records[0].uk+' 用户名称:'+data.records[0].username+' 资源总数:'+data.total_count+'==================');
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
                        addInfoToList(robot.ignoreList,{message:e.title});
                        console.log(colors.data('忽略资源重复：' + e.title + " 总忽略数:" + (++robot.ignoreCount)));
                    } else {
                        console.error(error);
                    }
                } else {
                    addInfoToList(robot.newList,{message:e.title});
                    console.log(colors.cyan('添加新资源：' + e.title + " 总添加数:") + (++robot.newCount));
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
                        console.log(colors.data('资源重复11：' + e.title + ",忽略"));
                    } else {
                        console.error(error);
                    }
                } else {
                    robot.newCount1++;
                    console.log(colors.data('添加新资源11：' + e.title + " ") + robot.newCount1);
                }

            });
        });

    }
}

var uslist=[
    "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.93 Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/22.0.1207.1 Safari/537.1",
    "Mozilla/5.0 (X11; CrOS i686 2268.111.0) AppleWebKit/536.11 (KHTML, like Gecko) Chrome/20.0.1132.57 Safari/536.11",
    "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.6 (KHTML, like Gecko) Chrome/20.0.1092.0 Safari/536.6",
    "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/536.6 (KHTML, like Gecko) Chrome/20.0.1090.0 Safari/536.6",
    "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/19.77.34.5 Safari/537.1",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/536.5 (KHTML, like Gecko) Chrome/19.0.1084.9 Safari/536.5",
    "Mozilla/5.0 (Windows NT 6.0) AppleWebKit/536.5 (KHTML, like Gecko) Chrome/19.0.1084.36 Safari/536.5",
    "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1063.0 Safari/536.3",
    "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1063.0 Safari/536.3",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_0) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1063.0 Safari/536.3",
    "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1062.0 Safari/536.3",
    "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1062.0 Safari/536.3",
    "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1061.1 Safari/536.3",
    "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1061.1 Safari/536.3",
    "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1061.1 Safari/536.3",
    "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1061.0 Safari/536.3",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.24 (KHTML, like Gecko) Chrome/19.0.1055.1 Safari/535.24",
    "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/535.24 (KHTML, like Gecko) Chrome/19.0.1055.1 Safari/535.24"];

function getUA(){
    var r= parseInt(Math.random()*uslist.length,10);
    return uslist[r];
}


var cklist=['BAIDUID=03B0FFC5463E4C959726EC7B7E37E4C6:FG=1; PANWEB=1; Hm_lvt_a3139a1feb7fec092cafd367407ee051=1442892149; BDUSS=k5-TVJoeDI5M1F5Zkl3SWQ5Nmt3RTVLNVA5WDBsWTZ4SnRkSlpvUDBaNkVweWhXQVFBQUFBJCQAAAAAAAAAAAEAAADpJR8Aemh1MTgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIQaAVaEGgFWQ; bdshare_firstime=1444474173795; BIDUPSID=73669519FA63C76DE205C3D123005849; PSTM=1444797746; Hm_lvt_1d15eaebea50a900b7ddf4fa8d05c8a0=1445476133,1445841931,1445846448,1445846903; Hm_lpvt_1d15eaebea50a900b7ddf4fa8d05c8a0=1445846903; Hm_lvt_f5f83a6d8b15775a02760dc5f490bc47=1445476133,1445841931,1445846448,1445846903; Hm_lpvt_f5f83a6d8b15775a02760dc5f490bc47=1445846903; t_pcnt=20151026-0; defVol=94; isMute=false; BDSFRCVID=ei0sJeC62lyaV6b4--f27nFnGeKMCq5TH6aIcXf0cHS6LCFRVcEuEG0PJOlQpYD-Mm3zogKK0mOTHvbP; H_BDCLCKID_SF=JRAjoK-XJDv8fJ6xq4vhh4oHjHAX5-RLfanIa4OF5lOTJh0R3hK5jT0_yfOU56tLKeomLb5aQb3dbqQRK5bke6bbDa8ftT8sKDLXWt5OaRI_Hn7zePoEDbtpbt-qJt78KGFq3D-EHRLKMnrDhxJqyUudKHonBT5KWC7v0DJJWU8-8hOD0ljjQJLkQN3TBfRQL6RkKT6zaCO0Dn3oyT3VXp0n5x5TqtJHKbDJ_DKatUK; recommendTime=android2015-10-29 20:01; H_PS_PSSID=17520_1427_17812_12826_17783_14429_10211_17000_17072_15658_12413_14551_17050; PANPSC=6465487323383822392%3AXhHJHDWiArgGAKSu3YEp51Tcg8wjIh7YTFLTCo1f6fETgA%2Ba9SdZ26llPBIN4wco8VJlMX7coAfYxkmNGSXqZ1S8iM8U8ihNj%2FF8UySlqbhSAP7GKQ%2BhrJlbe%2F5LRzxJW94xrccIURc26c9rsoCzOR1gO%2BrhLxZQwO6IUlyEdXIdUIZskcEOYET6EtWQMy2KsHHN9wux3JA%3D; Hm_lvt_773fea2ac036979ebb5fcc768d8beb67=1445331978,1445476134,1445841934,1445846453; Hm_lpvt_773fea2ac036979ebb5fcc768d8beb67=1446186923; Hm_lvt_adf736c22cd6bcc36a1d27e5af30949e=1445331978,1445476134,1445841934,1445846453; Hm_lpvt_adf736c22cd6bcc36a1d27e5af30949e=1446186923',
    'BAIDUID=9A8F2A8ABA6E10F7D6F7E6A203EBB56C:FG=1; BIDUPSID=9A8F2A8ABA6E10F7D6F7E6A203EBB56C; PSTM=1446179982; H_PS_PSSID=17772_17386_17781_1453_17392_13245_12826_17783_14431_17445_17835_17000_17072_15511_12339_17051; BDSFRCVID=_3ksJeCCxG3ICov4-TGih_dRdNDZSXG-d5OR3J; H_BDCLCKID_SF=tRk8oItMJCvBfJuk-4QEbbQH-UnLqh4e257Z0lOnMp05OqOv568V3M-tMbnbQt3w3NQghp0E5I5cVCO_e4bK-Tr3jNADtM5; PANWEB=1; Hm_lvt_a3139a1feb7fec092cafd367407ee051=1446188021; Hm_lpvt_a3139a1feb7fec092cafd367407ee051=1446188021; Hm_lvt_1d15eaebea50a900b7ddf4fa8d05c8a0=1446188028; Hm_lpvt_1d15eaebea50a900b7ddf4fa8d05c8a0=1446188028; Hm_lvt_f5f83a6d8b15775a02760dc5f490bc47=1446188021; Hm_lpvt_f5f83a6d8b15775a02760dc5f490bc47=1446188028; PANPSC=14416839387047684324%3ASzpdS1fQcpv26%2FyCm1sMUF%2FZsIj986bZbbpyH3KiIui5Y0UN2jM5eXgXofrWESI4ni2%2BbYPalrqDbqsVbu3NBpz0EuMei0YKSj9n0c7vlp7eMbM9ZuYdxxcHEfySKsiRbbpyH3KiIuiMIBsCbecWwF5GQqxMenr7Oy6S0zDqC6XMSrjPbAM3M6O2GhXGA0dK; Hm_lvt_773fea2ac036979ebb5fcc768d8beb67=1446188030; Hm_lpvt_773fea2ac036979ebb5fcc768d8beb67=1446188056; Hm_lvt_adf736c22cd6bcc36a1d27e5af30949e=1446188030; Hm_lpvt_adf736c22cd6bcc36a1d27e5af30949e=1446188057'];

function getCK(){
    var r= parseInt(Math.random()*cklist.length,10);
    return cklist[r];
}
exports = module.exports = robot;
