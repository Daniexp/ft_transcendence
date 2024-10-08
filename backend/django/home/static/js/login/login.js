document.addEventListener("DOMContentLoaded", login_page());

function login_page() {
    if(document.getElementById('placeholder') != null && document.getElementById('placeholder').innerHTML === ""){
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/login/', true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    var htmlContent = xhr.responseText;
                    document.getElementById('placeholder').innerHTML = htmlContent;
                } else {
                    console.error('Error al hacer la solicitud AJAX:', xhr.status);
                }
            }
        };
        xhr.send();
    }
    else{
        if (document.getElementById('placeholder') != null) {
            document.getElementById('placeholder').innerHTML = ""
        }
    }
}

function login() {
    window.location.href = '/login';
}

function logout() {
    window.location.href = '/logout';
}