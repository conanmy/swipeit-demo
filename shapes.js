var NUM_BUBBLES = 10;
var FRICTION_VELOCITY = 0.01;

var canvas = document.createElement('canvas');
var canvasPicker = document.createElement('canvas');
canvas.id = "main-canvas";
canvasPicker.id = "picker-canvas";
canvasPicker.style.visibility = "hidden";
canvasPicker.style.visibility = "hidden";
canvasPicker.style.position = 'fixed';

var bubbles = [];
var container = document.getElementById('container');
container.appendChild(canvas);
container.appendChild(canvasPicker);

var bBox = container.getBoundingClientRect();
canvas.width = canvasPicker.width = bBox.width;
canvas.height = canvasPicker.height = bBox.height;

window.onresize = function(){
  console.log('fire');
  resizeCanvas();
}

function resizeCanvas(){
  var container = document.getElementById('container');
  container.appendChild(canvas);
  container.appendChild(canvasPicker);

  var bBox = container.getBoundingClientRect();
  canvas.width = canvasPicker.width = bBox.width;
  canvas.height = canvasPicker.height = bBox.height;
}

resizeCanvas();
var canvasRegion = new ZingTouch.Region(document.getElementById('container'));
//SWIPING
canvasRegion.bind(canvas, 'swipe', function(e) {
  var weight = 1.5;
  
  setOutput([
    ['Gesture', 'Swipe'],
    ['velocity', Math.floor(e.detail.data[0].velocity) + "px/ms"],
    ['currentDirection', Math.floor(e.detail.data[0].currentDirection) + "°"]
  ]);

  var canvas = document.getElementById('main-canvas');
  var canvasRect = canvas.getBoundingClientRect();
  var x = e.detail.events[0].x - canvasRect.left;
  var y = e.detail.events[0].y - canvasRect.top;

  bubbles[lastIndex].x = (x < 0) ? 0 : (x > canvasRect.width) ? canvasRect.width : x;
  bubbles[lastIndex].y = (y < 0) ? 0 : (y > canvasRect.height) ? canvasRect.height : y;
  var theta = Math.sin((Math.PI / 180) * e.detail.data[0].currentDirection);
  bubbles[lastIndex].vy = -1 * (2 * (e.detail.data[0].velocity * Math.sin((Math.PI / 180) * e.detail.data[0].currentDirection)));
  bubbles[lastIndex].vx = 2 * (e.detail.data[0].velocity * Math.cos((Math.PI / 180) * e.detail.data[0].currentDirection));
});

//PANNING
var currentIndex = lastIndex = null;
var customPan = new ZingTouch.Pan({
  threshold: 1
});
var startPan = customPan.start;

customPan.start = function(inputs) {
  var canvas = document.getElementById('main-canvas');
  var canvasRect = canvas.getBoundingClientRect();

  var x = inputs[0].current.x - canvasRect.left;
  var y = inputs[0].current.y - canvasRect.top;
  currentIndex = getIndex(x, y);
  if (currentIndex !== null) {
    bubbles[currentIndex].stopped = true;
  }

  return startPan.call(this, inputs);
}
canvasRegion.bind(canvas, customPan, function(e) {
  setOutput([
    ['Gesture', 'Pan'],
    ['currentDirection', Math.floor(e.detail.data[0].currentDirection) + "°"],
    ['directionFromOrigin', Math.floor(e.detail.data[0].directionFromOrigin) + "°"],
    ['distanceFromOrigin', Math.floor(e.detail.data[0].distanceFromOrigin) + "px"]
  ]);
  
  var originalEvent = e.detail.events[0].originalEvent;
  var canvas = document.getElementById('main-canvas');
  var canvasRect = canvas.getBoundingClientRect();

  var x = e.detail.events[0].x - canvasRect.left;
  var y = e.detail.events[0].y - canvasRect.top;

  var rect = canvas.getBoundingClientRect();
  bubbles[currentIndex].x = (x < 0) ? 0 : (x > rect.width) ? rect.width : x;
  bubbles[currentIndex].y = (y < 0) ? 0 : (y > rect.height) ? rect.height : y;

  //Change velocity.
  bubbles[currentIndex].vy = -1 * Math.sin((Math.PI / 180) * e.detail.data[0].currentDirection);
  bubbles[currentIndex].vx = Math.cos((Math.PI / 180) * e.detail.data[0].currentDirection);
});

var endPan = customPan.end;
customPan.end = function(inputs) {
  bubbles[currentIndex].stopped = false;
  lastIndex = currentIndex;
  currentIndex = null;
  return endPan.call(this, inputs);
}

function getIndex(x, y) {
  x = Math.floor(x);
  y = Math.floor(y);
  var canvas = document.getElementById('picker-canvas');
  ctx = canvas.getContext('2d');
  var colors = ctx.getImageData(x, y, 1, 1).data;
  var str = "";
  for (var i = 0; i < colors.length - 1; i++) {
    str += colors[i];
  }
  return parseInt(str);
}

var Bubble = function() {
  this.x = getRandNum(0, canvas.width);
  this.y = getRandNum(0, canvas.height);
  this.vx = 0;
  this.vy = 0;
  this.radius = 40;
  this.minRadius = getRandNum(30, 50);
  this.maxRadius = 50;
  this.stopped = false;
  this.grow = true;
  this.color = 'rgba(' + getRandNum(0, 10) + ',' + getRandNum(0, 250) + ',' + getRandNum(100, 255) + ',' + 0.6 + ')';
  this.rate = getRandNum(0.1, 0.2, 1);
};

