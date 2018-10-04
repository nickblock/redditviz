const Matter = require("matter-js");
const graphics = require("./graphics")
const utils = require("./utils")
const mat4 = require("gl-mat4");

"use strict"

var colors = [
    [197/255, 209/255, 221/255, 1.0],
    [112/255, 110/255, 141/255, 1.0],
    [168/255, 160/255, 157/255, 1.0],
    [125/255, 101/255, 79/255, 1.0],
    [176/255, 149/255, 126/255, 1.0],
];


var physicsEngine = Matter.Engine.create();
physicsEngine.world.gravity.scale = 0.0;

var size_scale = 0.001;
var border_size = 3;
var max_item_count = 20;
var spring_strength = 0.0005;
var min_mutual_dist = 0.1;
var max_mutual_count = 10;
var mutual_dist_multiplier = 0.05;
var body_friction = 0.2;
var body_mass = 10;
var min_hover_dist = 0.1;
var highlight_color = "red"
var index = 0;
var MVPMatrix = [];

var Spring = function(bodyA, bodyB, length, strength) {
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this.length = length;
    this.strength = strength;
}
Spring.prototype = {
    update: function() {
        var v = {
            x: this.bodyA.position.x - this.bodyB.position.x,
            y: this.bodyA.position.y - this.bodyB.position.y
        }
        var l = Math.sqrt(v.x*v.x + v.y*v.y);
        var f = (l - this.length) * this.strength;

        Matter.Body.applyForce(this.bodyA, this.bodyA.position, {x:-v.x*f, y:-v.y*f});
        Matter.Body.applyForce(this.bodyB, this.bodyB.position, {x:v.x*f, y:v.y*f});
    }
}

var Orb = function(index, data, is_primary) {
    
    var xpos, ypos;
    xpos = 0.5;
    ypos = 0.5;
    if(!is_primary) {
        [xpos, ypos] = this.spawn_pos(index);
    }
    this.color = colors[index%colors.length];

    this.count = data.count;
    
    this.name = data.name;
    this.subs = undefined;
    this.body = Matter.Bodies.circle(
        xpos, ypos,
        this.calculate_radius(), {
            frictionAir: body_friction,
            mass: body_mass
        }
    )
    //prevent collisions
    this.body.collisionFilter = 1 << index;
}
Orb.prototype = {
    spawn_pos: function(index) {

        //distribute orbs randomly around center of screen to start
        xpos = Math.random();// (i/count);
        ypos = Math.random();// (i/count);

        return [xpos, ypos];
    },
    get_mutual_attraction: function(otherSub) {
        var other_attr = otherSub.get_attraction(this.name);
        if(other_attr !== undefined) {
            var attr = this.get_attraction(otherSub.name);
            if(attr !== undefined) {
                var mutual = (other_attr / otherSub.count) + (attr / this.count);
                //mutual = Math.max(0, mutual - Math.abs(other_attr - attr));

                return mutual;
            }
        }
        return undefined;
    },
    get_attraction: function(sub_name) {
        if(this.subs == undefined) {
            return undefined;
        }
        for(var i=0; i<this.subs.length; i++) {
            if(this.subs[i].name == sub_name) {
                return this.subs[i].count;
            }
        }
        return 0;
    },
    create_text_element: function() {
        this.div = document.createElement("div");
        this.text = document.createTextNode(this.name);
        this.div.appendChild(this.text);
        this.div.style.position = "absolute";
        this.div.style.zIndex = 1
        document.body.appendChild(this.div);
    },
    move_text: function(offset, scale) {
        if(this.added) {
            this.div.style.left = scale * (this.body.position.x+offset[0])  + "px";
            this.div.style.bottom = scale * (this.body.position.y+offset[1]) + "px";
        }
    },
    set_text_color: function(color) {
        if(this.added) {
            this.div.style.color = color;
        }
    },
    calculate_radius: function() {
        this.radius = this.count * size_scale;
        return this.radius;
    },
    add: function() {
        this.create_text_element();
        Matter.World.add(physicsEngine.world, this.body);
        this.added = true;
    },
    remove: function() {
        
        if(!this.added) return;

        console.log("remove " + this.name)
        document.body.removeChild(this.div);
        Matter.World.remove(physicsEngine.world, this.body);
        this.added = false;
    },
    world_matrix: function() {
        var m = [];
        mat4.identity(m);
        mat4.translate(m,m,[this.body.position.x, this.body.position.y, 0.0]);
        mat4.scale(m,m, [this.radius, this.radius, 1.0]);
        return m;
    }

}

