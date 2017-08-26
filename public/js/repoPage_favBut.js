var isfaved;
var data = {};

var addfavbut;

window.addEventListener('load', onload, false);
function onload(){
  addfavbut = document.getElementById("addfavbut");
  addfavbut.addEventListener('click', clickAddFav, false);

  let customDataDiv = document.getElementById("customData");
  data.user = customData.getAttribute("data-user");
  data.repo = customData.getAttribute("data-repo");
  isfaved = (customData.getAttribute("data-isFaved") == 'true');
};

function clickAddFav(){
  addfavbut.disabled = true;

  let action = isfaved ? "/removefav" :  "/addfav";

  var xhr = new XMLHttpRequest();
  xhr.open("POST", action, true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

  xhr.onreadystatechange = function (oEvent) {
    //console.log("readyStatechanged");
    if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          isfaved = !isfaved;
          addfavbut.textContent = isfaved ? "Supprimer des favoris" : "Ajouter aux favoris";
          addfavbut.disabled = false;
          
        } else {
           console.log("Error", xhr.statusText);
           addfavbut.disabled = true;
           addfavbut.textContent = "an error happenned, sorry :/";
        }
    }
  };

  // send the collected data as JSON
  xhr.send(JSON.stringify(data));
  //console.log("sent");
}