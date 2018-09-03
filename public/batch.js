/*
  tags: basic
  
  <p>This example demonstrates how to use batch mode commands</p>
  
  <p> To use a command in batch mode, we pass in an array of objects.  Then
  the command is executed once for each object in the array. </p>
  */
 
 var screenSize = [1.0, 1.0];

 var colors = [
    [44/255.0, 19/255.0, 32/255.0, 1.0],
    [95/255.0, 75/255.0, 102/255.0, 1.0],
    [167/255.0, 173/255.0, 198/255.0, 1.0],
    [135/255.0, 151/255.0, 175/255.0, 1.0],
    [86/255.0, 102/255.0, 122/255.0, 1.0],
];

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
                x: i * (screenSize[0]/count),
                y: Math.floor(Math.random() * screenSize[1]),
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

var genCircleAttributes = function(r, p) {
    var attributes = [0.0, 0.0, 0.0];
    var frac = (Math.PI*2.0)/p;
    for(var i=0; i<p; i++) {
        attributes.push(r * Math.cos(i * frac));
        attributes.push(r * Math.sin(i * frac));
        attributes.push(1.0); //last element used as color-outline in shader
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
    varying float outside;
    void main() {
        if(outside > 0.98) {
            gl_FragColor = vec4(0,0,0,1.0);
        }
        else {
            gl_FragColor = color;
        }
    }`,

  vert: `
    precision mediump float;
    attribute vec3 position;
    uniform float scale;
    uniform vec2 offset;
    uniform vec2 screenSize;
    varying float outside;
    void main() {
        vec2 pos = (vec2(position.x, position.y) * scale) + offset;
        pos = pos / screenSize;
        pos = (pos * 2.0) - vec2(1.0);
        gl_Position = vec4(pos, 0.0, 1.0);
        outside = position.z;
    }`,

  attributes: {
    position: genCircleAttributes(1, circlePoints) 
  },

  elements: genCircleElements(circlePoints),

  uniforms: {
    // the batchId parameter gives the index of the command
    color: ({tick}, props, batchId) => colors[batchId%colors.length],
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
    color: [0.7, 0.7, 0.7, 1]
  })

  // This tells regl to execute the command once for each object
  draw(TheOrbManager.render())
})

}