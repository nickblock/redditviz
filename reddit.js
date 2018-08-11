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
  this.userFreq = [];

  this.parse();

}
Thread.prototype = {

  getUrl: function() {
    return thisIsReddit + this.permalink + '/.json'
  },
  parse: function() {
    GetUrlPromise(this.getUrl()).then(response => {

      this.recurseData(response[1].data);

      console.log(this.permalink + " comments: " + this.comments.length);
    }).catch(function (err) {
      console.log(err.message);
    });
  },
  recurseData: function(data) {

    if(IsComment(data)) {
      var comment = new Comment(data.author);
      this.comments.push(comment);
      this.userFreq[comment.user]++;
    }
    if(data.children != undefined) {
      for(var i=0; i<data.children.length; i++) {
        if(data.children[i].data != undefined) {
          this.recurseData(data.children[i].data);
        }
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
    return thisIsReddit + "r/" + this.title + '/.json';
  },
  parse: function() {
    GetUrlPromise(this.getUrl()).then(response => {

      console.log('got ' + this.title);

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
