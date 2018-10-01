




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

var BoundingBox  = function() {
  this.center = { x:0, y:0 };
  this.max;
  this.min;
}
BoundingBox.prototype = {
  add: function(v) {
    if(this.max == undefined) {
      this.max = {x:v.x, y:v.y};
    }
    else {
      if(this.max.x < v.x) {
        this.max.x = v.x;
      }
      if(this.max.y < v.y) {
        this.max.y = v.y;
      }
    }
    if(this.min == undefined) {
      this.min = {x:v.x, y:v.y};
    }
    else {
      if(this.min.x > v.x) {
        this.min.x = v.x;
      }
      if(this.min.y > v.y) {
        this.min.y = v.y;
      }
    }
    this.center.x = ((this.max.x - this.min.x)/2.0) + this.min.x;
    this.center.y = ((this.max.y - this.min.y)/2.0) + this.min.y;
  }
}


module.exports = {
  create_url_from_search: create_url_from_search,
  data_fetch: data_fetch,
  distanceSqrd: distanceSqrd,
  distance: distance,
  BoundingBox: BoundingBox
};