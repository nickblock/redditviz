const https = require("https");
const reddit = require("./reddit");


subreddit = new reddit.Subreddit('unitedkingdom');

subreddit.asyncProcess();

console.log("sync out");