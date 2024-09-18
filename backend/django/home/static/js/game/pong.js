// Event listener to load HTML content on page load
document.addEventListener("DOMContentLoaded", () => {
    loadHTML("/gameButtonsDisplay/", "placeholder");
});


function updateButtons(tab) {
    const button1 = document.getElementById('butt1');
    const button2 = document.getElementById('butt2');

    if (tab === 'local') {
        button1.textContent = '1 vs IA';
        button1.setAttribute('onclick', 'startGame("1vsIA")');
        button2.textContent = 'Tournament';
        button2.setAttribute('onclick', 'startGame("tournament")');
    } else if (tab === 'multiplayer') {
        button1.textContent = '1 vs 1';
        button1.setAttribute('onclick', 'startGame("1vs1")');
        button2.textContent = '2 vs 2';
        button2.setAttribute('onclick', 'startGame("2vs2")');
    } 
}


// Function to get or generate a unique ID
function getOrGenerateUniqueID() {
    let uniqueID = localStorage.getItem('uniqueID');
    if (!uniqueID) {
        uniqueID = generateUUID();
        localStorage.setItem('uniqueID', uniqueID);
    }
    return uniqueID;
}

// Function to generate a UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Function to show or hide game selection buttons
function hideShowGameSelect(classSelector, mode) {
    document.querySelectorAll(classSelector).forEach(button => {
        button.style.display = mode === "show" ? 'block' : 'none';
    });
}

// Global variables
const uniqueID = getOrGenerateUniqueID();
let gameRunning = 0;
let playerRoundsWon = 0;
let opponentRoundsWon = 0;
let playerRoundGoals = 0;
let opponentRoundGoals = 0;
let currentRound = 1;
let countdownTimeout;
let exitOverwrite = 0;
let modo = "";

// Function to start the game
// Función para iniciar el juego según el modo seleccionado
function startGame(mode) {
    hideShowGameSelect(".gameSelectionButtons", "hide");

    modo = mode;
    initWebSocket(mode);
    exitOverwrite = 0;
    hideShowGameSelect(".gamePong", "show");
    document.querySelectorAll('.displayNone').forEach(rounds => {
        rounds.classList.remove('displayNone');
        rounds.style.display = "flex";
    });
    waitForGameStart(mode);
}

// Function to wait for the game to start
async function waitForGameStart(mode) {
    document.querySelectorAll('.endButtons').forEach(button => button.style.display = "none");
    document.getElementById('score').innerHTML = "0 - 0";
    document.getElementById('PongButton').addEventListener('click', gameOver);

    resetGameStats();
    resetRoundCircles();

    const gameContainer = document.getElementById('gameContainer');

    const waitingMessage = document.createElement('div');
    waitingMessage.id = 'waitingMessage';
    waitingMessage.style.cssText = `
        font-size: 2rem; 
        text-align: center; 
        position: absolute; 
        width: 100%; 
        height: 100%; 
        display: flex; 
        justify-content: center; 
        align-items: center;
    `;
    waitingMessage.innerText = "Waiting for player/s...";
    gameContainer.appendChild(waitingMessage);

    if (gameContainer) {
        gameContainer.addEventListener('keydown', handleKeysOnePlayer);
        gameContainer.addEventListener('keyup', handleKeysUpOnePlayer);
    }
    
    while (gameRunning === 0) {
        await sleep(50);
    }

    if (gameContainer.contains(waitingMessage)) {
        gameContainer.removeChild(waitingMessage);
    }
}


// Function to pause execution for a specified duration
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to initialize WebSocket connection
function initWebSocket(mode) {
    const gameSocket = new WebSocket(`wss://${window.location.host}/ws/pong/${uniqueID}/${mode}/`);
    window.gameSocket = gameSocket;

    gameSocket.onopen = () => console.log('Conexión abierta');

    gameSocket.onmessage = event => {
        try {
            const data = JSON.parse(event.data);
            handleMessage(data);
        } catch (error) {
            console.error('Error al parsear el mensaje:', error);
        }
    };

    gameSocket.onerror = error => {
        console.error('Error en la conexión WebSocket:', error);
        resetGame();
    };

    gameSocket.onclose = () => {
        console.log('Conexión cerrada');
        if (exitOverwrite !== 1) {
            resetGame();
        }
    };
}

// Function to handle messages received from WebSocket
function handleMessage(data) {
    if (data && typeof data.message === 'object' && data.message !== null) {
        if (data.message.game_started) {
            handleGameStart(data.message.game_started);
        } else if (data.message.players) {
            updatePlayerPositions(data.message.players);
            updateBallPosition(data.message.ball);
        } else if (data.message.goal_scored) {
            handleGoal(data.message);
        } else if (data.message.game_over) {
            handleGameOver();
        } else {
            console.log('Datos de jugadores no encontrados o no es un objeto:', data.message);
        }
    } else if (typeof data.message === 'string') {
        handleStringMessage(data.message);
    } else {
        console.log('Mensaje recibido no es un objeto válido');
    }
}

// Function to handle string messages
function handleStringMessage(message) {
    console.log('Mensaje de texto recibido:', message);
    if (message === "User disconnected") {
        handleGameOver();
    }
}

// Function to handle game start
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

// Function to update player positions
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

// Function to update ball position
function updateBallPosition(ball) {
    const ballDiv = document.getElementById("gameBall");
    if (ballDiv) {
        ballDiv.style.left = `${ball.position[0]}%`;
        ballDiv.style.top = `${ball.position[1]}%`;
    } else {
        console.error("Bola no encontrada en el DOM");
    }
}

