
import { handleKeysReset } from './gameKeys.js';
import {codeValue, winner} from './pong.js';

let players = [];
let matchesQueue = [];

function showMessage(message) {

    removeMessage();

    const messageContainer = document.getElementById('gameContainer');
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.className = 'message';
    messageContainer.appendChild(messageDiv);
}

function removeMessage() {
    const messageContainer = document.getElementById('gameContainer');
    
    const existingMessage = messageContainer.querySelector('.message');
    if (existingMessage) {
        messageContainer.removeChild(existingMessage);
    }
}

const handlePlayerInput = (event) => {
    const playerNameInput = document.getElementById('playerName');
    if (event.key === 'Enter') {
        addPlayer();
    }
};


var setRunningZero = 0;

export function showTournamentInput(back) {
    players = [];
    matchesQueue = [];

    hideShowGameSelect('.endButtons', 'hide');
    document.getElementById("gameScoreBalls").classList.add('displayNone');
    document.getElementById("gameScoreBalls").classList.remove('flexStyle');
    hideShowGameSelect('.gamePong', 'hide');
    hideShowGameSelect(".gameSelectionButtons", "hide");
    const pongButton = document.getElementById('PongButton');

    pongButton.addEventListener("click", endTournament);

    const tournamentContainer = document.getElementById('tournamentContainer');
    tournamentContainer.classList.remove('displayNone');
    clearTimeoutCountDown();
    tournamentContainer.classList.add('d-flex');

    const playerNameInput = document.getElementById('playerName');
    playerNameInput.value = ""; 

    playerNameInput.addEventListener('keydown', handlePlayerInput);
    if(!back){
        history.pushState({ page: 3 }, "tournament", `?page=tournament&code=${codeValue}`);
    }
}
window.showTournamentInput = showTournamentInput;

export function startTournament() {
    setRunningZero = 1;
    let gameRunning = parseInt(localStorage.getItem('gameRunning'));
    if (players.length < 2) {
        alert("Need at least 2 players to start a tournament.");
        return;
    }
    if (gameRunning) {
        alert('A game is already in progress on your account. Please finish it before starting a new one.');
        return;
    }

    const playerListDiv = document.getElementById('playerList');
    while (playerListDiv.firstChild) {
        playerListDiv.removeChild(playerListDiv.firstChild);
    }
    const tournamentContainer = document.getElementById('tournamentContainer');
    tournamentContainer.classList.remove('d-flex');
    tournamentContainer.classList.add('displayNone');
    playNextMatch();
}
window.startTournament = startTournament

export function endTournament() {

    if (window.gameSocket && window.gameSocket.readyState === WebSocket.OPEN) {
        window.gameSocket.close();
        window.gameSocket = undefined;
    }

    if (window.secondWeb && window.secondWeb.readyState === WebSocket.OPEN) {
        window.secondWeb.close();
        window.secondWeb = undefined;
    }
    if(setRunningZero){
        localStorage.setItem('gameRunning', 0); 
        setRunningZero = 0;
    }
    handleKeysReset();
    showHome(0);
}
window.endTournament = endTournament

export function hideTournament(){
    const tournamentContainer = document.getElementById('tournamentContainer');
    tournamentContainer.classList.remove('d-flex');
    tournamentContainer.classList.add('displayNone');
    document.getElementById("distion").classList.remove('d-flex');
    document.getElementById("distion").classList.add('displayNone');
    document.getElementById('PongButton').removeEventListener('click', gameOver);
    const playerNameInput = document.getElementById('playerName');
    playerNameInput.removeEventListener('keydown', handlePlayerInput);
    const playerListDiv = document.getElementById('playerList');
    while (playerListDiv.firstChild) {
        playerListDiv.removeChild(playerListDiv.firstChild);
    }
}
window.hideTournament = hideTournament;

function setupMatches() {
    matchesQueue = [];
    if (players.length > 1) {
        for (let i = 0; i < players.length; i += 2) {
            if (i + 1 < players.length) {
                matchesQueue.push([players[i], players[i + 1]]);
            } else {
                matchesQueue.push([players[i], null]);
            }
        }
    }
}


let player1
let player2

export async function startTournamentGame(){
    document.getElementById("distion").classList.remove('d-flex');
    document.getElementById("distion").classList.add('displayNone');
    localStorage.setItem('gameRunning', 0);

    try {
        startGame("tournament"); 
        await waitForGameToEnd();

        if (winner !== 'No one') {
            if (winner == "left_player")
                players = players.filter(player => player !== player2); 
            else
                players = players.filter(player => player !== player1); 
            playNextMatch();
        }
    } catch (error) {
        console.error("Error al jugar el partido:", error);
    }
}
window.startTournamentGame = startTournamentGame;

async function playNextMatch() {
    setupMatches();
    let match = matchesQueue.shift();
    localStorage.setItem('gameRunning', 1);
    
    if (match == null || match.length == 1) {
        showMessage(`Tournament winner ${players[0]}!`);
        document.querySelectorAll('.endButtons').forEach(button => button.style.display = "flex");
        return;
    }
    player1 = match[0];
    player2 = match[1];

    if (player2 == null) {
        players.push(player1);
        return playNextMatch(); 
    }

    showMessage(`${player1} VS ${player2}.`);

    document.getElementById("distion").classList.remove('displayNone');
    document.getElementById("distion").classList.add('d-flex');
    document.getElementById("gameScoreBalls").classList.remove('displayNone');
    document.getElementById("gameScoreBalls").classList.add('flexStyle');
    hideShowGameSelect('.gamePong', 'show');
    document.getElementById('countdown').style.display = 'none';
    resetRoundCircles()
}

async function waitForGameToEnd() {
    return new Promise((resolve) => {
        const checkGameRunning = setInterval(() => {
            let gameRunning = parseInt(localStorage.getItem('gameRunning'));
            if (!gameRunning) { 
                clearInterval(checkGameRunning);
                resolve();
            }
        }, 100);
    });
}

function updatePlayerList() {
    const playerListDiv = document.getElementById('playerList');
    while (playerListDiv.firstChild) {
        playerListDiv.removeChild(playerListDiv.firstChild);
    }

    players.forEach((player) => {
        const playerDiv = document.createElement('div');
        playerDiv.textContent = player + ".";
        playerDiv.className = 'player-name';
        playerListDiv.appendChild(playerDiv);
    });
}

function addPlayer() {
    const playerNameInput = document.getElementById('playerName');
    const playerName = playerNameInput.value.trim();

    if (playerName === "") {
        alert("No se puede agregar un nombre vacío.");
        return;
    }

    if (players.includes(playerName)) {
        alert("El jugador ya está registrado.");
        return;
    }

    players.push(playerName);
    playerNameInput.value = "";
    updatePlayerList();
}
