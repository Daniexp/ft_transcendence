document.addEventListener("DOMContentLoaded", function() {
    loadHTML("/gameButtonsDisplay/", "placeholder");
});

function getOrGenerateUniqueID() {
    let uniqueID = localStorage.getItem('uniqueID');
    if (!uniqueID) {
        uniqueID = generateUUID();
        localStorage.setItem('uniqueID', uniqueID);
    }
    return uniqueID;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function hideShowGameSelect(classSelector, mode){
    var buttons = document.querySelectorAll(classSelector);
    buttons.forEach(function(button) {
        button.style.display = mode === "show" ? 'block' : 'none';
    });
}

let gameRunning = 0;

function startGame(mode){
    hideShowGameSelect(".gameSelectionButtons", "hide");
    if (mode === '1vs1') {
        initWebSocket();
        hideShowGameSelect(".gamePong", "show");
        waitForGameStart(mode);
    }
}

async function waitForGameStart(mode) {
    if (mode === '1vs1') {
        gameContainer.addEventListener('keydown', handleKeysOnePlayer);
        gameContainer.addEventListener('keyup', handleKeysUpOnePlayer);
    }
    while (gameRunning === 0) {
        await sleep(50);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const uniqueID = getOrGenerateUniqueID();
let playerScore = 0;
let opponentScore = 0;

function initWebSocket() {
    var gameSocket = new WebSocket(`ws://${window.location.host}/ws/pong/${uniqueID}/`);

    gameSocket.onopen = function(event) {
        console.log('Conexión abierta');
    };

    gameSocket.onmessage = function(event) {
        try {
            var data = JSON.parse(event.data);
            console.log('Datos parseados:', data);
            
            if (data && typeof data.message === 'object' && data.message !== null) {
                if (data.message.game_started) {
                    handleGameStart(data.message.game_started);
                } else if (data.message.players) {
                    updatePlayerPositions(data.message.players);
                    updateBallPosition(data.message.ball);
                } else if (data.message.goal_scored) {
                    handleGoal(data.message);
                } else if (data.message.game_over) {
                    resetGame();
                    gameSocket.close();
                } else {
                    console.log('Datos de jugadores no encontrados o no es un objeto:', data.message);
                }
            } else if (typeof data.message === 'string') {
                handleStringMessage(data.message, gameSocket);
            } else {
                console.log('Mensaje recibido no es un objeto válido');
            }
        } catch (error) {
            console.error('Error al parsear el mensaje:', error);
        }
    };
                    
    gameSocket.onerror = function(error) {
        console.error('Error en la conexión WebSocket:', error);
        resetGame();
    };

    gameSocket.onclose = function(event) {
        console.log('Conexión cerrada');
        resetGame();
    };

    window.gameSocket = gameSocket;
}

function handleGoal(data) {
    startCountdown();
    
    if (data.scored_by === 'left_player') {
        updateScoreCircles(playerScore, true);
    } else { 
        updateScoreCircles(opponentScore, false);
    }
}

function handleGameStart(players) {
    console.log('Juego iniciado: players=', players);
    const gameContainer = document.getElementById('gameContainer');
    
    if (gameContainer) {
        gameContainer.innerHTML = '';

        Object.keys(players).forEach(key => {
            const newDiv = document.createElement('div');
            newDiv.id = key;
            newDiv.classList.add('gamePlayer');
            gameContainer.appendChild(newDiv);
        });
        
        const ball = document.createElement('div');
        ball.id = "gameBall";
        gameContainer.appendChild(ball);
        
        startCountdown();
    } else {
        console.error('gameContainer no encontrado');
    }
}
            
function updatePlayerPositions(players) {
    const gameContainer = document.getElementById('gameContainer');

    if (gameContainer) {
        Object.keys(players).forEach(key => {
            const player = players[key];
            const playerDiv = document.getElementById(key);
            
            if (playerDiv) {
                playerDiv.style.left = `${player.position[0]}%`;
                playerDiv.style.top = `${player.position[1]}%`;
            } else {
                console.error('Div no encontrado para el jugador:', key);
            }
        });
    } else {
        console.error('gameContainer no encontrado');
    }
}
                    
function updateBallPosition(ball) {
    const ballDiv = document.getElementById("gameBall");
    if (ballDiv) {
        ballDiv.style.left = `${ball.position[0]}%`;
        ballDiv.style.top = `${ball.position[1]}%`;
    } else {
        console.error("Bola no encontrada en el DOM");
    }
}
        
function handleStringMessage(message, gameSocket) {
    console.log('Mensaje de texto recibido:', message);
    if (message === "User disconnected") {
        resetGame();
        gameSocket.close();
    }
}

let playerRoundsWon = 0;
let opponentRoundsWon = 0;
let playerRoundGoals = 0;
let opponentRoundGoals = 0;
let currentRound = 1;  
                
function resetGame() {
    hideShowGameSelect('.gameSelectionButtons', 'show');
    hideShowGameSelect('.gamePong', 'hide');
    document.getElementById('gameContainer').innerHTML = "";
    const countdownElement = document.getElementById('countdown');
    countdownElement.style.display = 'none';  
    countdownElement.textContent = "";
    gameRunning = 0;
    playerRoundsWon = 0;
    opponentRoundsWon = 0;
    playerRoundGoals = 0;
    opponentRoundGoals = 0;
    currentRound = 1;  
    resetRoundCircles();
}
    
function startCountdown() {
    const countdownElement = document.getElementById('countdown');
    countdownElement.style.display = 'block';

    let countdownValue = 3;
    
    function updateCountdown() {
        if (countdownValue > 0) {
            countdownElement.textContent = countdownValue;
            countdownValue--;
            setTimeout(updateCountdown, 1000);
        } else {
            countdownElement.textContent = 'Pong!';
            setTimeout(() => {
                countdownElement.style.display = 'none';
                console.error("LEFT: "+ opponentRoundGoals + " RIGHT: " + playerRoundGoals)
                if (opponentRoundGoals + playerRoundGoals >= 3){
                    resetRoundGoals();
                    resetRoundCircles();
                    console.error("RESET");
                }
                gameRunning = 1;
            }, 1000);
        }
    }
                    
    updateCountdown();
}   


function updateScoreCircles(score, isPlayer) {
    if (isPlayer) {
        playerRoundGoals++;
        updateRoundCircles('left', opponentRoundGoals + playerRoundGoals, true);
        updateRoundCircles('right', opponentRoundGoals + playerRoundGoals, false);
        if (playerRoundGoals >= 2) { 
            playerRoundsWon++;
            currentRound++;
        }
    } else {
        opponentRoundGoals++;
        updateRoundCircles('right', opponentRoundGoals + playerRoundGoals, true);
        updateRoundCircles('left', opponentRoundGoals + playerRoundGoals, false);
        if (opponentRoundGoals >= 2) { 
            opponentRoundsWon++;
            currentRound++;
        }
    }

    if (playerRoundsWon > 3 || opponentRoundsWon > 3) {
        gameOver();
    }
}

function updateRoundCircles(side, roundWins, won = true) {
    let circle = document.getElementById(`${side}Round${roundWins}`);
    circle.classList.add(won ? 'won' : 'lost');
}

function resetRoundGoals() {
    playerRoundGoals = 0;
    opponentRoundGoals = 0;
}

function resetRoundCircles() {
    for (let i = 1; i <= 3; i++) {
        document.getElementById('leftRound' + i).classList.remove('won', 'lost');
        document.getElementById('rightRound' + i).classList.remove('won', 'lost');
    }
}

function gameOver() {
    console.log("El juego ha terminado");
    resetGame();
}
