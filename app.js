var express = require('express')
var app = express();
var http = require('http').Server(app);
const reddit = require("./reddit");

var server_port = 3000;

app.get("/r/:id", function(req, res) {
    res.json({reddit: req.params.id});
});

app.get("/u/:id", function(req, res) {
    res.json({user: req.params.id});
});

app.get("/", function(req, res) {
    res.json({yo: "redditviz"});
});

console.log('listen port ' + server_port);

http.listen(server_port, function() {} );

