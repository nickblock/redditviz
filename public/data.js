
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

var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies;
// create an engine
var physicsEngine = Matter.Engine.create();

var OrbManager = function(fnc) {
    
    this.orbs = {};
    this.maxradius = 0.0;
    this.display_message_func;
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

    center: function(name, data) {
        
        this.orbs = {};
        var count = Math.min(data.length, chart_item_max);
        for(var i=1; i<count; i++) {

            var dataItem = data[i];
            var body = Bodies.circle(
                i * (screenSize[0]/count),
                Math.random() * screenSize[1],
                data[i].count
            )
            World.add(physicsEngine.world, body);
            this.orbs[data[i].name] = body;
            if(data[i].count > this.maxradius) {
                this.maxradius = data[i].count;
            }
        }
    },
    append: function(data) {

    },
    render: function() {
        
        Engine.update(physicsEngine, 1000 / 60);

        var drawArray = [];
        for(let orb of Object.values(this.orbs)) {
            drawArray.push({offset:[orb.position.x, orb.position.y], scale:orb.circleRadius});
        }
        return drawArray;
    }
}


orbManager = new OrbManager();