Bubble.prototype = {
  render: function(id) {
    var canvas = document.getElementById('main-canvas');
    var canvasPicker = document.getElementById('picker-canvas');
    ctx = canvas.getContext('2d');
    ctxPicker = canvasPicker.getContext('2d');
    drawOnCanvas(this, ctx, id, false);
    drawOnCanvas(this, ctxPicker, id, true);

    function drawOnCanvas(_this, context, id, picker) {
      id = id + "";
      var arr = id.split('');
      while (arr.length < 3) {
        arr.unshift("0");
      }
      if (picker) {
        var color = arr.join(',');
        context.beginPath();
        context.arc(_this.x, _this.y, _this.radius, 0, 2 * Math.PI);
        context.fillStyle = 'rgba(' + color + ',1)';
        context.strokeStyle = 'rgba(' + color + ',1)';
      } else {
        var color = arr.join(',');
        context.beginPath();
        context.arc(_this.x, _this.y, _this.radius, 0, 2 * Math.PI);
        context.fillStyle = _this.color;
        context.strokeStyle = (_this.stopped) ? 'rgba(0,0,0,0.5)' : _this.color;
      }

      context.fill();
      context.stroke();
    }

  },
  update: function() {
    //UPDATABLE
    if (this.stopped) {
      return;
    }
    //
    //                // //RADIUS
    //                if (this.grow) {
    //                    if (this.radius < this.maxRadius) {
    //                        this.radius = this.rate + this.radius;
    //                    } else {
    //                        this.grow = false;
    //                        this.radius = this.radius - this.rate;
    //                    }
    //                } else {
    //                    if (this.radius > this.minRadius) {
    //                        this.radius = this.radius - this.rate;
    //                    } else {
    //                        this.grow = true;
    //                        this.radius = this.rate + this.radius;
    //                    }
    //                }
    //                this.radius = parseFloat(this.radius);

    //MOVEMENT
    var canvas = document.getElementById('main-canvas');
    var canvasRect = canvas.getBoundingClientRect();
    if (Math.abs(this.vx) < FRICTION_VELOCITY) {
      this.vx == 0;
    } else {
      this.vx = this.vx > 0 ? Math.abs(this.vx) - FRICTION_VELOCITY : 0 - (Math.abs(this.vx) - FRICTION_VELOCITY);
    }
    if (Math.abs(this.vy) < FRICTION_VELOCITY) {
      this.vy == 0;
    } else {
      this.vy = this.vy > 0 ? Math.abs(this.vy) - FRICTION_VELOCITY : 0 - (Math.abs(this.vy) - FRICTION_VELOCITY);
    }
    this.x = this.x + (this.vx * 1);
    this.y = this.y + (this.vy * 1);

    //Change direction / hit a boundary
    if (this.x > canvasRect.width || this.x < 0) {
      if (this.x < 0) {
        this.x = 0;
      } else {
        this.x = canvasRect.width;
      }

      //Reduce velocity
      var currentDirectionX = (this.vx > 0) ? 1 : -1;
      this.vx = Math.abs(this.vx) * 0.60; //Reduce velocity
      this.vx = (this.vx < 1) ? 1 : this.vx;
      this.vx = (currentDirectionX * -1) * this.vx;
    }

    if (this.y > canvasRect.height || this.y < 0) {
      if (this.y < 0) {
        this.y = 0;
      } else {
        this.y = canvasRect.height;
      }

      var currentDirectionY = (this.vy > 0) ? 1 : -1;
      this.vy = Math.abs(this.vy) * 0.60; //Reduce velocity
      this.vy = (this.vy < 1) ? 1 : this.vy;
      this.vy = (currentDirectionY * -1) * this.vy;
    }
  }
}

for (var i = 0; i < NUM_BUBBLES; i++) {
  var bubble = new Bubble();
  bubbles.push(bubble);
  bubble.render(i);
}

window.requestAnimationFrame(eventLoop);

function eventLoop(timestamp) {
  window.requestAnimationFrame(eventLoop);
  var canvas = document.getElementById('main-canvas');
  var canvasPicker = document.getElementById('picker-canvas');
  ctx = canvas.getContext('2d');
  ctxPicker = canvasPicker.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctxPicker.clearRect(0, 0, canvasPicker.width, canvasPicker.height);

  for (var i = 0; i < bubbles.length; i++) {
    for (var j = i + 1; j < bubbles.length; j++) {
      if (bubbles[i].vx > 0 || bubbles[i].vy > 0 || bubbles[j].vx > 0 || bubbles[j].vy > 0) {
        if (Math.pow(bubbles[i].x - bubbles[y].x, 2) + Math.pow(bubbles[i].y - bubbles[y].y, 2) <= Math.pow(bubbles[i].radius + bubbles[j].radius, 2)) {
          i.y - j.y / Math.sqrt(Math.pow(i.x - j.x, 2) + Math.pow(i.y - j.y, 2))
        }
      }
    }
  }

  for (var i = 0; i < bubbles.length; i++) {
    bubbles[i].update(i);
    bubbles[i].render(i);
  }
}

function getRandNum(min, max, decimals) {
  decimals = (decimals) ? decimals : 0;
  return parseFloat((Math.random() * (max - min + 1) + min).toFixed(decimals));
}

function setOutput(data){
  var outputStr = "> ";
  for (var i = 0; i < data.length; i++){
    outputStr += data[i][0] + ": " + data[i][1] + ((i===data.length-1) ? '' : ' , ');
  }
  var output = document.getElementById('output');
  output.innerHTML = outputStr;
}
