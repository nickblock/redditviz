const express = require('express')
const app = express();
const http = require('http').Server(app);
const path = require('path');
const fs = require('fs');
const reddit = require("./reddit");
const cache = require("./cache");
const chart = require("./chart");

global.config = JSON.parse(fs.readFileSync("config.json"));

cache.GetCache();

var remove_json = function(input) {
    if(input.endsWith(".json")) {
        return input.substring(0, input.length-5);
    }
    return undefined;
}
var re = /^[\w_]{3,20}$/;
var valid_redditname = function(input) {
    return re.exec(input);
}
var is_valid_input = function(input) {
    input = remove_json(input);
    if(input && valid_redditname(input)) {
        return input;
    }
    return undefined;
}
var return_html = function(res) {
    res.sendFile(path.join(__dirname + '/public/chart.html'));
}

var title_styling = function(input) {
    return input;
}
var subreddit_message = function(input) {
    return title_styling("This graph shows the other most commented on subreddits by the users of " + input)
}
var user_message = function(input) {
    return title_styling("Most commented on subreddits of user " + input);
}
app.get("/r/:id", function(req, res) {

    var input = is_valid_input(req.params.id);

    if(input) {

        var sub = new reddit.Subreddit(input);
        sub.getSubredditsCached().then(subreddits => {
            res.json({  chart: chart.Create(input, subreddits),
                        message: subreddit_message(input) }       
            );
        })
        .catch(err => {
            res.json({message: title_styling("subreddit " + input + " not found")});
        });
    }
    else {
        return_html(res);
    }

});

app.get("/u/:id", function(req, res) {
    
    var input = is_valid_input(req.params.id);

    if(input) {

        var user = new reddit.User(input);
        user.getSubreddits().then(subreddits => {
            res.json({  chart: chart.Create(input, subreddits),
                        message: user_message(input) }
            );
        })
        .catch(err => {
            res.json({message: title_styling("user " + input + " not found")});
        });
    }
    else {
        return_html(res);
    }
});

app.get("/", function(req, res) {
    return_html(res);
});


app.use(express.static(__dirname + "/public")); 

http.listen(global.config.listen_port, function() {} );
console.log('listen port ' + global.config.listen_port);

