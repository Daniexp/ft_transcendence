
let keysPressed = {};
let intervalId = null; 

function sendMessage(message) {

    if (window.gameSocket != undefined && window.gameSocket.readyState === WebSocket.OPEN) {
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
        event.preventDefault();
    } else if (event.key === 'ArrowDown' || event.keyCode === 40) {
        keysPressed['ArrowDown'] = true;
        event.preventDefault();
    }
    // if(mode === 'tournament'){
    //     if (event.key === 'W' || event.keyCode === 38) {
    //         keysPressed['W'] = true;
    //         event.preventDefault();
    //     } else if (event.key === 'S' || event.keyCode === 40) {
    //         keysPressed['S'] = true;
    //         event.preventDefault();
    //     }
    // }

    if (intervalId === null) {
        intervalId = setInterval(async () => {
            if (keysPressed['ArrowUp']) {
                sendPlayerMessage(uniqueID, "ArrowUp");
            } else if (keysPressed['ArrowDown']) {
                sendPlayerMessage(uniqueID, "ArrowDown");
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