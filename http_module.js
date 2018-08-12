const https = require('https');
const fs = require('fs');


const cache_dir = "cache/"
var convSlashToSpace = function(url) {
    return url.replace(/[\/\.?:=]+/g, "_");
}

var getcacheDir = function() {
    return cache_dir;
}
var getCacheFilePath = function(url) {
    return getcacheDir() + convSlashToSpace(url) + ".txt";
}
module.exports.GetUrlPromise = function(url) {

    return new Promise(function(resolve, reject) {
        
        var cache_file = getCacheFilePath(url);
        if(fs.exists(cache_file, function(exists) {
            if(exists) {
                resolve(JSON.parse(fs.readFileSync(cache_file)));
                return;
            }
            else {
                https.get(url, (resp) => {
                    let data = ''
                
                    resp.on('data', (chunk) => {
                        data += chunk;
                    })
                    
                    resp.on('end', () => {
                        fs.writeFileSync(cache_file, data);
                        resolve(JSON.parse(data));
                    });
                
                    }).on("error", (err) => {
                    re1ect(err);
                    });
            }
        }));
    })   
}