
var create_url_from_search = function(search) {
    return "/" + search;
}
var data_fetch = async function(search) {

    return new Promise(function(resolve, reject) {

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                try {
                    var resp = JSON.parse(this.response);
                    resolve(resp);
                }
                catch (err) {
                    reject(err)
                }
            }
        };
        var url = create_url_from_search(search);
        xhttp.open("GET", url+".json", true);
        xhttp.send();
    });
}

var distanceSqrd = function(v1, v2) {
    var d = {
        x: v1.x - v2.x,
        y: v1.y - v2.y
    }
    return d.x*d.x + d.y*d.y;
}
var distance = function(v1, v2) {
    return Math.sqrt(distanceSqrd(v1, v2));
}

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

var physicsEngine = Matter.Engine.create();
physicsEngine.world.gravity.scale = 0.0;

var size_scale = 0.25;
var max_item_count = 15;
var spring_strength = 0.000001;
var mutual_dist_multiplier = 0.2;
var body_friction = 0.01;
var body_mass = 10;
var min_hover_dist = 200;
var highlight_color = "red"
var index = 0;

var Orb = function(data, primary) {
    var xpos, ypos;
    xpos = screenSize[0]/2.0;
    ypos = screenSize[1]/2.0;
    if(!primary) {

        //distribute orbs randomly around center of screen to start
        xpos -= screenSize[0] * mutual_dist_multiplier * 0.5;
        ypos -= screenSize[1] * mutual_dist_multiplier * 0.5;
        xpos += Math.random() * screenSize[0] * mutual_dist_multiplier;
        ypos += Math.random() * screenSize[1] * mutual_dist_multiplier;

    }
    var body = Matter.Bodies.circle(
        xpos, ypos,
        data.count * size_scale, {
            frictionAir: body_friction,
            mass: body_mass
        }
    )
    Matter.World.add(physicsEngine.world, body);
    
    this.body = body;
    this.name = data.name;
    this.subs = undefined;

    if(primary) {
        this.subs = data;
    }
    this.div = document.createElement("div");
    this.text = document.createTextNode(this.name);
    this.div.appendChild(this.text);
    this.div.style.position = "absolute";
    this.div.style.zIndex = 1
    document.body.appendChild(this.div);
}
Orb.prototype = {
    get_mutual_attraction: function(otherSub) {
        var other_attr = otherSub.get_attraction(this.name);
        if(other_attr !== undefined) {
            var attr = this.get_attraction(otherSub.name);
            if(attr !== undefined) {
                var mutual = Math.min(other_attr, attr);
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
        var v = 0;
        for(var i=0; i<this.subs.length; i++) {
            if(this.subs[i].name == sub_name) {
                v = this.subs[i].count;
                break;
            }
        }
        return v;
    },
    move_text: function() {
        this.div.style.left = this.body.position.x + "px";
        this.div.style.bottom = this.body.position.y + "px";
    },
    set_text_color: function(color) {
        this.div.style.color = color;
    },
    remove: function() {
        document.removeChild(this.div);
        Matter.World.remove(physicsEngine.world, this.body);
    }

}

var OrbManager = function() {
    
    this.orbs = {};
    this.display_message_func;
    this.push_history_func;
    this.springs = [];
}
OrbManager.prototype = {

    fetch: async function(search, push_history) {
        if(push_history) {
            this.push_history_func(search);
        }
        if(orbs[search] != undefined) {
            this.center(search, orbs[search].subs);
        } 
        else {
            try {
                let resp = await data_fetch(search);
                if(resp.message !== undefined) {
                    this.display_message_func(resp.message);
                }
                if(resp.data) {
                    this.center(search, resp.data);
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
            var springlength = (screenSize[0]* mutual_dist_multiplier) - ma;
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
            let resp = await data_fetch("r/" + orb.name);
            if(resp.data) {
                orb.subs = resp.data;
                for(let otherOrb of Object.values(this.orbs)) {
                    this.create_spring(orb, otherOrb);
                }
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

    center: function(search, data) {
        this.springs = [];
        var newOrbs = {};
        var count = Math.min(data.length, max_item_count);
        for(var i=0; i<count; i++) {
            var dataItem = data[i];
            var isPrimary = dataItem.name == search.replace("r/", "");
            var orb;
            if(this.orbs.hasOwnProperty(dataItem.name)) {
                orb = this.orbs[dataItem.name];
            }
            else {
                orb = new Orb(dataItem, isPrimary);
                orb.color = colors[i%colors.length];
                if(!isPrimary) {
                    this.fetch_subs(orb);
                }
            }
            //prevent collisions
            orb.body.collisionFilter = 1 << i;
            newOrbs[dataItem.name] = orb;
        }
        this.remove_prev_orbs(newOrbs);
        this.orbs = newOrbs;
        this.create_all_springs();
    },
    find_orb: function(mx, my) {
        var closest = min_hover_dist * min_hover_dist;
        var closestOrb;
        for(let orb of Object.values(this.orbs)) {
            var d = distanceSqrd(orb.body.position, {x:mx, y:screenSize[1]-my});
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
    render: function() {

        for(var i=0; i<this.springs.length; i++) {
            this.springs[i].update();
        }
        Matter.Engine.update(physicsEngine, 1000 / 60);

        var drawArray = [];
        for(let orb of Object.values(this.orbs)) {
            drawArray.push({
                offset:[orb.body.position.x, orb.body.position.y], 
                scale:orb.body.circleRadius,
                color:orb.color
            });
            orb.move_text();
        }
        return drawArray;
    }
}


orbManager = new OrbManager();

