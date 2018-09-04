"use strict";
const PROD_URL = "";
const STAGE_URL = "66.242.90.163:8171";
const DEV_URL = "localhost:8817";
const URL = DEV_URL;

var ws = null;

function findBattle() {
	var opponentName = $("#playerNameMatchMakingInput").val() || "";
	connectByPlayerName(opponentName);
}

function connectByPlayerName(name) {
	var playerId = $("#playerId").text().substring($("#playerId").text().length - 8, $("#playerId").text().length);
	console.log(playerId);
	$.ajax({method: "GET", url: "http://"+ URL +"/api/player/arena/ " + playerId + "/" + name}).done(function(result) {
		console.log(result);
		var arenaId = result;
		connectByArenaId(arenaId);
	});
}

function connectByArenaId(id) {
	ws = new WebSocket('ws://'+ URL +'/arena/' + id);
	$("#arenaId").append(id);
	console.log("Connected to Friend!");
	console.log(ws);
	handleMessage();
	setTimeout(sendMatchMakingMessage, 1000);
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
	var req = {
			"displayName": disp,
			"avatarUrl": aurl
	};
	$.ajax({method: "POST", url: "http://"+ URL +"/api/player/", data: req}).done(function(result) {
		afterLogin(result);
	});
}

const handlePortraits = (...args) => {
	const frames = document.getElementsByClassName("ally");
	const backgrounds = new Map([
	[0, "https://i.imgur.com/qh2cjpd.jpg"], 
	[1, "https://i.imgur.com/yvQeY2q.png"],
	[2, "https://i.imgur.com/YCBrPWg.png"],
	[3, "https://i.imgur.com/uPWgaVl.jpg"],
	[4, "https://i.imgur.com/y2pJyrY.jpg"]
	]);
	for (let i = 0; i < frames.length; i++){
		const portrait = document.createElement("img");
		portrait.setAttribute("src", backgrounds.get(args[i]));
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
	const chars = [...document.getElementsByClassName("chars")].map(x => Number(x.value));
	var playerId = $("#playerId").text().substring($("#playerId").text().length - 8, $("#playerId").text().length);
	console.log("PlayerID: " + playerId);
	console.log("Chars: " + chars);
	var arenaId = $("#arenaId").text().substring($("#arenaId").text().length - 8, $("#arenaId").text().length);
	console.log("ArenaID: " + arenaId);
	var msg = JSON.stringify({
		type: "MATCH_MAKING",
		char1: chars[0],
		char2: chars[1],
		char3: chars[2],
		playerId: playerId,
		arenaId: arenaId,
		opponentName: $("#playerNameMatchMakingInput").val().toString()
	});
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
		const selectors = Array.from(document.getElementsByClassName("chars")); // Create array of character select elements.
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
    
    $("select option").click(function() {
        if ($("select option:selected").length > 3) {
            $(this).removeAttr("selected");
            alert('You can select up to 3 characters only');
        }
    });
});