document.getElementById("scriptNeeded").style.display = "";

document.getElementById("pass").onkeydown = function(e) {
    if (e.key == "Enter") {unlock();}
};

function unlock() {
    if (document.getElementById("pass").classList.contains("invalid")) {
        document.getElementById("pass").classList.remove("invalid");
        document.getElementById("error").innerHTML = "";
    }
    var xhr = new XMLHttpRequest();
    var id = window.location.pathname.substring(1);
    xhr.open("POST", "/api/attempt/" + id);
    var j = JSON.stringify({
        "password": document.getElementById("pass").value
    })
    xhr.send(j);
    xhr.onload = function () {
        var json = JSON.parse(xhr.responseText);
        if (!json.err) {
            document.getElementById("load").style.display = "";
            document.getElementById("scriptNeeded").style.display = "none";
            window.open(json.url, "_self");
        } else {
            document.getElementById("pass").classList.add("invalid");
            document.getElementById("error").innerHTML = json.err.message;
        }
    }
}