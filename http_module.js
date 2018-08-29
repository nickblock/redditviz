const fs = require('fs');
const fetch = require("node-fetch");

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

    try {
        const response = await fetch(url);
        const json_data = await response.json();
    
        if(json_data.error == 400) {
            throw new Error(json_data.message);
        }
        if(global.config.http_response_cache) {
            fs.writeFileSync(getCacheFilePath(url), JSON.stringify(json_data));
        }
        return (json_data);
    }
    catch (err) {
        throw new Error(err.message)
    }

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