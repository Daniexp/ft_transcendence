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
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function hideShowGameSelect(classSelector, mode) {
    const buttons = document.querySelectorAll(classSelector);
    buttons.forEach(button => button.style.display = mode === "show" ? 'block' : 'none');
}

const uniqueID = getOrGenerateUniqueID();
let gameRunning = 0;
let playerRoundsWon = 0;
let opponentRoundsWon = 0;
let playerRoundGoals = 0;
let opponentRoundGoals = 0;
let currentRound = 1;
let countdownTimeout;
var exitOverwrite = 0;

function startGame(mode) {
    hideShowGameSelect(".gameSelectionButtons", "hide");

    if (mode === '1vs1') {
        initWebSocket();
        exitOverwrite = 0;
        hideShowGameSelect(".gamePong", "show");

        const playerRounds = document.querySelectorAll('.displayNone');
        playerRounds.forEach(rounds => {
            rounds.classList.remove('displayNone');
            rounds.style.display = "flex";
        });

        waitForGameStart(mode);
    }
}

async function waitForGameStart(mode) {
    const endButton = document.querySelectorAll('.endButtons');
    endButton.forEach(endButt => endButt.style.display = "none");
    document.getElementById('score').innerHTML = " 0 - 0 ";
    gameRunning = 0;
    playerRoundsWon = 0;
    opponentRoundsWon = 0;
    playerRoundGoals = 0;
    opponentRoundGoals = 0;
    currentRound = 1;
    resetRoundCircles();
    if (mode === '1vs1') {
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.addEventListener('keydown', handleKeysOnePlayer);
            gameContainer.addEventListener('keyup', handleKeysUpOnePlayer);
        }
    }
    while (gameRunning === 0) {
        await sleep(50);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function initWebSocket() {
    let gameSocket = window.gameSocket || new WebSocket(`ws://${window.location.host}/ws/pong/${uniqueID}/`);
    window.gameSocket = gameSocket;

    gameSocket.onopen = () => console.log('Conexión abierta');

    gameSocket.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            handleMessage(data);
        } catch (error) {
            console.error('Error al parsear el mensaje:', error);
        }
    };

    gameSocket.onerror = (error) => {
        console.error('Error en la conexión WebSocket:', error);
        resetGame();
        document.getElementById('gameContainer').removeEventListener('keydown', handleKeysOnePlayer);
        document.getElementById('gameContainer').removeEventListener('keyup', handleKeysUpOnePlayer);
    };

    gameSocket.onclose = () => {
        console.log('Conexión cerrada');
        if (exitOverwrite !== 1) {
            resetGame();
        }
        document.getElementById('gameContainer').removeEventListener('keydown', handleKeysOnePlayer);
        document.getElementById('gameContainer').removeEventListener('keyup', handleKeysUpOnePlayer);
    };
}

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

function handleStringMessage(message) {
    console.log('Mensaje de texto recibido:', message);
    if (message === "User disconnected") {
        resetGame();
        window.gameSocket.close();
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

function handleGameOver() {
    document.getElementById('gameContainer').removeEventListener('keydown', handleKeysOnePlayer);
    document.getElementById('gameContainer').removeEventListener('keyup', handleKeysUpOnePlayer);
    gameSocket.close();
    window.gameSocket = undefined;
    exitOverwrite = 1;
    gameRunning = 0;
    resetRoundCircles();
    if (countdownTimeout) clearTimeout(countdownTimeout);
    const countdownElement = document.getElementById('countdown');
    countdownElement.style.display = 'none';
    countdownElement.textContent = "";
    const endButton = document.querySelectorAll('.endButtons');
    endButton.forEach(endButt => endButt.style.display = "flex");
}

function resetGame() {
    hideShowGameSelect('.gameSelectionButtons', 'show');
    hideShowGameSelect('.gamePong', 'hide');
    document.getElementById('gameContainer').innerHTML = "";
    const countdownElement = document.getElementById('countdown');
    countdownElement.style.display = 'none';
    countdownElement.textContent = "";
    const balls = document.getElementById('gameScoreBalls');
    balls.classList.add("displayNone");
    balls.style.display = "";
    const endButton = document.querySelectorAll('.endButtons');
    endButton.forEach(endButt => endButt.style.display = "none");
    document.getElementById('score').innerHTML = " 0 - 0 ";
    gameRunning = 0;
    playerRoundsWon = 0;
    opponentRoundsWon = 0;
    playerRoundGoals = 0;
    opponentRoundGoals = 0;
    currentRound = 1;
    resetRoundCircles();
    if (countdownTimeout) clearTimeout(countdownTimeout);
}

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

function updateScoreCircles(score, isPlayer) {
    if (isPlayer) {
        updateRoundCircles('left', opponentRoundGoals + playerRoundGoals, true);
        updateRoundCircles('right', opponentRoundGoals + playerRoundGoals, false);
        if (playerRoundGoals >= 2) {
            playerRoundsWon++;
            currentRound++;
        }
    } else {
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
    const circle = document.getElementById(`${side}Round${roundWins}`);
    if (circle) {
        circle.classList.add(won ? 'won' : 'lost');
    }
}

function resetRoundGoals() {
    playerRoundGoals = 0;
    opponentRoundGoals = 0;
}

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

function gameOver() {
    console.log("El juego ha terminado");
    resetGame();
}
