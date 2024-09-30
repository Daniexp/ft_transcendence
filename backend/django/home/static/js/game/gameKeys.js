let keysPressed = {};
let intervalId = null; 
let secondIntervalId = null; 

function sendMessage(sock, message) {
    if (sock && sock.readyState === WebSocket.OPEN) {
        sock.send(message);
    } else {
        console.error('La conexión WebSocket no está abierta.');
    }
}

function sendPlayerMessage(uniqueId, value, sock) {
    const data = {
        "inputMsg": {
            "player": {}
        }
    };
    data.inputMsg.player[uniqueId] = value;
    sendMessage(sock, JSON.stringify(data));
}

async function handleKeysOnePlayer(event) {
    if (event.key === 'ArrowUp' || event.keyCode === 38) {
        keysPressed['ArrowUp'] = true;
        event.preventDefault();
    } else if (event.key === 'ArrowDown' || event.keyCode === 40) {
        keysPressed['ArrowDown'] = true;
        event.preventDefault();
    }
    if (modo === 'tournament') {
        if (event.key === 'w' || event.keyCode === 87) { 
            keysPressed['W'] = true;
            event.preventDefault();
        } else if (event.key === 's' || event.keyCode === 83) {
            keysPressed['S'] = true;
            event.preventDefault();
        }
    }

    if (intervalId === null) {
        intervalId = setInterval(() => {
            if (keysPressed['ArrowUp']) {
                sendPlayerMessage(uniqueID, "ArrowUp", window.gameSocket);
            } else if (keysPressed['ArrowDown']) {
                sendPlayerMessage(uniqueID, "ArrowDown", window.gameSocket);
            }
        }, 10);
    }
    if (secondIntervalId === null) {
        secondIntervalId = setInterval(() => {
            if (keysPressed['W']) {
                sendPlayerMessage('local', "ArrowUp", window.secondWeb);
            } else if (keysPressed['S']) {
                sendPlayerMessage('local', "ArrowDown", window.secondWeb);
            }
        }, 10);
    }
}

async function handleKeysUpOnePlayer(event) {
    if (event.key === 'ArrowUp' || event.keyCode === 38) {
        keysPressed['ArrowUp'] = false;
    } else if (event.key === 'ArrowDown' || event.keyCode === 40) {
        keysPressed['ArrowDown'] = false;
    }
    if (event.key === 'w' || event.keyCode === 87) {
        keysPressed['W'] = false;
    } else if (event.key === 's' || event.keyCode === 83) {
        keysPressed['S'] = false;
    }

    if (!keysPressed['ArrowUp'] && !keysPressed['ArrowDown'] && !keysPressed['W'] && !keysPressed['S']) {
        clearInterval(intervalId);
        intervalId = null;
        clearInterval(secondIntervalId);
        secondIntervalId = null;
    }
}

window.addEventListener("blur", () => {
    keysPressed = {};
    clearInterval(intervalId);
    intervalId = null;
    clearInterval(secondIntervalId);
    secondIntervalId = null;
});
