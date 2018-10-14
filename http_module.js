const fs = require('fs');
const https = require("https");
const validUrl = require('valid-url');

const cache_dir = "cache/"
var convSlashToSpace = function(url) {
    return url.replace(/[\/\.?:=]+/g, "_");
}

var getcacheDir = function() {
    return global.config.cache_dir;
}

var getCacheFilePath = function(url) {
    return getcacheDir() + convSlashToSpace(url) + ".txt";
}

var doGet = async function(url) {


    return new Promise(function(resolve, reject) {
        if(!validUrl.isUri(url)) {
            reject("not valid url : " + url)
        } 
        https.get(url.replace("https://", ""), (resp) => {
            let data = '';

              // A chunk of data has been recieved.
              resp.on('data', (chunk) => {
                data += chunk;
              });
              resp.on('end', () => {
                const json_data = JSON.parse(data);

                if(json_data.error == 400) {
                    reject("http get failed for " + url + "\n\n" + json_data.message);
                    return;
                }
                if(global.config.http_response_cache) {
                    fs.writeFileSync(getCacheFilePath(url), JSON.stringify(json_data));
                }

                resolve(json_data);
              });
        }).on("error", (err) => {
            reject(err);
        });  
    });
}

var doGetWithCache = async function(url) {

    try {
        return JSON.parse(
            fs.readFileSync(
                getCacheFilePath(url)));
    }
    catch (err) {
        return await doGet(url);
    }
}

module.exports.GetUrl = async function(url) {

    if(global.config.http_response_cache) {
        return await doGetWithCache(url);
    }
    else {
        return await doGet(url);
    }
}