"use strict";
const PROD_URL = "";
const STAGE_URL = "66.242.90.163:8171";
const DEV_URL = "localhost:8817";
const DEV_ROREN_URL = "localhost:8171";
const URL = DEV_URL;

var ws = null;

function connect() {
	ws = new WebSocket('ws://'+ URL +'/chat');
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
    $("#greetings").html("");
    $("#greetings").append(`Greetings, ${message.slice(6, message.length-2)}!`);
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