function createUrl() {
  document.getElementById("load").style.display = "";
  if (document.getElementById("url").classList.contains("invalid")) {
    document.getElementById("url").classList.remove("invalid");
    document.getElementById("error").innerHTML = "";
  }
  var xhr = new XMLHttpRequest();
  document.getElementById("resp").style.display = "none";
  xhr.open("POST", "/api/make");
  var fd = new FormData();
  fd.append("url", document.getElementById("url").value);
  fd.append("sec", document.getElementById("sec").value);
  fd.append("password", document.getElementById("passHome").value);
  xhr.send(fd);
  xhr.onload = function () {
    var json = JSON.parse(xhr.responseText);
    if (json.err) {
      document.getElementById("error").innerHTML = json.err.message;
      document.getElementById("url").classList.add("invalid");
      document.getElementById("load").style.display = "none";
      document.getElementById("rUrl").style.display = "none";
      document.getElementById("resp").style.display = "";
      document.getElementById("error").style.display = "";
    } else {  
      document.getElementById("rUrl").href = json.j.id;
      document.getElementById("rUrl").innerHTML = window.location.href + json.j.id;
      document.getElementById("resp").style.display = "";
      document.getElementById("rUrl").style.display = "";
      document.getElementById("load").style.display = "none";
      document.getElementById("error").style.display = "none";
    } 
  }
}