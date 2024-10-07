document.addEventListener("DOMContentLoaded", function() {
    loadHTML("/loginPage/", "placeholder");
    localStorage.setItem('gameRunning', 0); 
});

function saludar() {
    obtenerHTMLDesdeDjango();
}

