var animals=[
  "tiger", "bear", "lion", "wolf", "giraffe", "leopard", "panther",
  "lynx", "jaguar", "penguin", "elephant", "hippo",
  "octopus", "shark", "squid", "echidna", "hedgehog", "iguana",
  "platypus", "clownfish", "eel", "caelocanth", "mammoth", "ape",
  "monkey", "mandrill", "baboon", "gorilla", "wildcat", "walrus"
];

var cooking=[
  "grills", "roasts", "flambés", "toasts", "microwaves", "poaches",
  "frys", "marinades", "stews", "barbecues", "broils", "sears",
  "bakes", "boils", "blanches", "braises", "steams", "steeps",
  "sautés", "smokes", "stir-frys"
];

function go() {
  function replaceI(word) {
    return word.replace(/i/g, "y");
  }

  function generateName() {
    var forename=_.sample(animals);
    var surname=replaceI(_.sample((forename === "bear") ? _.without(cooking, "grills") : cooking));
    return forename + " " + surname;
  }

  document.querySelector("#name span").innerHTML=generateName();
}

document.getElementById("go").addEventListener("click", go);
go();
