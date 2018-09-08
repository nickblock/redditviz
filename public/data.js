
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

var DataManager = function(display_func) {
    this.reddits = [];
    this.display_message_func = display_func;
}
DataManager.prototype = {
    add: function(name, data) {
        this.reddits[name] = data;
    },

    fetch: async function(search) {

        this.display_message_func("Fetching " + search);
        if(this.reddits[search] !== undefined) {
            TheOrbManager.create(this.reddits[search]);
        }
        else {
            try {
                let resp = await data_fetch(search);
                if(resp.message !== undefined) {
                    this.display_message_func(resp.message);
                }
                if(resp.data) {
                    
                    TheOrbManager.create(resp.data);

                    this.reddits[search] = resp.data;
    
                    for(var i=0; i<resp.data.length; i++) {
                        this.fetch_subs("r/"+resp.data[i].name);
                    }
                }
            }
            catch(err) {
                this.display_message_func("Couldn't retrieve data for " + search)
            }
        }
    },
    fetch_subs: async function(search) {

        if(this.reddits[search] !== undefined) {
            TheOrbManager.append(this.reddits[search]);
        }
        else {
            try {
                let resp = await data_fetch(search);
                if(resp.data) {
                    TheOrbManager.append(resp.data);
                }
            }
            catch(err) {

            }
        }
    }
}