const https = require('https');
const fs = require('fs');
const validUrl = require('valid-url')

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
        
        if(!validUrl.isUri(url)) {
            reject("Invalid URL");
            return;
        }
        var cache_file = getCacheFilePath(url);
        try {
            resolve(JSON.parse(fs.readFileSync(cache_file)));
            return;
        }
        catch (err) {
            https.get(url, (resp) => {
                let data = ''
                
                resp.on('data', (chunk) => {
                    data += chunk;
                })
                
                resp.on('end', () => {
                    try {
                        var json_data = JSON.parse(data); 
                        if(json_data.error == 400) {
                            reject(json_data.message);
                            return;
                        }
                        resolve(json_data);
                        fs.writeFileSync(cache_file, data);
                    }
                    catch (err) {
                        reject(err.message);
                    }
                });
            
            }).on("error", (err) => {
                re1ect(err);
            });
        }
    });
}