const https = require('https');

const thisIsReddit = 'https://www.reddit.com/';

GetUrlPromise = function(url) {
  return new Promise(function(resolve, reject) {

    https.get(url, (resp) => {
      let data = ''

      resp.on('data', (chunk) => {
        data += chunk;
      })
      
      resp.on('end', () => {
        resolve(JSON.parse(data));
      });

    }).on("error", (err) => {
      re1ect(err);
    });
  })
}
User = function() {

}
Comment = function(user) {
  this.user = user;
}
Comment.prototype = {

}
var IsComment = function(data) {
  if(data.author != undefined &&
      data.body != undefined) {
        return true;
      }
  return false;
}

Thread = function(permalink) {

  // console.log("Init " + permalink);

  this.permalink = permalink;
  this.comments = [];
  this.userFreq = {};

  this.parse();

}
Thread.prototype = {

  getUrl: function() {
    return thisIsReddit + this.permalink + '/.json'
  },
  parse: function() {
    GetUrlPromise(this.getUrl()).then(response => {

      var children = response[1].data.children;
      for(var i=0; i<children.length; i++) {
        this.recurseData(children[i].data);
      }

      if(this.comments.length>10) {
        console.log(this.permalink + " comments: " + this.comments.length);
      }
    }).catch(function (err) {
      console.log(err.message);
    });
  },
  recurseData: function(data) {

    if(IsComment(data)) {
      var comment = new Comment(data.author);
      this.comments.push(comment);
      if(this.userFreq.hasOwnProperty(comment.user)) {
        this.userFreq[comment.user]++;
      }
      else {
        this.userFreq[comment.user] = 1;
      }
    }

    // var children = data.replies;
    if(data.replies != undefined && data.replies != "") {
      var children = data.replies.data.children;
      for(var i=0; i<children.length; i++) {
        this.recurseData(children[i].data);
      }
    }
  }

}

Subreddit = function(title) {

  this.title = title;
  this.threads = [];

  this.parse();
}
Subreddit.prototype = {

  getUrl: function() {
    return thisIsReddit + "r/" + this.title + '/.json?limit=200';
  },
  parse: function() {
    GetUrlPromise(this.getUrl()).then(response => {

      console.log('got ' + this.title + " t=" + response.data.children.length);

      for(var i=0; i<response.data.children.length; i++) {
        var child = response.data.children[i];

        var threadLink = child.data.permalink;

        this.threads.push(new Thread(threadLink))

      }
    })
    .catch(function(err) {
      console.log(err.message);
    });
  }
}

module.exports.Subreddit = Subreddit;
module.exports.Thread = Thread;
