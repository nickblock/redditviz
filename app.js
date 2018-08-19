var express = require('express')
var app = express();
var http = require('http').Server(app);
const reddit = require("./reddit");

var server_port = 3000;

app.get("/r/:id", function(req, res) {

    var sub = new reddit.Subreddit(req.params.id);
    sub.getSubreddits().then(subreddits => {
        res.json(subreddits);
    });
});

app.get("/u/:id", function(req, res) {
    
    var user = new reddit.User(req.params.id);
    user.getSubreddits().then(subreddits => {
        res.json(subreddits);
    });
});

app.get("/", function(req, res) {
    res.json({yo: "redditviz"});
});

console.log('listen port ' + server_port);

http.listen(server_port, function() {} );