var OrbManager = function() {
    
    this.orbs = {};
    this.display_message_func;
    this.push_history_func;
    this.springs = [];
    this.bb;
}
OrbManager.prototype = {

    init: function(search, data) {
        this.springs = [];
        var newOrbs = {};
        var count = Math.min(data.length, max_item_count);
        for(var i=0; i<count; i++) {
            var sub_data = data[i];
            var is_primary = sub_data.name == search.replace("r/", "");
            var orb;

            if(this.orbs.hasOwnProperty(sub_data.name)) {
                orb = this.orbs[sub_data.name];
            }
            else {
                orb = new Orb(i, sub_data, is_primary);
                
                if(!is_primary) {
                    this.fetch_subs(orb);
                }
                else {
                    orb.subs = data;
                }
            }
            newOrbs[sub_data.name] = orb;
        }
        this.remove_prev_orbs(newOrbs);
        this.orbs = newOrbs;
        this.create_all_springs();
    },
    fetch: async function(search, push_history) {
        this.display_message_func("fetching data for " + search);
        if(push_history) {
            this.push_history_func(search);
        }
        if(this.orbs[search] != undefined) {
            this.init(search, this.orbs[search].subs);
        } 
        else {
            try {
                let resp = await utils.data_fetch(search);
                if(resp.message !== undefined) {
                    this.display_message_func(resp.message);
                }
                if(resp.data) {
                    this.init(search, resp.data);
                }
            }
            catch(err) {
                console.log(err);
                this.display_message_func("Couldn't retrieve any data for " + search)
            }
        }
    },
    create_spring: function(orb, otherOrb) {

        if(otherOrb.name == orb.name || otherOrb.subs == undefined) return;

        var ma = orb.get_mutual_attraction(otherOrb);
        if(ma !== undefined) {

            console.log(orb.name + " " + otherOrb.name + " " + ma);
            var springlength = Math.max(min_mutual_dist, (max_mutual_count) - ma) * mutual_dist_multiplier;
            var s = new Spring(orb.body, otherOrb.body, springlength, spring_strength);
            this.springs.push(s);
        }
    },
    create_all_springs: function() {
        var names = Object.keys(this.orbs);
        for(var i=0; i<names.length; i++) {
            for(var j=i+1; j<names.length; j++) {
                this.create_spring(this.orbs[names[i]], this.orbs[names[j]]);
            }
        }
    },
    fetch_subs: async function(orb) {

        try {
            let resp = await utils.data_fetch("r/" + orb.name);
            if(resp.data) {
                orb.subs = resp.data;
                for(let otherOrb of Object.values(this.orbs)) {
                    this.create_spring(orb, otherOrb);
                }
                orb.add();
            }
        }
        catch(err) {
            console.log(err);
        }
    },

    remove_prev_orbs: function(newOrbs) {
        var deleteOrbs = [];
        for(let orb of Object.values(this.orbs)) {
            if(!newOrbs.hasOwnProperty(orb.name)) {
                deleteOrbs.push(orb);
            }
        }
        for(var i=0; i<deleteOrbs.length; i++) {
            deleteOrbs[i].remove();
        }
    },

    find_orb: function(mx, my) {
        var offset = this.center_offset();
        mx = mx - offset[0];
        my = (1.0 - my) - offset[1];
        var closest = min_hover_dist * min_hover_dist;
        var closestOrb;
        for(let orb of Object.values(this.orbs)) {
            var d = utils.distanceSqrd(orb.body.position, {x:mx, y:my});
            if(d < closest) {
                closest = d;
                closestOrb = orb;
            }
        }
        return closestOrb
    },
    mouse_over: function(mx, my) {
        for(let orb of Object.values(this.orbs)) {
            orb.set_text_color("white");
        }
        var closestOrb = this.find_orb(mx, my);
        if(closestOrb) {
            closestOrb.set_text_color(highlight_color);
        }
    },
    mouse_click: function(mx, my) {
        var closestOrb = this.find_orb(mx, my);
        if(closestOrb) {
            this.fetch("r/" + closestOrb.name, true);
        }
    },
    center_offset: function() {
        return [0.5-this.bb.center.x, 0.5-this.bb.center.y];
    },
    camera_matrix: function() {

        var mat = [];

        mat4.identity(mat);

        mat4.translate(mat, mat, [
            -1.0, -1.0, 0.0
        ]);
        mat4.scale(mat, mat, [
            2.0, 2.0, 1.0
        ]);
        
        mat4.scale(mat, mat, [
            graphics.screen_config.ratio, 
            1.0, 
            0.0001
        ]);
        var t = this.center_offset();
        t.push(0.0);
        mat4.translate(mat, mat, t);
        return mat;
    },
    render: function() {

        for(var i=0; i<this.springs.length; i++) {
            this.springs[i].update();
        }
        Matter.Engine.update(physicsEngine, 1000 / 60);

        var drawArray = [];
        this.bb = new utils.BoundingBox();
        for(let orb of Object.values(this.orbs)) {
            this.bb.add(orb.body.position);
        }

        var cam_matrix = this.camera_matrix();
        for(let orb of Object.values(this.orbs)) {

            if(!orb.added) continue;
            drawArray.push({
                model_matrix: orb.world_matrix(),
                view_matrix: cam_matrix,
                depth:orb.radius,
                color:orb.color,
                border_size: (border_size / graphics.screen_config.scale) / orb.radius
            });
            orb.move_text(this.center_offset(), graphics.screen_config.scale);
        }
        return drawArray;
    }
}

var orbManager = new OrbManager();

module.exports.orbManager = orbManager;

