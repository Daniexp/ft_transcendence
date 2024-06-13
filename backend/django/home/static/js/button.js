
document.addEventListener("DOMContentLoaded", function() {
    initWebSocket();
    document.getElementById("sendButtonToSendMsg").addEventListener("click", sendMessage);
});

function saludar() {
    obtenerHTMLDesdeDjango();
}

function obtenerHTMLDesdeDjango() {
    // REQUEST A LA VISTA
    if(document.getElementById('placeholder').innerHTML === ""){
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/somethingHappened/', true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    var htmlContent = xhr.responseText;
                    // SUBSTITUIR EL PLACEHOLDER DEL HTML POR EL NUEVO TEXTO
                    document.getElementById('placeholder').innerHTML = htmlContent;
                } else {
                    console.error('Error al hacer la solicitud AJAX:', xhr.status);
                }
            }
        };
        xhr.send();
    }
    else{
        document.getElementById('placeholder').innerHTML = ""
    }
}

function sendMessage() {

    const inputText = document.querySelector('.form-control').value;
    if (window.gameSocket.readyState === WebSocket.OPEN) {
        window.gameSocket.send(JSON.stringify({ message: inputText }));
    } else {
        console.error('La conexión WebSocket no está abierta.');
    }
}