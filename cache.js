var redis = require("redis");


Cache = function() {
    this.redis_client = undefined;
    this.Connect();
}
Cache.prototype = {
    Connect: function() {
        this.redis_client = redis.createClient(global.config.redis_port, 'localhost');
        this.redis_client.on('error', function(err) {
            console.log("no redis");
            this.redis_client.quit();
            this.redis_client = null;
        });
    },
    Get: function(key, timeout) {

        var This = this;
        return new Promise(function(resolve, reject) {
            This.redis_client.get(key, function(error, result) {
                result = JSON.parse(result);
                if(error || !result) {
                    reject("redis: no data for " + key);
                }
                else {
                    resolve(result);
                }
            });
        });

    },
    Push: function(key, data) {

        var dataStore = {
            time: Date.now(),
            data: data
        }
        this.redis_client.set(key, JSON.stringify(dataStore));
    },
    Flush: function() {
        this.redis_client.flushdb();
    },
    Increment: async function(key) {
        this.redis_client.incr(key + "_count");
    },
    Count: function(key) {
        var This = this;
        return new Promise(function(resolve, reject) {
            This.redis_client.get(key + "_count", function(error, result) {
                if(error) {
                    resolve(0);
                }
                else {
                    resolve(result);
                }
            });
        });
    }
}

var CheckTime = function(data, timeout) {
    if(timeout < 0) {
        return true;
    }
    var time_diff = Date.now() - data.time; 
    if(time_diff > timeout) {
        return false;
    }
    else {
        return true;
    }
}

var TheCache;
var GetCache = function() {
    if(!TheCache) {
        TheCache = new Cache();
    }
    return TheCache
}

module.exports.GetCache = GetCache;
module.exports.CheckTime = CheckTime;