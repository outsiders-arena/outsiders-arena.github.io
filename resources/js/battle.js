var ws = null;

function findBattle() {
	var id = $("#arenaIdInput").val().toString();
	if (id.length > 0) {
		connectByArenaId(id);
	} else {
		connect();
	}
}

function connectByPlayerId() {
	
}

function connectByArenaId(id) {
	var playerId = Math.random().toString().substring(2, 10);
	ws = new WebSocket('ws://66.242.90.163:8171/arena/' + id);
	$("#arenaId").append(id);
	console.log("Connected to Friend!");
	console.log(ws);
	handleMessage();
	setTimeout(sendMatchMakingMessage, 5000);
}

function connect() {
	var arid = $("#arenaId").text();
	var aid = arid.substring(arid.length - 7, arid.length);
	ws = new WebSocket('ws://66.242.90.163:8171/arena/' + aid);
	console.log("Connected");
	console.log(ws);
	handleMessage();
	setTimeout(sendMatchMakingMessage, 5000);
}

function disconnect() {
    ws.close();
    ws = null;
    console.log("Disconnected");
}

// ------ HANDLE MESSAGES

function handleMessage() {
	ws.onmessage = function(data){
		console.log(data);
		var msg = JSON.parse(data.data);
		var mtp = msg.type;
		if (mtp === "INIT") {
			handleInit(msg);
		} else if (mtp === "ETRADE") {
			handleEnergyTrade(msg);
		} else if (mtp === "UPDATE") {
			handleTurnUpdate(msg);
		} else if (mtp === "CCHECK") {
			handleCostCheck(msg);
		} else if (mtp === "TCHECK") {
			handleTargetCheck(msg);
		} else if (mtp === "END") {
			handleTurnEnd(msg);
		}
	}
}

function sendConnectRequest() {
	var disp = $("#displayNameInput").val().toString();
	var pid = $("#playerIdInput").val();
	var aurl = $("#avatarUrlInput").val().toString();
	var arid = $("#arenaId").text();
	var aid = arid.substring(arid.length - 7, arid.length);
	var req = {
			"displayName": disp,
			"playerId": pid,
			"avatarUrl": aurl,
			"currentArena": aid
	};
	$.ajax({method: "POST", url: "http://66.242.90.163:8171/api/player/", data: req}).done(function(result) {
		afterLogin(result);
	});
}

function afterLogin(result) {
	console.log(result);
}

function handleInit(msg) {
	console.log(msg);
	
	// HOOO OOOOOOO OOOO BOYYY 
}

function handleEnergyTrade(msg) {
	console.log(msg);
}

function handleTurnUpdate(msg) {
	console.log(msg);
}

function handleCostCheck(msg) {
	console.log(msg);
}

function handleTargetCheck(msg) {
	console.log(msg);
}

function handleTurnEnd(msg) {
	console.log(msg);
}

// ------ SEND MESSAGES

function sendMatchMakingMessage() {
	var chars = $("#chars").val()
	console.log(chars);
	var msg = JSON.stringify({
		type: "MATCH_MAKING",
		char1: chars[0],
		char2: chars[1],
		char3: chars[2],
		playerId: $("#playerIdInput").val().toString(),
		opponentId: $("#playerIdMatchMakingInput").val().toString(),
		arenaId: $("#arenaIdInput").val().toString()
	});
	console.log(msg);
	ws.send(msg);
}

function sendTurnEnd() {
    ws.send(
		JSON.stringify({
			type: "TURN_END",
			move1: $("#move1").val(),
			move2: $("#move2").val(),
			move3: $("#move3").val(),
			target1: $("#target1").val(),
			target2: $("#target2").val(),
			target3: $("#target3").val()
		})
    );
}

function sendEnergyTrade() {
    ws.send(
		JSON.stringify({
			type: "ENERGY_TRADE",
			arcanaIn: $("#arcana").val(),
			divinityIn: $("#divinity").val(),
			dexterityIn: $("#dexterity").val(),
			strengthIn: $("#strength").val()
		})
    );
}


$(document).ready(function(){
    if (ws != null) {
    	disconnect();
    }
    
	var rand = Math.random().toString().substring(2, 9);
	$("#arenaId").append(rand);
    
    $("select option").click(function() {
        if ($("select option:selected").length > 3) {
            $(this).removeAttr("selected");
            alert('You can select up to 3 characters only');
        }
    });
});