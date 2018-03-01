var config={
    // 系统环境
    mongodb_url:process.env.MONGOHQ_URL || 'mongodb://localhost/baiduyun',
    //后台登录
    userName:'zhu18',
    password:'zhu181234',
    // 爬虫相关
    //起始用户ID
    beginUserID:'2140115460',//2140115460
    //代理IP
    proxy:'http://192.168.11.22:80'
    
}

exports = module.exports = config;