const regl = require('regl')()
const data = require("./data")

"use strict"

var screen_config = {
  size :  [1.0, 1.0],
  scale :  1.0,
  ratio :  1.0,
}
var circlePoints = 4;

var setScreenSize = function(size) {

  screen_config.size = size;
  // screen_config.scale = distance({x:0, y:0}, {x:screen_config.size[0], y:screen_config.size[1]});
  screen_config.scale = Math.min(screen_config.size[0], screen_config.size[1]);

  screen_config.ratio = screen_config.size[1] / screen_config.size[0];
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
    uniform float depth;
    uniform vec2 offset;
    uniform float screen_ratio;
    uniform mat4 MVP;
    varying float outside;

    void main() {
        vec2 pos = (vec2(position.x, position.y) * scale) + offset;
        pos.x = pos.x * screen_ratio;
        pos = (pos * 2.0) - vec2(1.0);
        gl_Position = MVP * vec4(pos, depth, 1.0);
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
    depth: regl.prop('depth'),
    screen_ratio: regl.prop('screen_ratio'),
    border_size: regl.prop('border_size'),
    MVP: regl.prop('MVP'),
  },

  depth: {
    enable: true
  },

  count: circlePoints * 3,
});

regl.frame(function () {
  regl.clear({
    color: [0.7, 0.7, 0.7, 1]
  });
  draw(data.orbManager.render());
});

}

var init = function(size, display_message, push_history) {

  setScreenSize(size);

  drawBatch(regl);
  
  data.orbManager.display_message_func = display_message;
  data.orbManager.push_history_func = push_history;

  return data.orbManager;
}


module.exports.setScreenSize = setScreenSize;
module.exports.init = init;
module.exports.screen_config = screen_config;