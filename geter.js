

var config = require('./config');
var request = require('superagent');
require('superagent-proxy')(request);

// HTTP, HTTPS, or SOCKS proxy to use
var proxy = config.proxy||'http://127.0.0.1:80';

//3477062229,1512283603
//分享列表：http://yun.baidu.com/pcloud/feed/getsharelist?t=1445847228683&category=0&auth_type=1&request_location=share_home&start=0&limit=60&query_uk={uid}&channel=chunlei&clienttype=0&web=1&bdstoken=2eacc9670635a8b59bb3e770b3442819

//用户信息：http://yun.baidu.com/pcloud/user/getinfo?bdstoken=2eacc9670635a8b59bb3e770b3442819&query_uk={uid}&t=1445847228758&channel=chunlei&clienttype=0&web=1

//我的订阅：http://yun.baidu.com/pcloud/friend/getfollowlist?query_uk={uid}&limit=24&start=0&bdstoken=2eacc9670635a8b59bb3e770b3442819&channel=chunlei&clienttype=0&web=1

//我的粉丝：http://yun.baidu.com/pcloud/friend/getfanslist?query_uk=3477062229&limit=24&start=0&bdstoken=2eacc9670635a8b59bb3e770b3442819&channel=chunlei&clienttype=0&web=1

//我的专辑：http://yun.baidu.com/pcloud/album/getlist?t=1445848812771&start=0&limit=60&query_uk=3477062229&channel=chunlei&clienttype=0&web=1&bdstoken=2eacc9670635a8b59bb3e770b3442819
//资源短链接：yun.baidu.com/s/1eQoBbeM

//具体资源：http://yun.baidu.com/share/link?uk=436751272&shareid=3701300436

//得到用户粉丝
var fanslist_url = 'https://pan.baidu.com/pcloud/friend/getfanslist?query_uk={uid}&limit=24&start=0&bdstoken=2eacc9670635a8b59bb3e770b3442819&channel=chunlei&clienttype=0&web=1';
//得到用户分享资源列表
var sharelist_url = 'https://pan.baidu.com/pcloud/feed/getsharelist?t=1445847228683&category=0&auth_type=1&request_location=share_home&start=0&limit=60&query_uk={uid}&channel=chunlei&clienttype=0&web=1&bdstoken=2eacc9670635a8b59bb3e770b3442819';
//得到专辑
var speciallist_url='https://pan.baidu.com/pcloud/album/getlist?t=1446340380059&start=0&limit=60&query_uk={uid}&channel=chunlei&clienttype=0&web=1&bdstoken=2eacc9670635a8b59bb3e770b3442819'
//得到用户订阅
var followlist_url = 'https://pan.baidu.com/pcloud/friend/getfollowlist?query_uk={uid}&limit=24&start={start}&bdstoken=2eacc9670635a8b59bb3e770b3442819&channel=chunlei&clienttype=0&web=1';

//用户信息
var userinfo_url='https://pan.baidu.com/pcloud/user/getinfo?bdstoken=2eacc9670635a8b59bb3e770b3442819&query_uk={0}&t=1446530699323&channel=chunlei&clienttype=0&web=1'
//数据获取器
var Geter = function () {
    //得到用户分享资源列表
    this.getUserShare = function (uid, next) {
            get(sharelist_url.replace('{uid}', uid), next);
        },
          //得到用户专辑资源列表
    this.getUserSpecial = function (uid, next) {
            get(speciallist_url.replace('{uid}', uid), next);
        },
        //得到用户粉丝
        this.getUserFans = function (uid, next) {
            get(fanslist_url.replace('{uid}', uid), next);
        },
        //得到用户订阅
        this.getUserFollow = function (uid, next) {
            get(followlist_url.replace('{uid}', uid).replace('{start}', 0), next);
        },
        //得到用户信息
        this.getUserInfo=function(uid, next){
            get(userinfo_url.replace('{uid}',uid), next);
        },
        this.getTest=function(uid){

        }
}

Geter.log = {
    requestCount: 0,
    okCount: 0,
    errCount: 0,
    iplimitCount: 0,
}

//请求错误执行
Geter.onError = function (err, url, next) {
    console.log('===' + (new Date()).toLocaleString() + '请求数据出错:' + err.message + '\n' + url);
    setTimeout(function () {
            get(url, next);
        },
        1000 * 60 * 3);
}

var wait = function (mils) {
    var now = new Date;
    while (new Date - now <= mils);
};
//获取数据
function get(url, next) {
    Geter.log.requestCount++;

    getProxy(function (ip) {
        request.get(url)
          //设置代理
          .proxy(ip)
          //添加请求头
          // .set('Cookie',getCK())
          //  .set('User-Agent',getUA())
          .set('Referer','https://pan.baidu.com/share/home')
          .end(function (err, res) {

              if (err) {
                  Geter.log.errCount++;
                  Geter.onError(err, url, next);
              } else {

                  Geter.log.okCount++;
                  //ip 限制
                  if (res.body.errno == '-55') {
                      Geter.log.iplimitCount++;
                      Geter.onError({message:'ip限制'}, url, next);
                  } else {

                      wait(300);
                      next(res.body);
                  }
              }

          });
    })

}

//代理服务
var proxyList=[];
var proxyServerUrl="http://www.kuaidaili.com/api/getproxy?orderid=951932241274978&num=50&protocol=HTTP&method=2&browser=1&sort=1&sep=2&format=json"
var ipUseNumber=10;//每个IP使用次数

function getProxy(cb){
    //ip池没有ip 请求第三方代理服务获取IP
    if(proxyList.length<1){
        request.get(proxyServerUrl).end(function(err,res){

            if(res.body.data.count>0)
            {
                //更新IP池
                proxyList=res.body.data.proxy_list;
                cb(getIp());
            }
            else
            {
                console.log("代理服务更新IP错误,准备使用本地请求");
                cb("127.0.0.1:80");
            }
        });
    }
    cb(getIp())
}

var preIp='';//最后一次使用IP
function getIp(isUseNewIP){
    //是否使用新IP
    if(isUseNewIP||!preIp)
        preIp=proxyList.splice(0,1)[0];

    return preIp;
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

exports = module.exports = Geter;
