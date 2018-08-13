const https = require('./http_module');
const thisIsReddit = 'https://www.reddit.com/';


User = function(name, comments) {
  this.name = name;
  this.num_comments = comments;
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

}
Thread.prototype = {

  getUrl: function() {
    return thisIsReddit + this.permalink + '/.json'
  },
  parse: function(comment_tree) {

    var children = comment_tree[1].data.children;
    for(var i=0; i<children.length; i++) {
      this.recurseData(children[i].data);
    }
    return this.userFreq;
  },
  asyncProcess: function() {

    var obj = this;

    return new Promise(function(resolve, reject) {
      
      https.GetUrlPromise(obj.getUrl()).then(comment_tree => {
        resolve(obj.parse(comment_tree));
      }).catch(function (err) {
        reject(err.message);
      });
    })
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
  this.userFreq = {};

  this.parse();
}
Subreddit.prototype = {

  getUrl: function() {
    return thisIsReddit + "r/" + this.title + '/.json?limit=200';
  },
  parse: function() {
    https.GetUrlPromise(this.getUrl()).then(response => {

      console.log('got ' + this.title + " t=" + response.data.children.length);

      var threadParseList = [];
      for(var i=0; i<response.data.children.length; i++) {
        var child = response.data.children[i];

        var thread = new Thread(child.data.permalink);
        threadParseList.push(thread.asyncProcess());
        this.threads.push(thread);
      }
      Promise.all(threadParseList).then(userFrequencies => {
        this.enumerateUsersOfThreads(userFrequencies);
      })
    })
    .catch(function(err) {
      console.log(err.message);
    });
  },
  sortUsersByComment: function(userFreq) {

    var sortedUsers = [];
    var names = Object.keys(userFreq);
    for(var i=0; i<names.length; i++) {
      var user = userFreq[names[i]];
      var inserted = false;
      for(var j=0; j<sortedUsers.length; j++) {
        if(user.num_comments > sortedUsers[j].num_comments) {
          sortedUsers.splice(j, 0, user);
          inserted = true;
          break;
        }
      }
      if(!inserted) {
        sortedUsers.push(user);
      }
    }
    console.log("Num Users " + sortedUsers.length);
  },
  enumerateUsersOfThreads: function(userFrequencies) {
    var userList = {};
    for(var i=0; i<userFrequencies.length; i++) {
      var userFreq = userFrequencies[i];
      var userNames = Object.keys(userFreq);
      for(var j=0; j<userNames.length; j++) {
        var name = userNames[j];
        if(userList.hasOwnProperty(name)) {
          userList[name].num_comments += userFreq[name];
        }
        else {
          userList[name] = new User(name, userFreq[name]);
        }
      }
    }
    this.sortUsersByComment(userList);
  }
}

module.exports.Subreddit = Subreddit;
module.exports.Thread = Thread;
