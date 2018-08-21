var express = require('express')
var app = express();
var http = require('http').Server(app);
var path = require('path');
var validator = require("validator");
const reddit = require("./reddit");
const html = require("./html.js")

var server_port = 3000;

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

var subreddit_message = function(input) {
    return "This graph shows the most commented on subreddits by users of " + input;
}
var user_message = function(input) {
    return "Most commneted on subreddits of user " + input;
}
app.get("/r/:id", function(req, res) {

    var input = is_valid_input(req.params.id);

    if(input) {

        var sub = new reddit.Subreddit(input);
        sub.getSubreddits().then(subreddits => {
            res.json({chart: subreddits.to_chart_js(input),
                    message: subreddit_message(input) }
            );
        })
        .catch(err => {
            res.json({message: "subreddit " + input + " not found"});
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
            res.json({chart: subreddits.to_chart_js(input),
                message: user_message(input) }
            );
        })
        .catch(err => {
            res.json({message: "user " + input + " not found"});
        });
    }
    else {
        return_html(res);
    }
});

app.get("/", function(req, res) {
    res.json({yo: "redditviz"});
});

console.log('listen port ' + server_port);

app.use(express.static(__dirname + "/public")); 

http.listen(server_port, function() {} );

