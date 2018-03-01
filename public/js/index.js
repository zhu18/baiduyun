

var q;

$(function() {


    q=new Query('/new/');
    $('#btn').click(function() {
        var key = $.trim($('#txt').val());
        var url=key.length == 0?'/new/':'/find/' + keyCheck(key) + '/';

        q=new Query(url);
    });
    $('.content').on('click','.btn',function(){
        if(this.id==='pre')
        {
            q.pre();
        }
        else if(this.id==='next')
        {
            q.next();
        }
    });
    $(document).on('keydown',function(e){
        var e=event||e;
        if(e.keyCode=='13')
        {
            $('#btn').click();
        }
    });

    if(!IsPC())
        return;

    getHotMovie(function(data){
        var html="<h3 class='h4' >最热电影 <a class='more' target='_blank' href='https://movie.douban.com/'>更多</a></h3>";
        html+="<div class='list'>";
        $(data).each(function(){
            html += "<a href='#' class='item' data-name='"+this.title+"'><div class='cover-wp'><img src='"+this.cover+"' /></div><p>"+this.title+" <strong>"+this.rate+"</strong></p></a>";
        })
        html+="</div>";
        $("#hot-movie").html(html);
    });
    getHotTv(function(data){
        var html="<h3 class='h4' >最热电视剧 <a class='more' target='_blank' href='https://movie.douban.com/tv/'>更多</a></h3>";
        html+="<div class='list'>";
        $(data).each(function(){
            html += "<a href='#' class='item' data-name='"+this.title+"'><div class='cover-wp'><img src='"+this.cover+"' /></div><p>"+this.title+" <strong>"+this.rate+"</strong></p></a>";
        })
        html+="</div>";
        $("#hot-tv").html(html);
    });
    $(".right-panel").on('click','.item',function(){
        $('#txt').val($(this).data('name'));
        $('#btn').click();
    })
})

function keyCheck(key){
    key=key.replace(/\s/g,'.*');
    key=encodeURIComponent(key)
    return key;
}


//得到热门电影
function getHotMovie(next){
    var count=10;
    $.get('/hot/movie/'+count,function(res){
        next(res.subjects);
    })
}
//得到热门电视剧
function getHotTv(next){
    var count=10;
    $.get('/hot/tv/'+count,function(res){
        next(res.subjects);
    })
}


function getFileExt(fileName){
    var ext=/\.[^.]+$/.exec(fileName);
    if(ext)
        return ext[0];
    else
        return '';
}
function getFileIconByFileExt(ext){
    var iconName='';
    ext=ext.toLowerCase();
    if(!/^[.a-z0-9]*$/.test(ext))
    {
        return 'fa-folder';
    }
    if(ext.length<1||ext.length>8)
        return 'fa-folder';

    switch(ext){
        case '.zip':
        case '.rar':
        case '.7z':
            iconName="fa-file-zip-o"
            break;
        case '.jpg':
        case '.jpeg':
        case '.bmp':
        case '.gif':
        case '.png':
            iconName="fa-file-image-o"
            break;
        case '.ape':
        case '.flac':
        case '.mp3':
        case '.wav':
        case '.wma':
        case '.m4a':
            iconName="fa-file-sound-o"
            break;
        case '.mkv':
        case '.flv':
        case '.rmvb':
        case '.mp4':
        case '.mov':
        case '.wmv':
        case '.rm':
        case '.avi':
        case '.mpeg':
            iconName="fa-file-video-o"
            break;
        case '.pdf':
            iconName="fa-file-pdf-o"
            break;
        case '.doc':
        case '.docx':
            iconName="fa-file-word-o"
            break;
        case '.xlsx':
        case '.xls':
            iconName="fa-file-excel-o"
            break;
        case '.pdf':
            iconName="fa-file-pdf-o"
            break;
        case '.txt':
            iconName="fa-file-text-o"
            break;

        default:
            iconName="fa-file-o"
            break;
    }
    return iconName;
}

function Query(url){
    this.url=url;
    this.pageIndex=0;
    this.pre=function(){
        --this.pageIndex;
        query(this.url+this.pageIndex);
    };
    this.next=function(){
        ++this.pageIndex;
        query(this.url+this.pageIndex);
    }
    query(this.url+this.pageIndex);
}


function query(url) {
    NProgress.start();
    var ps=url.split('/');
    var pageIndex=ps[ps.length-1];
    if(pageIndex<0){
        pageIndex=0;
        ps.splice(ps.length-1,(''+pageIndex).length,pageIndex);
        url=ps.join('/');
    }

    console.log(url);
    $('.content').toggleClass('loading');
    $.get(url, function(res) {
        var html = '<table class="table table-hover">';
        html += '<tr><th width=""  class="td-title hidden-xs">名称</th><th width="120px" class="hidden-xs">发布时间</th><th width="140px"  class="hidden-xs">发布人</th>';
        if(res.length<1)
        {
            html+="<tr><td colspan=3 class='nores'>没有查询到相关记录。</td></tr>";
        }
        $.each(res, function() {
            var url = '';
            if (this.shorturl && this.shorturl.length > 0)
                url = 'http://yun.baidu.com/s/' + this.shorturl;
            else
                url = 'http://yun.baidu.com/share/link?uk=' + this.uk + '&shareid=' + this.source_id;

            var iconClass=getFileIconByFileExt(getFileExt(this.title));
            var icon="<i class='fa "+iconClass+" icon'></i>";
            html += '<tr>' + '<td class="td-title"><a href="' + url + '" target="_blank" title="'+this.desc+'">'+icon + highlightKey(this.title) + '</a></td>' + '<td  class="hidden-xs">' + this.feed_time.split('T')[0] + '</td>' + '<td  class="hidden-xs" title="分享数：' + this.total_count + '\n描述：">' + this.username + '</td>' + '</tr>';

        });
        html += '</table>';
        var nextState=res.length>=15?'':'disabled="disabled"';
        var preState=pageIndex>0?'':'disabled="disabled"';
        html+="<div class='pager'><button id='pre' title='上一页' class='btn btn-primary' "+preState+">上一页</button>&nbsp;<button id='next' title='下一页' class='btn btn-primary' "+nextState+">下一页</button></div>";
        $('.content').toggleClass('loading');
        $('.content').html(html);

        NProgress.done();
    });
}

function highlightKey(str){
    var key=$.trim($('#txt').val());
    key=key.replace(/\^|\$|\[|\]|\*|\?|\{|\}|\/|\\/g,'').replace(/\s/g,',').split(',');
    var reg='';
    for(var i=0;i<key.length;i++)
    {
        if(key[i].length>0){
            reg=new RegExp("("+key[i]+")","igm");
            str=str.replace(reg,'<span class="highlinght">$1</span>');
        }
    }
    return str
}

function IsPC() {
    if($(window).width()<800)
        return false;
    var userAgentInfo = navigator.userAgent;
    var Agents = ["Android", "iPhone",
        "SymbianOS", "Windows Phone",
        "iPad", "iPod"];
    var flag = true;
    for (var v = 0; v < Agents.length; v++) {
        if (userAgentInfo.indexOf(Agents[v]) > 0) {
            flag = false;
            break;
        }
    }
    return flag;
}