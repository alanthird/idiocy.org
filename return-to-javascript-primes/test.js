
$("#testButton").on("click", check);
$("#testNum").on("keypress", function (event) {
  if(event.which === 13){
    check();
  }
});

function check() {
  var n = $("#testNum").val();
  
  if (P.isPrime(n)) {
    $("#result").html(n+" is a prime! :D");
  }
  else {
    $("#result").html(n+" isn't a prime :(");
  }
}
