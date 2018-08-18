const https = require("https");
const reddit = require("./reddit");


subreddit = new reddit.Subreddit('britishproblems');

subreddit.printSortedSubs();

console.log("sync out");