function createUrl() {
    document.getElementById("load").style.display = "";
    if (document.getElementById("url").classList.contains("invalid")) {
        document.getElementById("url").classList.remove("invalid");
        document.getElementById("error").innerHTML = "";
    }
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/createUrl");
    if (document.getElementById("sec").value == "1") {
        var j = JSON.stringify({
            url: document.getElementById("url").value,
            securityLevel: document.getElementById("sec").value
        })
    } else {
        var j = JSON.stringify({
            url: document.getElementById("url").value,
            securityLevel: document.getElementById("sec").value,
            password: document.getElementById("pass").value
        })
    }
    xhr.send(j);
    xhr.onload = function () {
        var json = JSON.parse(xhr.responseText);
        if (json.err) {
            document.getElementById("error").innerHTML = json.err.message;
            document.getElementById("url").classList.add("invalid");
            document.getElementById("load").style.display = "none";
            return;
        }
        document.getElementById("rUrl").href = json.id;
        document.getElementById("rUrl").innerHTML = window.location.href + json.id;
        document.getElementById("resp").style.display = "";
        document.getElementById("load").style.display = "none";
    }
}

function openOptions() {
    if (document.getElementById("options").style.display == "none") {
        document.getElementById("options").style.display = "";
        setTimeout(function () {
            document.getElementById("options").style = "width:50%;max-width:990px;height:25%;opacity:1;";
        }, 10)
    } else {
        document.getElementById("options").style = "width:0;height:0;opacity:0";
        setTimeout(function () {
            document.getElementById("options").style.display = "none";
        }, 500)
    }
}