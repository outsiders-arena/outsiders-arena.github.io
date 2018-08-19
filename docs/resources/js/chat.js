var ws = null;

function connect() {
	ws = new WebSocket('ws://66.242.90.163:8171/chat');
	ws.onmessage = function(data){
		console.log(data);
		showGreeting(data.data);
	}
	console.log("Connected");
	console.log(ws);
}

function disconnect() {
    ws.close();
    ws = null;
    setConnected(false);
    console.log("Disconnected");
}

function sendName() {
    ws.send(
		JSON.stringify({
			name: $("#name").val()
		})
    );
}

function showGreeting(message) {
    $("#greetings").append(" " + message + "");
}


$(document).ready(function(){
    if (ws != null) {
    	disconnect();
    }
    connect();

    $('#name').keydown(function(event){
        if (event.keyCode === 13){document.getElementById('send').click()}
    });

});