$(document).ready(function () {
  var socket = io.connect();
  var delivery = new Delivery(socket);
  var from = $.cookie('user');//从 cookie 中读取用户名，存于变量 from
  var to = 'all';//设置默认接收对象为"所有人"
  //发送用户上线信号
  socket.emit('online', {user: from});
  socket.on('online', function (data) {
    //显示系统消息
    if (data.user != from) {
      var sys = '<div style="color:#d76133">系统(' + now() + '):' + '用户 ' + data.user + ' 上线了！</div>';
    } else {
      var sys = '<div style="color:#d76133">系统(' + now() + '):欢迎进入聊天室！</div>';
    }
    $("#contents").append(sys + "<br/>");
    $('#contents').scrollTop($('#contents').prop('scrollHeight'));
    //刷新用户在线列表
    flushUsers(data.users);
    //显示正在对谁说话
    showSayTo();

  });
  socket.on('say', function (data) {
    console.log(data);
    //对所有人说
    if (data.to == 'all') {
      if(data.from==to)
        data.from="我";
      $("#contents").append('<div class="msg toall">' + data.from + '(' + now() + ')对 所有人 说：<br/>' + data.msg + '</div><br/>');
      $('#contents').scrollTop($('#contents').prop('scrollHeight'));
    }
    //对你密语
    if (data.to == from) {
      $("#contents").append('<div class="msg toone">' + data.from + '(' + now() + ')对 你 说：<br/>' + data.msg + '</div><br />');
      $('#contents').scrollTop($('#contents').prop('scrollHeight'));
    }
  });
  socket.on('offline', function (data) {
    //显示系统消息
    var sys = '<div style="color:#d76133">系统(' + now() + '):' + '用户 ' + data.user + ' 下线了！</div>';
    $("#contents").append(sys + "<br/>");
    $('#contents').scrollTop($('#contents').prop('scrollHeight'));
    //刷新用户在线列表
    flushUsers(data.users);
    //如果正对某人聊天，该人却下线了
    if (data.user == to) {
      to = "all";
    }
    //显示正在对谁说话
    showSayTo();
  });
  //服务器关闭
  socket.on('disconnect', function () {
    var sys = '<div style="color:#d76133">系统:连接服务器失败！</div>';
    $("#contents").append(sys + "<br/>");
    $("#list").empty();
    $('#contents').scrollTop($('#contents').prop('scrollHeight'));
  });

  //重新启动服务器
  socket.on('reconnect', function () {
    var sys = '<div style="color:#d76133">系统:重新连接服务器！</div>';
    $("#contents").append(sys + "<br/>");
    $('#contents').scrollTop($('#contents').prop('scrollHeight'));
    socket.emit('online', {user: from});
  });
  //接受文件
  socket.on('receive',function(data){
    console.log(data);
    if(data.from==from)
    {data.from="我";}
    else if(data.to==from)
    {data.to="你"}
    $("#contents").append('<div class="msg">'+ data.from +' 向 '+data.to+' 发送文件'+ '(' + now() + ')'+' ：</div>');
    $("#contents").append("<a class='file' onclick='window.open("+'"'+data.url+'"'+")'>"+data.name+"</a><br><br>");
    $('#contents').scrollTop($('#contents').prop('scrollHeight'));
    //<a onclick="window.open('http://localhost:3000/files/SampleQuestions.pdf')">a</a>
  });

  //刷新用户在线列表
  function flushUsers(users) {
    //清空之前用户列表，添加 "所有人" 选项并默认为灰色选中效果
    $("#list").empty().append('<li title="双击聊天" alt="all" class="sayingto" onselectstart="return false">所有人</li>');
    //遍历生成用户在线列表
    for (var i in users) {
      $("#list").append('<li alt="' + users[i] + '" title="双击聊天" onselectstart="return false">' + users[i] + '</li>');
    }
    //双击对某人聊天
    $("#list > li").dblclick(function () {
      //如果不是双击的自己的名字
      if ($(this).attr('alt') != from) {
        //设置被双击的用户为说话对象
        to = $(this).attr('alt');
        //清除之前的选中效果
        $("#list > li").removeClass('sayingto');
        //给被双击的用户添加选中效果
        $(this).addClass('sayingto');
        //刷新正在对谁说话
        showSayTo();
      }
    });
  }

  //显示正在对谁说话
  function showSayTo() {
    $("#from").html(from);
    $("#to").html(to == "all" ? "所有人" : to);
  }

  //获取当前时间
  function now() {
    var date = new Date();
    var time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes()) + ":" + (date.getSeconds() < 10 ? ('0' + date.getSeconds()) : date.getSeconds());
    return time;
  }


  //发话
  function sendMsg(){
      var file = $("input[type=file]")[0].files[0];
      if(file)
      {
        if(to=='all')
          alert('请选择发送对象');
        else{
          var extraParams = {from: from, to: to};
          delivery.send(file,extraParams);
          $("form").find("input[type=file]").val("");
        }
      }

    //获取要发送的信息
    var $msg = $("#input_content").html();
    if ($msg == "") return;
    //把发送的信息先添加到自己的浏览器 DOM 中
    if (to == "all") {
      $("#contents").append('<div class="msg from">我(' + now() + ')：<br/>' + $msg + '</div><br/>');
    } else {
      $("#contents").append('<div class="msg from">' + '我' + '(' + now() + ')对 '+ to +' 说：<br/>' + $msg + '</div><br />');
    }
    $('#contents').scrollTop($('#contents').prop('scrollHeight'));
    //发送发话信息
    socket.emit('say', {from: from, to: to, msg: $msg});
    //清空输入框并获得焦点
    $("#input_content").html("").focus();
  }
  $("#say").click(function () {
    sendMsg();
  });
  document.getElementById("input_content").addEventListener("keydown", function(e) {
    // Enter is pressed
    if (e.keyCode == 13) { sendMsg(); }
  }, false);

  //

//  delivery.on('delivery.connect',function(delivery){
//    $("input[type=submit]").click(function(evt){
//      if(to=='all')
//        alert('请选择发送对象');
//      else{
//        var file = $("input[type=file]")[0].files[0];
//        console.log(file);
//        var extraParams = {from: from, to: to};
//        console.log(delivery)
//        delivery.send(file,extraParams);
//        evt.preventDefault();
//      }
//    });
//  });
//  delivery.on('send.success',function(fileUID){
//    console.log("file was successfully sent.");
//  });

  //
//  delivery.on('receive.success',function(data){
//    if (data.to == from) {
//      console.log(data);
//    }
//  });



});
$(window).keydown(function (e) {
  if (e.keyCode == 116) {
    if (!confirm("刷新将会清除所有聊天记录，确定要刷新么？")) {
      e.preventDefault();
    }
  }
});


