
let keysPressed = {};
let intervalId = null; 

function sendMessage(message) {

    if (window.gameSocket.readyState === WebSocket.OPEN) {
        window.gameSocket.send(message);
    } else {
        console.error('La conexión WebSocket no está abierta.');
    }
}

function sendPlayerMessage(uniqueId, value) {
    const data = {
        "inputMsg": {
            "player": {}
        }
    };
    data.inputMsg.player[uniqueId] = value;
    sendMessage(JSON.stringify(data));
}

//SAME FOR 2 PLAYERS LOCALY BUT WE ADD NEW KEYs TO LISTEN IN ANOTHER FUNCTION

async function handleKeysOnePlayer(event) {
    if (event.key === 'ArrowUp' || event.keyCode === 38) {
        keysPressed['ArrowUp'] = true;
    } else if (event.key === 'ArrowDown' || event.keyCode === 40) {
        keysPressed['ArrowDown'] = true;
    }

    if (intervalId === null) {
        intervalId = setInterval(async () => {
            if (keysPressed['ArrowUp']) {
                sendPlayerMessage(uniqueID, "-0.20");
            } else if (keysPressed['ArrowDown']) {
                sendPlayerMessage(uniqueID, "0.20");
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
    
    if (!keysPressed['ArrowUp'] && !keysPressed['ArrowDown']) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

window.addEventListener("blur", async () => {
    keysPressed['ArrowUp'] = false;
    keysPressed['ArrowDown'] = false;
    clearInterval(intervalId);
    intervalId = null;
})