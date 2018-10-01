




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


module.exports = {
  create_url_from_search: create_url_from_search,
  data_fetch: data_fetch,
  distanceSqrd: distanceSqrd,
  distance: distance
};