var F={
  memoize: function(f) {
    var cache=[];
    
    return function(arg) {
      return (arg in cache) ? cache[arg] : cache[arg]=f(arg);
    }
  }
};

/* Prime number code. Javascript doesn't have any native way to
 * determine if a number is a prime number and there doesn't seem to
 * be a standard library for it so I'm rolling my own.
 */
var P={
  isPrime: F.memoize(function(n) {
    function p(n) {
      return {
	v: n,
	n: function() {
	  for (n+=2 ; !P.isPrime(n) ; n+=2);
	  return p(n);
	}
      }
    }

    n=Math.abs(n);

    if (n===2) {
      return true;
    }
    if (n < 2 || n%2 === 0) {
      return false;
    }

    var pr=p(3);

    do {
      if (pr.v * pr.v > n) {
	return true;
      }
      if (n%pr.v===0) {
	return false;
      }
    }
    while (pr=pr.n());
  }),

  isGaussianPrime: function(r, i) {
    function isNaturalNum(n) {
      return parseInt(n) === n && n >= 0;
    }

    function is4n3(n) {
      return isNaturalNum((n-3)/4);
    }

    function is4n3Prime(n) {
      return is4n3(n) && P.isPrime(n);
    }

    function isNon4n3Prime(n) {
      return !is4n3(n) && P.isPrime(n);
    }

    function sumSquares(a, b) {
      return a*a+b*b;
    }

    if (r===0) {
      return is4n3Prime(i);
    }
    if (i===0) {
      return is4n3Prime(r);
    }
    return isNon4n3Prime(sumSquares(r, i));
  }
};

/* Simple complex number implementation. I don't need anything other
 * than adding and equality so I left it all out. */
var C={
  create: function(r, i) {
    return {
      real: r,
      imaginary: i
    };
  },

  add: function(a, b) {
    return this.create(a.real+b.real,
		       a.imaginary+b.imaginary);
  },

  eq: function(a, b) {
    return a.real === b.real && a.imaginary === b.imaginary;
  }
};

/* Calculates the spiral and returns it as an array of complex
 * numbers. It takes two to four arguments, the first two being a
 * Gaussian Integer and the last two being limits as to how big the
 * spiral can get. If you don't use the last two it defaults to a
 * maximum of one million turns and a maximum straight line walk of
 * one million. This is just to prevent it running forever if you do
 * happen to discover a starting point that never cycles.
 */
function findSpiral(real, imaginary, maxNodes, maxDistance) {
  /* returns a function that just spews out the next complex number to
   * use for the straight line walk. */
  function makeTurnLeft(d) {
    var n=[
      C.create(1, 0),
      C.create(0, 1),
      C.create(-1, 0),
      C.create(0, -1)
    ];

    return function() {
      return n[d++%4];
    };
  };

  /* Walk in the direction specified by the complex number "direction"
   * until you find a gaussian prime, then return that prime. */
  function walk(location, direction, maxDistance) {
    while (maxDistance--) {
      location=C.add(location, direction);

      if (P.isGaussianPrime(location.real, location.imaginary))
	return location;
    }

    return false;
  }

  /* Some array handling stuff */
  function last(a) {
    return a[a.length-1];
  }

  function lastTwo(a) {
    return [a[a.length-2],
	    a[a.length-1]];
  }

  function firstTwo(a) {
    return [a[0], a[1]];
  }

  /* This is to check whether the last two nodes in the walk match the
   * first two. If they do then we have a cycle. */
  function comparePairs(a, b) {
    return C.eq(a[0], b[0]) && C.eq(a[1], b[1]);
  }

  maxNodes=(typeof maxNodes === "number") ? maxNodes : 1000000;
  maxDistance=(typeof maxDistance === "number") ? maxDistance : 1000000;
  var nodeList=[];

  var turnLeft=makeTurnLeft(0);

  /* If the user's entered a non-prime starting location find the
   * first prime on the walk and pretend that's our starting
   * location. This is done purely to make detecting a cycle
   * easier. */
  if (P.isGaussianPrime(real, imaginary)) {
    nodeList.push(C.create(real, imaginary));
  }
  else {
    nodeList.push(walk(C.create(real, imaginary),
		       turnLeft(),
		       maxDistance));
  }

  /* Perform the random walk. */
  while (maxNodes--) {
    nodeList.push(walk(last(nodeList),
		       turnLeft(),
		       maxDistance));

    if (last(nodeList) === false)
      return false;

    if (nodeList.length > 2 &&
	comparePairs(firstTwo(nodeList), lastTwo(nodeList)))
      return nodeList.slice(0, -2);
  }

  return false;
}

function makeSpiral() {
  function drawShape(ctx, points) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth="1px";
    ctx.beginPath();
    ctx.moveTo(_.first(points).x, _.first(points).y);

    _.each(_.rest(points), function(point) {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    });

    ctx.closePath();
    ctx.stroke();
  }

  function transformToScreen(ctx, points, border) {
    function size(p) {
      return _.max(p) - _.min(p);
    }

    function ratios() {
      return [
	(ctx.width-2*border)/size(_.map(points, function(p) {return p.real})),
	(ctx.height-2*border)/size(_.map(points, function(p) {return p.imaginary}))
      ];
    }

    function centre(x, y) {
      return {
	x: _.min(x)+(_.max(x)-_.min(x))/2,
	y: _.min(y)+(_.max(y)-_.min(y))/2
      };
    }

    var scale=_.min(ratios());
    var centre=centre(_.map(points, function(p) {return p.real}),
		      _.map(points, function(p) {return p.imaginary}));

    return _.map(points, function(p) {
      return {
	x: Math.round(ctx.width/2+(p.real-centre.x) * scale),
	y: Math.round(ctx.height/2-((p.imaginary-centre.y) * scale))
      }
    });
  }

  var canvas=document.getElementById("gaussianSpiral");
  var ctx=canvas.getContext("2d");

  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  
  ctx.width=canvas.width;
  ctx.height=canvas.height;

  $("#gaussianSpiral").hide();
  $("#gaussianSpinner").show();

  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'yellow';
  ctx.fill();

  var spiralPoints=findSpiral(parseInt($("#realPart").val()),
			      parseInt($("#imaginaryPart").val()));

  drawShape(ctx, transformToScreen(ctx, spiralPoints, 20));

  $("#gaussianSpinner").hide();
  $("#gaussianSpiral").show();
}

$(document).ready(function() {
  makeSpiral();

  $("#makeSpiral").on("click", function() {
    makeSpiral();
  });
});
