
//async.parallel(tasks,function(err,res){
//  if(err)
//  {
//
//  }
//  else
//  {
//
//
//    console.log(res+':'+x);
//
//  }
//});
// var c=0;
// async.mapLimit(tasks, 1, function (url, callback) {
//   fetchUrl(url, callback);
// }, function (err, result) {
//   console.log("count:"+result);
// });
//
// function fetchUrl(url,cb){
//   setTimeout(function(){
//     console.log('执行目标:'+url);
//     cb(null,c++);
//   },1000);
// }


var  index=0;
var us=[3,2,4];
var test=async ()=>{
    // us.forEach(async function(i){
    //     var a=await ajax(i);
    //     console.log(a);
    // })
    //
    // for(var x=0;x<us.length;x++)
    // {
    //     var a=await ajax(us[x]);
    //     console.log(a);
    // }
    let url='https://pan.baidu.com/pcloud/feed/getsharelist?t=1445847228683&category=0&auth_type=1&request_location=share_home&start=0&limit=60&query_uk=123&channel=chunlei&clienttype=0&web=1&bdstoken=2eacc9670635a8b59bb3e770b3442819'
    let querystr=url.split('?')[1];
    let ps=querystr.split('&');
    let uid='';
    ps.forEach(function(p){
        let pname=p.split('=')[0];
        let pvalue=p.split('=')[1];
        if(pname=='query_uk')
            uid=pvalue;
    })
    console.log(uid);
}

function ajax(i){
  return new Promise(function(resolve, reject){

      setTimeout(function(){
          console.log('ajax loaded...'+i);
          if(i>2) {
              resolve(i);
          }
          else
          {
              reject(i);
          }
      },1000*i);

  });

}

test();