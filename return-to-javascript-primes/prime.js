
var P = (function(lookupSize) {
  var lookup = null;
  
  function millerRabin(n) {
    function isOdd(n) {
      return n%2===1;
    }
  
    function rnd(floor, ceil) {
      return floor+Math.floor(Math.random()*(ceil-floor));
    }
  
    // A custom exponentiation function. Raising numbers to large
    // powers can very quickly take javascript's numbers out of their
    // linear range, but we only need the modulus of the result, and
    // modular arithmetic allows us to cheat.
    function expmod(base, exponent, mod) {
      var result=1;
  
      while (exponent > 0) {
        if (isOdd(exponent)) {
          result=result*base%mod;
          exponent--;
        }
  
        base=base*base%mod;
        exponent=exponent/2;
      }
      return result;
    }
  
    // This check finds whether the number is composite, if it finds
    // it fails to find the number composite it doesn't mean it's
    // definitely prime. It gets run several times for each number we
    // want to check so as to reduce the chances we give a false
    // positive.
    function test(q, s) {
      var a=rnd(1, n-1);
      var apowq=expmod(a, q, n);
  
      if (apowq===1 || apowq===n-1) return true;
  
      for (var i=1 ; i < s ; i++) {
        var t=expmod(apowq, 1<<i, n);
  
        if (t===n-1 || t===1) {
          return true;
        }
      }
      
      return false;
    }
  
    for (var q=n-1, s=0 ; !isOdd(q) ; q/=2, s++);
  
    // Check up to twenty times
    for (var i=0, t=true ; i<20 && t ; i++)
      t=t && test(q, s);
  
    return t;
  }

  // initialise the array
  function initLookup(size) {
    l = Array(size);
    l[0] = false;
    l[1] = false;

    for (var i = 2 ; i < size ; i++) {
      l[i] = true;
    }

    return l;
  }

  // Seive out the composites
  function seive(primeList) {
    for (var p = 2 ; p < primeList.length ; p++) {
      if (primeList[p]) {
        for (var n = p*2 ; n < primeList.length ; n = n+p) {
          primeList[n] = false;
        }
      }
    }
    return primeList;
  }

  // Test divide against some low numbers
  function divisionTest(n) {
    var primes = [2, 3, 5, 7];
    for (var i = 0 ; i < primes.length ; i++) {
      if (n%primes[i] === 0) {
        return false;
      }
    }
    return true;
  }
  
  function isPrime(n) {
    // Generate lookup when it's first required
    if (lookup === null) {
      lookup = seive(initLookup(lookupSize));
    }
    
    // For our purposes negative primes are the same as positive
    // primes
    if (n < 0) {
      n = -n;
    }

    if (n < lookupSize) {
      return lookup[n];
    }

    // If the division test doesn't detect a composite, use
    // miller-rabin
    if (divisionTest(n)) {
      return millerRabin(n);
    }

    return false;
  }

  return {
    isPrime: isPrime
  };
})(500000); // Lookup size is half a million

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
