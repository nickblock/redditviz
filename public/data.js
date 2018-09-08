
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

// create an engine
var physicsEngine = Matter.Engine.create();
physicsEngine.world.gravity.scale = 0.0;

var size_scale = 0.1;
var max_item_count = 12;
var spring_strength = 0.0000001;
var mutual_dist_multiplier = 0.2;
var body_friction = 0.1;

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
            frictionAir: body_friction
        }
    )
    Matter.World.add(physicsEngine.world, body);
    
    this.body = body;
    this.name = data.name;
    this.subs = undefined;

    if(primary) {
        this.subs = data;
    }
}
Orb.prototype = {
    get_mutual_attraction: function(otherSub) {
        var other_attr = otherSub.get_attraction(this.name);
        if(other_attr !== undefined) {
            var attr = this.get_attraction(otherSub.name);
            if(attr !== undefined) {
                var mutual = Math.min(other_attr, attr);
                mutual = Math.max(0, mutual - Math.abs(other_attr - attr));

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
    }

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

var OrbManager = function() {
    
    this.orbs = {};
    this.display_message_func;
    this.springs = [];
}
OrbManager.prototype = {

    fetch: async function(search) {
        if(orbs[search] != undefined) {
            this.center(search);
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
                this.display_message_func("Couldn't retrieve data for " + search)
            }
        }
    },
    fetch_subs: async function(orb) {

        try {
            let resp = await data_fetch("r/" + orb.name);
            if(resp.data) {
                orb.subs = resp.data;

                for(otherOrb of Object.values(this.orbs)) {
                    if(otherOrb.name == orb.name || otherOrb.subs == undefined) continue;

                    var ma = orb.get_mutual_attraction(otherOrb);
                    if(ma !== undefined) {
                        var springlength = (screenSize[0]* mutual_dist_multiplier) - ma;
                        console.log("ma " + ma);
                        var s = new Spring(orb.body, otherOrb.body, springlength, spring_strength);
                        this.springs.push(s);
                    }
                }
            }
        }
        catch(err) {
            console.log(err);
        }
    },

    center: function(name, data) {
        
        this.orbs = {};
        var count = Math.min(data.length, max_item_count);
        for(var i=0; i<count; i++) {
            var isPrimary = data[i].name == name.replace("r/", "");
            var orb = new Orb(data[i], isPrimary);
            if(!isPrimary) {
                this.fetch_subs(orb);
            }
            orb.body.collisionFilter = 1 << i;
            this.orbs[data[i].name] = orb;
        }
    },
    render: function() {

        for(var i=0; i<this.springs.length; i++) {
            this.springs[i].update();
        }
        Matter.Engine.update(physicsEngine, 1000 / 60);

        var drawArray = [];
        for(let orb of Object.values(this.orbs)) {
            drawArray.push({offset:[orb.body.position.x, orb.body.position.y], scale:orb.body.circleRadius});
        }
        return drawArray;
    }
}


orbManager = new OrbManager();

