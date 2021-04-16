function createUrl() {
    document.getElementById("load").style.display = "";
    if (document.getElementById("url").classList.contains("invalid")) {
        document.getElementById("url").classList.remove("invalid");
        document.getElementById("error").innerHTML = "";
    }
    var xhr = new XMLHttpRequest();
    document.getElementById("resp").style.display = "none";
    xhr.open("POST", "/api/createUrl");
    if (document.getElementById("sec").value == "1") {
        var j = JSON.stringify({
            url: document.getElementById("url").value,
            securityLevel: document.getElementById("sec").value
        });
    } else {
        var j = JSON.stringify({
            url: document.getElementById("url").value,
            securityLevel: document.getElementById("sec").value,
            password: document.getElementById("passHome").value
        });
    }
    xhr.send(j);
    xhr.onload = function () {
        var json = JSON.parse(xhr.responseText);
        if (json.err) {
            document.getElementById("error").innerHTML = json.err.message;
            document.getElementById("url").classList.add("invalid");
            document.getElementById("load").style.display = "none";
            document.getElementById("resp").style.display = "";
            return;
        }
        document.getElementById("rUrl").href = json.id;
        document.getElementById("rUrl").innerHTML = window.location.href + json.id;
        document.getElementById("resp").style.display = "";
        document.getElementById("load").style.display = "none";
    }
}