var WebSocketServer = require('ws').Server,
	wss = new WebSocketServer({port: 7899}),
	express = require('express'),
    app = express(),
	users = {};
 
app.use(express.static('./'));
app.get('/', function (req, res) {
  res.sendFile('./index.html')
});
app.listen(8128, function () {
  console.log('监听端口 8128!')
});
 
function sendTo(conn, message){
	conn.send(JSON.stringify(message));
}
 
wss.on('connection', function(connection){
	connection.on('message', function(message){
		var data;
		try{
			data = JSON.parse(message);
		}
		catch(e){
			console.log('解析错误.');
			data = {};
		}
		switch(data.type){
			case 'login':
				console.log('用户登录', data.name);
				if(users[data.name]){
					sendTo(connection,{
						type: "login",
						success: false
					});
				}else{
					users[data.name] = connection;
					connection.name = data.name;
					sendTo(connection,{
						type: "login",
						success: true
					});
				}
				break;
			case 'offer':
				console.log('发送请求', data.name);
				var conn = users[data.name];
				if(conn != null){
					connection.otherName = data.name;
					sendTo(conn, {
						type: "offer",
						offer: data.offer,
						name: connection.name
					});
				}
				break;
			case 'answer':
				console.log('应答请求', data.name);
				var conn = users[data.name];
				if(conn != null){
					connection.otherName = data.name;
					sendTo(conn, {
						type: "answer",
						answer: data.answer
					});
				}
				break;
			case 'candidate':
				console.log('发送 candidate to', data.name);
				var conn = users[data.name];
				if(conn != null){
					connection.otherName = data.name;
					sendTo(conn, {
						type: "candidate",
						candidate: data.candidate
					});
				}
				break;
			case 'leave':
				console.log('Disconnecting user from', data.name);
				var conn = users[data.name];
				if(conn != null){
					connection.otherName = data.name;
					sendTo(conn, {
						type: "leave"
					});
				}
				break;
			default:
				sendTo(conn, {
					type: "error",
					message: "Unrecognized command: " + data.type
				});
				break;
		}
	});
	connection.on('close', function(){
		if(connection.name){
			delete users[connection.name];
			if(connection.otherName){
				console.log('Disconnecting user from', connection.otherName);
				var conn = users[connection.otherName];
				conn.otherName = null;
				if(conn != null){
					sendTo(conn,{
						type: "leave"
					});
				}
			}
		}
	});
});
wss.on('listening', function(){
	console.log('服务开启...');
});
