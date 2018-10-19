var name = '', connectedUser;
 
var loginPage = document.querySelector('#login-page'),
	usernameInput = document.querySelector('#username'),
	loginButton = document.querySelector('#login'),
	callPage = document.querySelector('#call-page'),
	theirUsernameInput = document.querySelector('#their-username'),
	callButton = document.querySelector('#call'),
	hangUpButton = document.querySelector('#hang-up');
	callPage.style.display = 'none';
loginButton.addEventListener('click', function(){
	name = usernameInput.value;
	if(name.length>0){
		send({
			type: "login",
			name: name
		});
	}
});
 
 
var connection = new WebSocket('ws://'+document.domain+':7899');
connection.onopen = function(){
	console.log('已连接.');
};
connection.onmessage = function(message){
	console.log('message', message.data);
	var data = JSON.parse(message.data);
	switch(data.type){
		case 'login':
			onLogin(data.success);
			break;
		case 'offer':
			onOffer(data.offer, data.name);
			break;
		case 'answer':
			onAnswer(data.answer);
			break;
		case 'candidate':
			onCandidate(data.candidate);
			break;
		case 'leave':
			onLeave();
			break;
		default:
			break;
	}
};
connection.onerror = function(err){
	console.log("error", err);
};
 
function send(message){
	if(connectedUser){
		message.name = connectedUser;
	}
	connection.send(JSON.stringify(message));
}
 
 
function onLogin(success){
	if(success = false){
		alert('登录失败，换个账号试试');
	}else{
		loginPage.style.display = 'none';
		callPage.style.display = 'block';
		startConnection();
	}
}
 
callButton.addEventListener('click', function(){
	var theirUsername = theirUsernameInput.value;
	if(theirUsername.length>0){
		startPeerConnection(theirUsername);
	}
});
 
hangUpButton.addEventListener('click', function(){
	send({
		type: "leave"
	});
	onLeave();
});
 
function onOffer(offer, name){
	connectedUser = name;
	yourConnection.setRemoteDescription(new RTCSessionDescription(offer));
	yourConnection.createAnswer(function(_answer){
		yourConnection.setLocalDescription(_answer);
		send({
			type: 'answer',
			answer: _answer
		});
	}, function(err){
		console.log('呼叫发生错误.');
	});
}
 
function onAnswer(answer){
	yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
}
 
function onCandidate(candidate){
	yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
}
 
function onLeave(){
	connectedUser = null;
	theirConnection = null;
	yourConnection.close();
	yourConnection.onicecandidate = null;
	yourConnection.onaddstream = null;
	setupPeerConnection(stream);
}
 
function hasUserMedia(){
	return !!(
		navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia ||
		navigator.mediaDevices.getUserMedia || navigator.mozGetUserMedia
	);
}
 
function hasRTCPeerConnection(){
	window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
	window.RTCSessionDescription = window.RTCSessionDescription ||
		window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
	window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
	return !!window.RTCPeerConnection;
}
var yourVideo = document.querySelector('#yours'), 
	theirVideo = document.querySelector('#theirs'), 
	yourConnection, 
	theirConnection,
	stream;
function startConnection(){
	if(hasUserMedia()){
		navigator._getUserMedia = (
			navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia ||
			navigator.mozGetUserMedia || navigator.mediaDevices.getUserMedia
		);
		navigator._getUserMedia(
			{
				video: true,
				audio: false
			},
			function(myStream){
				stream = myStream;
				//yourVideo.src = window.URL.createObjectURL(stream);
				yourVideo.srcObject = stream;
				if(hasRTCPeerConnection()){
					setupPeerConnection(stream);
				}
				else{
					alert('浏览器不支持WebRTC.');
				}
			},
			function(error){
				console.log(error);
			}
		);
	}
}
 
function setupPeerConnection(stream){
	var configuration = {
        iceServers: [
        	{
			 urls: "stun:173.194.202.127:19302"
			}
		]
	};
	yourConnection = new RTCPeerConnection(configuration);
	yourConnection.addStream(stream);
	yourConnection.onaddstream = function(e){
		//theirVideo.src = window.URL.createObjectURL(e.stream);
		theirVideo.srcObject = e.stream;
	};
	yourConnection.onicecandidate = function(e){
		if(e.candidate){
			send({
				type: "candidate",
				candidate: e.candidate
			});
		}
	};


}
 
function startPeerConnection(user){
	connectedUser = user;
	yourConnection.createOffer(function(_offer){
		send({
			type: "offer",
			offer: _offer
		});
		yourConnection.setLocalDescription(_offer);
	}, function(error){
		alert('An error on startPeerConnection:', error);
	});
}
