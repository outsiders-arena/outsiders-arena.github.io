var ws = null;

function findBattleByArenaId() {
	disconnect();
	var id = $("#arenaIdInput").val().toString();
	console.log(id);
	connectByArenaId(id);
}

function connectByArenaId(id) {
	ws = new WebSocket('ws://66.242.90.163:8171/arena/' + id);
	$("#arenaId").append(id);
	console.log("Connected to Friend!");
	console.log(ws);
	ws.onmessage = function(data){
		showGreeting(data.data);
	}
}

function connect() {
	var rand = Math.random().toString().substring(2, 9);
	ws = new WebSocket('ws://66.242.90.163:8171/arena/' + rand);
	$("#arenaId").append(rand);
	console.log("Connected");
	console.log(ws);
	ws.onmessage = function(data){
		showGreeting(data.data);
	}
}

function disconnect() {
    ws.close();
    ws = null;
    console.log("Disconnected");
}

function sendMove() {
    ws.send(
		JSON.stringify({
			name: $("#move").val()
		})
    );
}

function showGreeting(message) {
    $("#arenaOutput").append(" " + message + "");
}


$(document).ready(function(){
    if (ws != null) {
    	disconnect();
    }
    connect();

    $(document).keydown(function(event){
        if (event.keyCode === 13){document.getElementById('sendMove').click()}
    });

});