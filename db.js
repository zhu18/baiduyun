var mongoose = require('mongoose');
var config = require('./config');


var db=mongoose.connect(config.mongodb_url);
//var db=mongoose.createConnection('mongodb://127.0.0.1:27017/baiduyun');
//db.on('connected', function(){
//    console.log('====================数据库连接 ok==================');
//    console.log(db);
//});
// 链接错误
//db.on('error',console.error.bind(console,'连接错误:'));
//db.once('open',function(){
//      console.log('================opened.....');
//    });

var Schema = mongoose.Schema;

var FileSchema = new Schema({
    uk:String,
    username:String, 
    intro:String,
    avatar_url:String,
    total_count:Number,   
    source_id:{type:String, index: { unique: true}},
    title:String,
    feed_time: {type: Date, default: Date.now},
    shorturl:String,
    desc:String,     
    create_at: { type: Date, default: Date.now },
    update_at: { type: Date, default: Date.now },
});

FileSchema.index({feed_time: -1});
var File = mongoose.model('File', FileSchema);

exports.File = File;
