document.addEventListener("DOMContentLoaded", function() {
    loadHTML("/loginPage/", "placeholder");
    console.log("primeira")
});

function saludar() {
    obtenerHTMLDesdeDjango();
}

function sendMessage() {

    const inputText = document.querySelector('.form-control').value;
    if (window.gameSocket.readyState === WebSocket.OPEN) {
        window.gameSocket.send(JSON.stringify({ message: inputText }));
    } else {
        console.error('La conexión WebSocket no está abierta.');
    }
}