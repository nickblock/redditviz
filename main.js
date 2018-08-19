const https = require("https");
const reddit = require("./reddit");


subreddit = new reddit.Subreddit('britishproblems');
subreddit.printSortedSubs();

// user = new reddit.User("sega_gamegear");
// user.printSubreddits();