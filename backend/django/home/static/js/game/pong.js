var exitOverwrite = 0;

document.addEventListener("DOMContentLoaded", () => {
    loadHTML("/gameButtonsDisplay/", "placeholder", () => {
        const initButton = document.getElementById("initClick");
        initButton.click();
        document.getElementById('tournamentContainer').style.display = 'none';

        history.pushState({ page: 1 }, "home", "?page=home");

        if (localStorage.getItem('gameRunning') === null) {
            localStorage.setItem('gameRunning', 0); 
        }
        
        window.addEventListener('popstate', function(event) {
            
            resetGameStats()
            if (window.secondWeb != undefined) {
                window.secondWeb.close();
                window.secondWeb = undefined;
            }
            if (window.gameSocket != undefined) {
                exitOverwrite = 1;
                window.gameSocket.close();
                window.gameSocket = undefined;
            }
            if (event.state) {
                switch (event.state.page) {
                    case 1:
                        showHome(1);
                        break;
                    case 2:
                        alert('You cant reconnect to game, if you disconnect, you wont reconnected to the game');
                        showHome(1);
                        break;
                    case 3:
                        showTournamentInput(1);
                        break;
                    default:
                        showHome(0);
                }
            } else {
                showHome(0);
            }
        });
    });
});

function updateButtons(tab) {
    const button1 = document.getElementById('butt1');
    const button2 = document.getElementById('butt2');

    if (tab === 'local') {
        button1.textContent = '1 vs IA.';
        button1.onclick = () => startGame("1vsIA");
        button2.textContent = 'Tournament.';
        button2.onclick = () => showTournamentInput(0);
    } else if (tab === 'multiplayer') {
        button1.textContent = '1 vs 1.';
        button1.onclick = () => startGame("1vs1");
        button2.textContent = '2 vs 2.';
        button2.onclick = () => startGame("2vs2");
    }
}

function getOrGenerateUniqueID() {
    let uniqueID = localStorage.getItem('uniqueID');
    if (!uniqueID) {
        uniqueID = generateUUID();
        localStorage.setItem('uniqueID', uniqueID);
        localStorage.setItem('gameRunning', 0);
    }
    return uniqueID;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function hideShowGameSelect(classSelector, mode) {
    const display = mode === "show" ? 'block' : 'none';
    document.querySelectorAll(classSelector).forEach(button => button.style.display = display);
}

const uniqueID = getOrGenerateUniqueID();
let playerRoundsWon = 0;
let opponentRoundsWon = 0;
let playerRoundGoals = 0;
let opponentRoundGoals = 0;
let currentRound = 1;
let countdownTimeout;
let modo = "";
let countdownElement;

function startGame(mode) {
    let gameRunning = parseInt(localStorage.getItem('gameRunning'));
    if (gameRunning) {
        alert('A game is already in progress on your account. Please finish it before starting a new one.');
        return;
    }

    hideShowGameSelect(".gameSelectionButtons", "hide");
    modo = mode;
    initWebSocket(mode);
    exitOverwrite = 0;
    hideShowGameSelect(".gamePong", "show");
    document.getElementById("gameScoreBalls").classList.remove('displayNone');
    document.getElementById("gameScoreBalls").classList.add('flexStyle')
    history.pushState({ page: 2 }, "game", "?page=game");
    waitForGameStart(mode);
}

let visualGameRunning = 0;

async function waitForGameStart(mode) {
    document.querySelectorAll('.endButtons').forEach(button => button.style.display = "none");
    document.getElementById('score').textContent = "0 - 0";
    document.getElementById('PongButton').onclick = gameOver;

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
        gameContainer.addEventListener('keydown', handleKeyStrokes);
        gameContainer.addEventListener('keyup', handleKeysStop);
        if (mode == "tournament") {
            window.secondWeb = new WebSocket(`wss://${window.location.host}/ws/pong/${"local"}/${mode}/`);
        }
    }

    localStorage.setItem('gameRunning', 1);
    
    await new Promise(resolve => {
        const interval = setInterval(() => {
            if (visualGameRunning) {
                clearInterval(interval);
                resolve();
                visualGameRunning = 0;
            }
        }, 50);
    });

    if (gameContainer.contains(waitingMessage)) {
        gameContainer.removeChild(waitingMessage);
    }
}

function initWebSocket(mode) {
    window.gameSocket  = new WebSocket(`wss://${window.location.host}/ws/pong/${uniqueID}/${mode}/`);

    window.gameSocket.onopen = () => console.log('Conexión abierta');
    window.gameSocket.onmessage = event => {
        try {
            const data = JSON.parse(event.data);
            handleMessage(data);
        } catch (error) {
            console.error('Error al parsear el mensaje:', error);
        }
    };
    window.gameSocket.onerror = error => {
        console.error('Error en la conexión WebSocket:', error);
        localStorage.setItem('gameRunning', 0); 
        showHome(0);
    };
    window.gameSocket.onclose = () => {
        if (exitOverwrite != 1) {
            showHome(0);
        }
        exitOverwrite = 0;
        localStorage.setItem('gameRunning', 0);
    };
}

function handleMessage(data) {
    if (data && typeof data.message === 'object' && data.message !== null) {
        if (data.message.game_started) {
            visualGameRunning = 1
            handleGameStart(data.message.game_started);
        } else if (data.message.players) {
            updatePlayerPositions(data.message.players);
            updateBallPosition(data.message.ball);
        } else if (data.message.goal_scored) {
            handleGoal(data.message);
        } else if (data.message.game_over) {
            winner = data.message.winner;
            handleGameOver();
        }
    } else if (typeof data.message === 'string') {
        handleStringMessage(data.message);
    } else {
        console.log('Mensaje recibido no es un objeto válido');
    }
}

