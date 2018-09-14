"use strict";
const PROD_URL = "";
const STAGE_URL = "66.242.90.163:8171";
const DEV_URL = "localhost:8817";
const DEV_ROREN_URL = "localhost:8171";
const URL = DEV_URL;

var ws = null;

function findBattle() {
	var val = $("#playerNameMatchMakingInput").val();
	if (val) {
		connectByPlayerName(val);
	} else {
		alert("You must enter an opponent's display name.")
	}
}

// find the player you'd like to play with, and get their arenaID, or find no player and get your own (and enter matchmaking)
function connectByPlayerName(name) {
	var playerId = truncateId("#playerId");
	console.log(playerId);
	$.ajax({method: "GET", url: "http://"+ URL +"/api/player/arena/ " + playerId + "/" + name}).done(function(result) {
		console.log(result);
		var arenaId = result;
		connectByArenaId(arenaId);
	});
}

// simply connect to one "arena", aka one websocket using ArenaID
function connectByArenaId(id) {
	ws = new WebSocket('ws://'+ URL +'/arena/' + id);
    $("#arenaId").html("");
	$("#arenaId").append(id);
	console.log("Connected to Friend!");
	console.log(ws);
	handleMessage();
	setTimeout(sendMatchMakingMessage, 1000);
}

// close and null out web socket
function disconnect() {
    ws.close();
    ws = null;
    console.log("Disconnected");
}

// Login OR Create User if does not exist.
// TODO: make this a real login
function sendConnectRequest() {
	var disp = $("#displayNameInput").val().toString() || "NPC";
	var aurl = $("#avatarUrlInput").val().toString() || "https://i.imgur.com/sdOs51i.jpg";
	handleUserInfo(disp, aurl);
	var req = {
			"displayName": disp,
			"avatarUrl": aurl
	};
	$.ajax({method: "POST", url: "http://"+ URL +"/api/player/", data: req}).done(function(result) {
		afterLogin(result);
	});
}

// display playerID (probably not needed, but if we lose it we gotta store playerID as a global variable)
function afterLogin(result) {
    $("#playerId").html("");
	$("#playerId").append(result.id);
	console.log(result);
}

// (this is a send message but it made more sense to put it above)
function sendMatchMakingMessage() {
	const chars = Array.from(document.getElementsByClassName("chars"), (x) => x.value); // Indiv. character select.
	var playerId = truncateId("#playerId");
	var arenaId = truncateId("#arenaId");
	console.log("PlayerID: " + playerId);
	console.log("Chars: " + chars);
	console.log("ArenaID: " + arenaId);
	var msg = {
		type: "MATCH_MAKING",
		char1: chars[0],
		char2: chars[1],
		char3: chars[2],
		playerId: playerId,
		arenaId: arenaId,
		opponentName: $("#playerNameMatchMakingInput").val().toString()
	};
	console.log(msg);
	ws.send(JSON.stringify(msg));
}


// ------ HANDLE MESSAGES
// this method gets called once WS is created to initiate the message routing logic
function handleMessage() {
	ws.onmessage = function(data){
		console.log(data);
		var msg = JSON.parse(data.data);
		var mtp = msg.type;
		if (mtp === "INIT") {
			handleInit(msg);
		} else if (mtp === "ETRADE") {
			handleEnergyTrade(msg);
		} else if (mtp === "CCHECK") {
			handleCostCheck(msg);
		} else if (mtp === "TCHECK") {
			handleTargetCheck(msg);
		} else if (mtp === "END") {
			handleTurnEnd(msg);
		}
	}
}

const handlePortraits = (allies, enemies) => {
	const allyFrames = document.getElementsByClassName("ally");
	const enemyFrames = document.getElementsByClassName("enemy");
	const charIds = [];
	const backgrounds = new Map([
	[0, "https://i.imgur.com/qh2cjpd.jpg"], 
	[1, "https://i.imgur.com/yvQeY2q.png"],
	[2, "https://i.imgur.com/YCBrPWg.png"],
	[3, "https://i.imgur.com/uPWgaVl.jpg"],
	[4, "https://i.imgur.com/y2pJyrY.jpg"]
	]);
	for (let i = 0; i < allyFrames.length; i++){
		const allyPortrait = document.createElement("img");
		const enemyPortrait = document.createElement("img");
		allyPortrait.setAttribute("src", backgrounds.get(allies[i].characterId));
		allyPortrait.style.maxHeight = "100%";
		allyPortrait.style.maxWidth = "100%";
		allyFrames[i].removeChild(allyFrames[i].childNodes[1]);
		enemyPortrait.setAttribute("src", backgrounds.get(enemies[i].characterId));
		enemyPortrait.style.maxHeight = "100%";
		enemyPortrait.style.maxWidth = "100%";
		allyFrames[i].appendChild(allyPortrait);
		enemyFrames[i].appendChild(enemyPortrait);
		charIds.push(allies[i].characterId);
	}
	handleAbilities(...charIds);
}

