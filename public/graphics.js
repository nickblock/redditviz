var screen_size = [1.0, 1.0];
var screen_scale = 1.0;
var screen_ratio = 1.0;

//  var colors = [
//     [44/255.0, 19/255.0, 32/255.0, 1.0],
//     [95/255.0, 75/255.0, 102/255.0, 1.0],
//     [167/255.0, 173/255.0, 198/255.0, 1.0],
//     [135/255.0, 151/255.0, 175/255.0, 1.0],
//     [86/255.0, 102/255.0, 122/255.0, 1.0],
// ];
var colors = [
    [197/255, 209/255, 221/255, 1.0],
    [112/255, 110/255, 141/255, 1.0],
    [168/255, 160/255, 157/255, 1.0],
    [125/255, 101/255, 79/255, 1.0],
    [176/255, 149/255, 126/255, 1.0],
]

var circlePoints = 4;

var setScreenSize = function(size) {
  screen_size = size;
  // screen_scale = distance({x:0, y:0}, {x:screen_size[0], y:screen_size[1]});
  screen_scale = Math.min(screen_size[0], screen_size[1]);

  screen_ratio = screen_size[1] / screen_size[0];
}

var genCircleAttributes = function(r, p) {
    var attributes = [0.0, 0.0, 0.0];
    var frac = (Math.PI*2.0)/p;
    var quarter = Math.PI/4.0;
    for(var i=0; i<p; i++) {
        attributes.push(r * Math.cos(i * frac + quarter));
        attributes.push(r * Math.sin(i * frac + quarter));
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
    
const draw = regl({
  frag: `
    precision mediump float;
    uniform vec4 color;
    uniform float scale;
    uniform float border_size;
    varying float outside;

    bool inBorder() {
      float distToEdge = (1.0 - outside) * scale;
      return distToEdge < border_size;
    }
    void main() {
        if(inBorder()) {
            gl_FragColor = vec4(0,0,0,1);
        }
        else {
            gl_FragColor = color;
        }
        
      //  gl_FragColor = mix(vec4(0,0,0,1.0), color, 1.0 - pow(outside, 16.0));
    }`,

  vert: `
    precision mediump float;
    attribute vec3 position;
    uniform float scale;
    uniform vec2 offset;
    uniform float screen_ratio;
    varying float outside;
    void main() {
        vec2 pos = (vec2(position.x, position.y) * scale) + offset;
        pos.x = pos.x * screen_ratio;
        pos = (pos * 2.0) - vec2(1.0);
        gl_Position = vec4(pos, 0.0, 1.0);
        outside = position.z;
    }`,

  attributes: {
    position: genCircleAttributes(1, circlePoints) 
  },

  elements: genCircleElements(circlePoints),

  uniforms: {
      
    color: regl.prop('color'),
    offset: regl.prop('offset'),
    scale: regl.prop('scale'),
    screen_ratio: regl.prop('screen_ratio'),
    border_size: regl.prop('border_size'),
  },

  depth: {
    enable: false
  },

  count: circlePoints * 3,
});

regl.frame(function () {
  regl.clear({
    color: [0.7, 0.7, 0.7, 1]
  });
  draw(orbManager.render());
});

}