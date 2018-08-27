var ws = null;

function findBattle() {
	var playerId = $("#playerIdMatchMakingInput").val().toString() || "";
	if (playerId.length > 0){
		connectByPlayerId(playerId);
	} else {
		connect();
	}
}

function connectByPlayerId(id) {
	
	$.ajax({method: "GET", async: "FALSE", url: "http://66.242.90.163:8171/api/player/arena/" + id}).done(function(result) {
		console.log(result);
		var arenaId = result;
		ws = new WebSocket('ws://66.242.90.163:8171/arena/' + arenaId);

		console.log("Connected to Friend!");
		console.log(ws);
		handleMessage();
		setTimeout(sendMatchMakingMessage, 5000);
	});
}

function connectByArenaId(id) {
	ws = new WebSocket('ws://66.242.90.163:8171/arena/' + id);
	$("#arenaId").append(id);
	console.log("Connected to Friend!");
	console.log(ws);
	handleMessage();
	setTimeout(sendMatchMakingMessage, 2500);
}

function connect() {
	var arid = $("#arenaId").text();
	var aid = arid.substring(arid.length - 7, arid.length);
	ws = new WebSocket('ws://66.242.90.163:8171/arena/' + aid);
	console.log("Connected");
	console.log(ws);
	handleMessage();
	setTimeout(sendMatchMakingMessage, 2500);
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
	var disp = $("#displayNameInput").val().toString() || "NPC";
	var aurl = $("#avatarUrlInput").val().toString() || "defaultImageUrl";
	var arid = $("#arenaId").text();
	var aid = arid.substring(arid.length - 7, arid.length);
	console.log(aid);
	var req = {
			"displayName": disp,
			"avatarUrl": aurl,
			"currentArena": aid
	};
	$.ajax({method: "POST", url: "http://66.242.90.163:8171/api/player/", data: req}).done(function(result) {
		afterLogin(result);
	});
}

const handlePortraits = (...arguments) => {
	const frames = document.getElementsByClassName("ally");
	const backgrounds = {
		"0": "https://i.imgur.com/qh2cjpd.jpg",
		"1": "https://i.imgur.com/yvQeY2q.png",
		"2": "https://i.imgur.com/YCBrPWg.png",
		"3": "https://i.imgur.com/uPWgaVl.jpg",
		"4": "https://i.imgur.com/y2pJyrY.jpg"
	};
	for (let i = 0; i < frames.length; i++){
		const portrait = document.createElement("img");
		portrait.setAttribute("src", backgrounds[arguments[i]]);
		portrait.style.maxHeight = "100%";
		portrait.style.maxWidth = "100%";
		frames[i].removeChild(frames[i].childNodes[1]);
		frames[i].appendChild(portrait);
	}
}

function afterLogin(result) {
	$("#playerId").append(result.id);
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
	const chars = [...document.getElementsByClassName("chars")].map(x => x.value);
	var playerId = $("#playerId").text().substring($("#playerId").text().length - 8, $("#playerId").text().length);
	console.log(playerId);
	console.log(chars);
	var msg = {
		type: "MATCH_MAKING",
		char1: chars[0],
		char2: chars[1],
		char3: chars[2],
		playerId: playerId,
		opponentId: $("#playerIdMatchMakingInput").val().toString()
	};
	handlePortraits(msg.char1, msg.char2, msg.char3);
	console.log(msg);
	ws.send(JSON.stringify(msg));
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

// ------ EVENT LISTENERS

const handleEventListeners = {
	preventMultipleSelection: (() => {
		const selectors = Array.from(...document.getElementsByClassName("chars")); // Create array of character select elements.
		selectors.forEach((x, y) => {
			x.addEventListener("change", () => {  // Add event listener to each element using forEach.
				const currentChars = selectors.map(x => x.value);  // Create array of currently selected character values.
				for (let i = 0; i < selectors.length; i++){ // Iterate through char select elements to change currently selected to disabled.
				const characterOptions = selectors[i].children;
					if (i !== y){ // Only perform these changes on elements that did not trigger the event listener with change.
						Array.from(characterOptions, (x) => { 
							if (!currentChars.some(z => z === x.value)) // Remove disabled attribute if character is not currently selected by other element.
								x.removeAttribute("disabled");
						});
						const currentSelection = characterOptions[x.value]; 
						currentSelection.disabled = "true"; // Add disabled attribute for character option change that triggered event listener.
					}
				}
			});
		});
	})()
}

$(document).ready(function(){
    if (ws != null) {
    	disconnect();
    }
    
	var rand = Math.random().toString().substring(3, 9);
	$("#arenaId").append(rand);
    
    $("select option").click(function() {
        if ($("select option:selected").length > 3) {
            $(this).removeAttr("selected");
            alert('You can select up to 3 characters only');
        }
    });
});