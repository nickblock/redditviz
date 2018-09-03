/*
  tags: basic

  <p>This example demonstrates how to use batch mode commands</p>

<p> To use a command in batch mode, we pass in an array of objects.  Then
 the command is executed once for each object in the array. </p>
*/


var OrbManager = function() {
    
    this.orbs = [];
}
OrbManager.prototype = {

    create: function(data) {
        
        this.orbs = [];
        var labels = [];
        var count = data.length < chart_item_max ? data.length : chart_item_max;
        for(var i=1; i<count; i++) {
            this.orbs.push({
                x: i,
                y: Math.floor(Math.random() * 10),
                r: data[i].count,
                l: data[i].name
            });
        }
    },
    render: function() {
        var drawArray = [];
        for(var i=0; i<this.orbs.length; i++) {
            var orb = this.orbs[i];
            drawArray.push({offset:[orb.x, orb.y], scale:orb.r});
        }
        return drawArray;
    }
}

var TheOrbManager = new OrbManager();

var circlePoints = 200;
var screenSize = [1.0, 1.0]

var genCircleAttributes = function(r, p) {
    var attributes = [0.0, 0.0];
    var frac = (Math.PI*2.0)/p;
    for(var i=0; i<p; i++) {
        attributes.push(r * Math.cos(i * frac));
        attributes.push(r * Math.sin(i * frac));
    }
    return attributes;
} 

var genCircleElements = function(p) {
    var elements = []
    for(var i=0; i<p; i++) {
        elements.push(0, i+1, i+2);
    }
    elements[elements.length-1] = 1;
    return elements
}

var drawBatch = function(regl) {
    
// Next we create our command
const draw = regl({
  frag: `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }`,

  vert: `
    precision mediump float;
    attribute vec2 position;
    uniform float scale;
    uniform vec2 offset;
    uniform vec2 screenSize;
    void main() {
        vec2 pos = (vec2(position.x, position.y) * scale) + offset;
        pos = pos / screenSize;
      gl_Position = vec4(pos, 0.0, 1.0);
    }`,

  attributes: {
    position: genCircleAttributes(1, circlePoints) 
  },

  elements: genCircleElements(circlePoints),

  uniforms: {
    // the batchId parameter gives the index of the command
    color: ({tick}, props, batchId) => [
      Math.sin(0.02 * ((0.1 + Math.sin(batchId)) * tick + 3.0 * batchId)),
      Math.cos(0.02 * (0.02 * tick + 0.1 * batchId)),
      Math.sin(0.02 * ((0.3 + Math.cos(2.0 * batchId)) * tick + 0.8 * batchId)),
      1
    ],
    offset: regl.prop('offset'),
    scale: regl.prop('scale'),
    screenSize: screenSize
  },

  depth: {
    enable: false
  },

  count: circlePoints * 3
})

// Here we register a per-frame callback to draw the whole scene
regl.frame(function () {
  regl.clear({
    color: [0, 0, 0, 1]
  })

  // This tells regl to execute the command once for each object
  draw(TheOrbManager.render())
})

}