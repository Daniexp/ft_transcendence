import {modo, uniqueID} from './pong.js';

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

async function handleKeyStrokes(event) {
    if (event.key === 'W' || event.keyCode === 87) {
        keysPressed['W'] = true;
        event.preventDefault();
    } else if (event.key === 'S' || event.keyCode === 83) {
        keysPressed['S'] = true;
        event.preventDefault();
    }
    if (modo === 'tournament') {
        if (event.key === 'ArrowUp' || event.keyCode === 38) { 
            keysPressed['ArrowUp'] = true;
            event.preventDefault();
        } else if (event.key === 'ArrowDown' || event.keyCode === 40) {
            keysPressed['ArrowDown'] = true;
            event.preventDefault();
        }
    }

    if (intervalId === null) {
        intervalId = setInterval(() => {
            if (keysPressed['W']) {
                sendPlayerMessage(uniqueID, "ArrowUp", window.gameSocket);
            } else if (keysPressed['S']) {
                sendPlayerMessage(uniqueID, "ArrowDown", window.gameSocket);
            }
        }, 10);
    }
    if (secondIntervalId === null) {
        secondIntervalId = setInterval(() => {
            if (keysPressed['ArrowUp']) {
                sendPlayerMessage('local', "ArrowUp", window.secondWeb);
            } else if (keysPressed['ArrowDown']) {
                sendPlayerMessage('local', "ArrowDown", window.secondWeb);
            }
        }, 10);
    }
}
window.handleKeyStrokes = handleKeyStrokes

export async function handleKeysStop(event) {
    if (event.key === 'W' || event.keyCode === 87) {
        keysPressed['W'] = false;
    } else if (event.key === 'S' || event.keyCode === 83) {
        keysPressed['S'] = false;
    }
    if (event.key === 'ArrowUp' || event.keyCode === 38) {
        keysPressed['ArrowUp'] = false;
    } else if (event.key === 'ArrowDown' || event.keyCode === 40) {
        keysPressed['ArrowDown'] = false;
    }

    if (!keysPressed['W'] && !keysPressed['S'] && !keysPressed['ArrowUp'] && !keysPressed['ArrowDown']) {
        clearInterval(intervalId);
        intervalId = null;
        clearInterval(secondIntervalId);
        secondIntervalId = null;
    }
}
window.handleKeysStop = handleKeysStop

export async function handleKeysReset(event) {
    keysPressed['W'] = false;
    keysPressed['S'] = false;
    keysPressed['ArrowUp'] = false;
    keysPressed['ArrowDown'] = false;
    clearInterval(intervalId);
    intervalId = null;
    clearInterval(secondIntervalId);
    secondIntervalId = null;
}
window.handleKeysReset = handleKeysReset


window.addEventListener("blur", () => {
    keysPressed = {};
    clearInterval(intervalId);
    intervalId = null;
    clearInterval(secondIntervalId);
    secondIntervalId = null;
});
