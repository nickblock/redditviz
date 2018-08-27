const fs = require('fs');
const fetch = require("node-fetch");

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

var doGet = async function(url) {

    try {
        const response = await fetch(url);
        const json_data = await response.json();
    
        if(json_data.error == 400) {
            throw new Error(json_data.message);
        }
        fs.writeFileSync(getCacheFilePath(url), JSON.stringify(json_data));
        return (json_data);
    }
    catch (err) {
        throw new Error(err.message)
    }

}

module.exports.GetUrl = async function(url) {

    try {
        return JSON.parse(
            fs.readFileSync(
                getCacheFilePath(url)));
    }
    catch (err) {
        return await doGet(url);
    }
}