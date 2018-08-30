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
                if(error || !result || !CheckTime(result, timeout)) {
                    reject("redis: no data for " + key);
                }
                else {
                    resolve(result.data);
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

var TheCache = undefined;
var GetCache = function() {
    if(!TheCache) {
        TheCache = new Cache();
    }
    return TheCache
}

module.exports.GetCache = GetCache;
module.exports.CheckTime = CheckTime;