function handleStringMessage(message) {
    if (message === "User disconnected") {
        handleGameOver();
    }
}

function handleGameStart(players) {
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

        countdownElement = document.getElementById('countdown');
        startCountdown();
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
            }
        });
    }
}

function updateBallPosition(ball) {
    const ballDiv = document.getElementById("gameBall");
    if (ballDiv) {
        ballDiv.style.left = `${ball.position[0]}%`;
        ballDiv.style.top = `${ball.position[1]}%`;
    }
}

function handleGoal(data) {
    let player;
    let goals;

    if (data.scored_by === 'left_player') {
        playerRoundGoals++;
        goals = playerRoundGoals
        player = true;
    } else {
        opponentRoundGoals++;
        goals = opponentRoundGoals
        player = false;
    }
    startCountdown();
    updateScoreCircles(goals, player);
    document.getElementById('score').textContent = `${playerRoundsWon} - ${opponentRoundsWon}`;
}

function handleClick() {
    if (window.gameSocket && window.gameSocket.readyState === WebSocket.OPEN) {
        window.gameSocket.close();
        window.gameSocket = undefined;
    }
    if(modo == 'tournament')
        showTournamentInput(0)
    else
        startGame(modo);
}

let countdownActive = false; 
let countdownTimeoutId; 
let countdownValue = 3;

function handleGameOver() {
    if (window.gameSocket && window.gameSocket.readyState === WebSocket.OPEN) {
        window.gameSocket.close();
        window.gameSocket = undefined;
    }
    document.getElementById('gameContainer').removeEventListener('keydown', handleKeyStrokes);
    document.getElementById('gameContainer').removeEventListener('keyup', handleKeysStop);
    exitOverwrite = 1;
    localStorage.setItem('gameRunning', 0);
    if (countdownElement) {
        countdownElement.style.display = 'none';
    }
    if (modo != "tournament")
        document.querySelectorAll('.endButtons').forEach(button => button.style.display = "flex");
    document.getElementById("playAgain").removeEventListener("click", handleClick);
    document.getElementById("playAgain").addEventListener("click", handleClick);

    if (countdownTimeoutId) 
        clearTimeout(countdownTimeoutId); 
    countdownActive = false;
    if (window.secondWeb != undefined) {
        window.secondWeb.close();
        window.secondWeb = undefined;
    }
}

function startCountdown() {
    if (countdownActive) {
        clearTimeout(countdownTimeoutId);
        countdownValue = 3;
        updateCountdown();
        return;
    }

    countdownActive = true;

    if (!countdownElement) {
        countdownElement = document.getElementById('countdown'); 
    }
    
    countdownElement.style.display = 'flex';
    countdownValue = 3;
    
    function updateCountdown() {
        if (countdownValue > 0) {
            countdownElement.textContent = countdownValue;
            countdownValue--;
            countdownTimeoutId = setTimeout(updateCountdown, 900);
        } else {
            countdownElement.textContent = 'Pong!';

            countdownTimeoutId = setTimeout(() => {
                countdownElement.style.display = 'none';
                if (opponentRoundGoals + playerRoundGoals == 3 || opponentRoundGoals == 2 || playerRoundGoals == 2) {
                    resetRoundGoals();
                    resetRoundCircles();
                }
                countdownActive = false;
            }, 400);
        }

        if (!window.gameSocket || window.gameSocket.readyState !== WebSocket.OPEN) {
            if (exitOverwrite !== 1) {
                window.gameSocket = undefined;
                showHome(1);
            }
            localStorage.setItem('gameRunning', 0);
            return; 
        }
    }

    updateCountdown();
}

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

function updateRoundCircles(side, roundWins, won = true) {
    const circle = document.getElementById(`${side}Round${roundWins}`);
    if (circle) {
        circle.classList.add(won ? 'won' : 'lost');
    }
}

function clearTimeoutCountDown(){
    if (countdownTimeoutId) 
        clearTimeout(countdownTimeoutId); 
    countdownActive = false;
    document.getElementById('countdown').style.display = 'none'; 
}

function showHome(back){
    hideShowGameSelect('.endButtons', 'hide');
    keysPressed['ArrowUp'] = false;
    keysPressed['ArrowDown'] = false;
    keysPressed['w'] = false;
    keysPressed['s'] = false;
    hideShowGameSelect('.gameSelectionButtons', 'show');
    hideShowGameSelect('.gamePong', 'hide');
    document.getElementById('gameContainer').innerHTML = "";
    if (countdownElement) {
        countdownElement.style.display = 'none';
        countdownElement.textContent = "";
    }
    document.getElementById("gameScoreBalls").classList.add('displayNone');
    document.getElementById("gameScoreBalls").classList.remove('flexStyle');
    document.getElementById('score').innerHTML = "0 - 0";
    clearTimeoutCountDown();
    const tournamentContainer = document.getElementById('tournamentContainer');
    if(tournamentContainer)
        hideTournament();
    if (localStorage.getItem('gameRunning') == 1 && back) {
        localStorage.setItem('gameRunning', 0); 
    }
    else if(!back){
        history.pushState({ page: 1 }, "home", "?page=home");
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
    if (window.gameSocket && window.gameSocket.readyState === WebSocket.OPEN) {
        window.gameSocket.close();
        window.gameSocket = undefined;
    }
    showHome(1);
}

function resetGameStats() {
    localStorage.setItem('gameRunning', 0);
    playerRoundsWon = 0;
    opponentRoundsWon = 0;
    playerRoundGoals = 0;
    opponentRoundGoals = 0;
    currentRound = 1;
    if (countdownElement) {
        countdownElement.style.display = 'none';
        countdownElement.textContent = "";
    }
    document.getElementById('score').textContent = "0 - 0";
}