const handleAbilities = (...allies) => {
	const abilityFrames = document.getElementsByClassName("ally-ability");
	const abilityImages = new Map([
		[0, ["./resources/img/alex-ability-1.png", "./resources/img/alex-ability-2.png", 
			"./resources/img/alex-ability-3.png", "./resources/img/alex-ability-4.png"]],
		[1, ["./resources/img/fainne-ability-1.png", "./resources/img/fainne-ability-2.png", 
		"./resources/img/fainne-ability-3.png", "./resources/img/fainne-ability-4.png"]],
		[2, ["./resources/img/geddy-ability-1.png", "./resources/img/geddy-ability-2.png", 
		"./resources/img/geddy-ability-3.png", "./resources/img/geddy-ability-4.png"]],
		[3, ["./resources/img/holly-ability-1.png", "./resources/img/holly-ability-2.png", 
		"./resources/img/holly-ability-3.png", "./resources/img/holly-ability-4.png"]],
		[4, ["./resources/img/shinzo-ability-1.png", "./resources/img/shinzo-ability-2.png", 
		"./resources/img/shinzo-ability-3.png", "./resources/img/shinzo-ability-4.png"]]	
	]);
	const abilityArray = [...abilityImages.get(allies[0]), ...abilityImages.get(allies[1]), ...abilityImages.get(allies[2])];
	for (let i = 0; i < abilityFrames.length; i++){
		const ability = document.createElement("img");
		ability.src = abilityArray[i];
		ability.style.width = "100%";
		ability.style.height = "100%";
		abilityFrames[i].appendChild(ability);
	}
}

const handleUserInfo = (name, avatar) => {
	const infoDiv = document.getElementsByClassName("playerBasicInfo")[0];
	for (let i = 0; i < infoDiv.children.length; i++){
		infoDiv.children[i].style.position = "absolute";
		infoDiv.children[i].style.right = "5000px";
	}
	const username = document.createElement("h2");
	username.textContent = name;
	const avatarFrame = document.createElement("img");
	avatarFrame.style.height = "5rem";
	avatarFrame.style.width = "5rem";
	avatarFrame.style.marginRight = "10px";
	avatarFrame.src = avatar;
	infoDiv.style.display = "flex";
	infoDiv.style.alignItems = "center";
	infoDiv.appendChild(avatarFrame);
	infoDiv.appendChild(username);
}

const handleEnergy = (energy) => {
	const battleLogin = document.getElementsByClassName("playerBattleInfo")[0];
	const strengthDiv = document.createElement("div");
	const dexterityDiv = document.createElement("div");
	const arcanaDiv = document.createElement("div");
	const divinityDiv = document.createElement("div");
	strengthDiv.id = "strength";
	dexterityDiv.id = "dexterity";
	arcanaDiv.id = "arcana";
	divinityDiv.id = "divinity";
	const energyTotal = {
		STRENGTH: 0,
		DEXTERITY: 0,
		ARCANA: 0,
		DIVINITY: 0
	};
	for (let i = 0; i < battleLogin.children.length; i++){
		battleLogin.children[i].style.position = "absolute";
		battleLogin.children[i].style.right = "5000px";
	}
	battleLogin.style.flexDirection = "column";
	battleLogin.appendChild(strengthDiv);
	battleLogin.appendChild(dexterityDiv);
	battleLogin.appendChild(arcanaDiv);
	battleLogin.appendChild(divinityDiv);
	for (let entry of energy){
		energyTotal[entry]++;
	}
	for (let key in energyTotal){
		const energyName = document.createElement("span");
		energyName.textContent = `${key}:`;
		energyName.style.marginRight = "10px";
		document.getElementById(key.toLowerCase()).appendChild(energyName);
		for (let i = 0; i < energyTotal[key]; i++){
			const energyBubble = document.createElement("div");
			energyBubble.style.height = "10px";
			energyBubble.style.width = "10px";
			energyBubble.style.borderRadius = "10px";
			energyBubble.style.border = "1px solid black";
			energyBubble.style.marginRight = "5px";
			if (key === "STRENGTH") energyBubble.style.backgroundColor = "red";
			else if (key === "DEXTERITY") energyBubble.style.backgroundColor = "green";
			else if (key === "ARCANA") energyBubble.style.backgroundColor = "dodgerblue";
			else if (key === "DIVINITY") energyBubble.style.backgroundColor = "yellow";
			document.getElementById(key.toLowerCase()).appendChild(energyBubble);
		}
	}
}

function handleInit(msg) {
	console.log(msg);
	const allies = [];
	if (msg.battle.playerIdOne === Number(document.getElementById("playerId").innerHTML)){
		for (let instance of msg.battle.playerOneTeam){
			for (let char of msg['characters ']){
				if (instance.characterId === char.id){
					allies.push(char);
					break;
				}
			} if (allies.length === 3) break;
		} 
		handlePortraits(msg.battle.playerOneTeam, msg.battle.playerTwoTeam);
		handleEnergy(msg.battle.playerOneEnergy);
	} else {
		for (let instance of msg.battle.playerTwoTeam){
			for (let char of msg['characters ']){
				if (instance.characterId === char.id){
					console.log(instance);
					allies.push(char);
					break;
				}
			} if (allies.length === 3) break;
		}
		handlePortraits(msg.battle.playerTwoTeam, msg.battle.playerOneTeam);
		handleEnergy(msg.battle.playerTwoEnergy);
	}
	// HOOO OOOOOOO OOOO BOYYY 
}

function handleEnergyTrade(msg) {
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

// ------- OTHER

function truncateId(str) {
	return $(str).text().substring($(str).text().length - 8, $(str).text().length);
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
    
    $("#chars option").click(function() {
        if ($("#chars option:selected").length > 3) {
            $(this).removeAttr("selected");
            alert('You can select up to 3 characters only');
        }
    });
});