// Function to handle goal scoring
function handleGoal(data) {
    startCountdown();
    if (data.scored_by === 'left_player') {
        playerRoundGoals++;
        updateScoreCircles(playerRoundGoals, true);
    } else {
        opponentRoundGoals++;
        updateScoreCircles(opponentRoundGoals, false);
    }
    document.getElementById('score').innerHTML = `${playerRoundsWon} - ${opponentRoundsWon}`;
}

function handleClick() {
    if (window.gameSocket != undefined && window.gameSocket.readyState === WebSocket.OPEN) 
    {
        window.gameSocket.close();
        window.gameSocket = undefined;
    }
    startGame(modo);
}

// Function to handle game over
function handleGameOver() {
    document.getElementById('gameContainer').removeEventListener('keydown', handleKeysOnePlayer);
    document.getElementById('gameContainer').removeEventListener('keyup', handleKeysUpOnePlayer);
    window.gameSocket.close();
    window.gameSocket = undefined;
    exitOverwrite = 1;
    gameRunning = 0;
    if (countdownTimeout) clearTimeout(countdownTimeout);
    const countdownElement = document.getElementById('countdown');
    countdownElement.style.display = 'none';
    countdownElement.textContent = "";
    document.querySelectorAll('.endButtons').forEach(button => button.style.display = "flex");
    document.getElementById("playAgain").removeEventListener("click", handleClick);
    document.getElementById("playAgain").addEventListener("click", handleClick);
    
}

// Function to reset the game
function resetGame() {
    keysPressed['ArrowUp'] = false;
    keysPressed['ArrowDown'] = false;
    clearInterval(intervalId);
    intervalId = null;
    hideShowGameSelect('.gameSelectionButtons', 'show');
    hideShowGameSelect('.gamePong', 'hide');
    document.getElementById('gameContainer').innerHTML = "";
    const countdownElement = document.getElementById('countdown');
    countdownElement.style.display = 'none';
    countdownElement.textContent = "";
    const balls = document.getElementById('gameScoreBalls');
    balls.classList.add("displayNone");
    balls.style.display = "";
    document.querySelectorAll('.endButtons').forEach(button => button.style.display = "none");
    document.getElementById('score').innerHTML = "0 - 0";
    resetGameStats();
    resetRoundCircles();
    if (countdownTimeout) clearTimeout(countdownTimeout);
    document.getElementById('PongButton').removeEventListener('click', gameOver);
}

// Function to start countdown before game begins
function startCountdown() {
    const countdownElement = document.getElementById('countdown');
    countdownElement.style.display = 'flex';
    let countdownValue = 3;

    function updateCountdown() {
        if (countdownValue > 0) {
            countdownElement.textContent = countdownValue;
            countdownValue--;
            countdownTimeout = setTimeout(updateCountdown, 1000);
        } else {
            countdownElement.textContent = 'Pong!';
            countdownTimeout = setTimeout(() => {
                countdownElement.style.display = 'none';
                if (opponentRoundGoals + playerRoundGoals >= 3 || opponentRoundGoals === 2 || playerRoundGoals === 2) {
                    resetRoundGoals();
                    resetRoundCircles();
                }
                gameRunning = 1;
            }, 1000);
        }
    }

    updateCountdown();
}

// Function to update score circles
function updateScoreCircles(score, isPlayer) {
    const roundWins = opponentRoundGoals + playerRoundGoals;
    if (isPlayer) {
        updateRoundCircles('left', roundWins, true);
        updateRoundCircles('right', roundWins, false);
        if (playerRoundGoals >= 2) {
            playerRoundsWon++;
            currentRound++;
        }
    } else {
        updateRoundCircles('right', roundWins, true);
        updateRoundCircles('left', roundWins, false);
        if (opponentRoundGoals >= 2) {
            opponentRoundsWon++;
            currentRound++;
        }
    }

}

// Function to update round circles for a specific side
function updateRoundCircles(side, roundWins, won = true) {
    const circle = document.getElementById(`${side}Round${roundWins}`);
    if (circle) {
        circle.classList.add(won ? 'won' : 'lost');
    }
}

// Function to reset round goals
function resetRoundGoals() {
    playerRoundGoals = 0;
    opponentRoundGoals = 0;
}

// Function to reset round circles
function resetRoundCircles() {
    for (let i = 1; i <= 3; i++) {
        const leftCircle = document.getElementById('leftRound' + i);
        const rightCircle = document.getElementById('rightRound' + i);
        if (leftCircle) {
            leftCircle.classList.remove('won', 'lost');
        }
        if (rightCircle) {
            rightCircle.classList.remove('won', 'lost');
        }
    }
}

// Function to handle game over state
function gameOver() {
    console.log("El juego ha terminado");
    if (window.gameSocket != undefined && window.gameSocket.readyState === WebSocket.OPEN){
        window.gameSocket.close();
        window.gameSocket = undefined;
    }
    resetGame();
}

// Function to reset game stats
function resetGameStats() {
    gameRunning = 0;
    playerRoundsWon = 0;
    opponentRoundsWon = 0;
    playerRoundGoals = 0;
    opponentRoundGoals = 0;
    currentRound = 1;
    const countdownElement = document.getElementById('countdown');
    countdownElement.style.display = 'none';
    countdownElement.textContent = "";
    document.getElementById('score').innerHTML = "0 - 0";
}
