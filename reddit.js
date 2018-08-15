const NameCountList = require("./name_count").NameCountList;
const https = require('./http_module');

const thisIsReddit = 'https://www.reddit.com/';
const count_users = 100;

User = function(name, comments) {
  this.name = name;
  this.num_comments = comments;
}
User.prototype = {
  getUrl: function(name) {
    return thisIsReddit + "user/" + name + "/.json";
  },
  asyncProcess: function() {
    
    var obj = this;

    return new Promise(function(resolve, reject) {
      
      https.GetUrlPromise(obj.getUrl(obj.name)).then(comment_list => {
       resolve(obj.parseSubreddits(comment_list)); 
      }).catch(err => {
        reject(err.message);
      });
    });
  },
  parseSubreddits: function(comment_list) {

    var subreddit_freq = new NameCountList();

    console.log("recv " + this.getUrl(this.name));

    if(comment_list.data === undefined) {
      return;
    }

    var children = comment_list.data.children;
    if(children !== undefined) {
      for(var i=0; i<children.length; i++) {
        var subreddit = children[i].data.subreddit;
        subreddit_freq.add(subreddit, 1);
      }
    }
    return subreddit_freq;
  }
}
Comment = function(user) {
  this.user = user;
}
Comment.prototype = {

}
var IsComment = function(data) {
  if(data.author != undefined &&
      data.author != "[deleted]" && 
      data.body != undefined) {
        return true;
      }
  return false;
}

Thread = function(permalink) {

  // console.log("Init " + permalink);

  this.permalink = permalink;
  this.userFreq = new NameCountList();

}
Thread.prototype = {

  getUrl: function() {
    return thisIsReddit + this.permalink + '/.json'
  },
  parseComments: function(comment_tree) {

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
        resolve(obj.parseComments(comment_tree));
      }).catch(function (err) {
        reject(err.message);
      });
    })
  },
  recurseData: function(data) {

    if(IsComment(data)) {
      this.userFreq.add(data.author, 1);
    }
    
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
  this.userFreq = new NameCountList();
}
Subreddit.prototype = {

  getUrl: function(title) {
    return thisIsReddit + "r/" + title + '/.json?limit=200';
  },
  asyncProcess: function() {

    https.GetUrlPromise(this.getUrl(this.title)).then(response => {
      this.parseThreads(response);
    })
    .catch(function(err) {
      console.log(err.message);
    });
  },
  parseThreads: function(response) {
    
    console.log('got ' + this.title + " t=" + response.data.children.length);
  
    var threadParseList = [];
    for(var i=0; i<response.data.children.length; i++) {
      var child = response.data.children[i];
  
      var thread = new Thread(child.data.permalink);
      threadParseList.push(thread.asyncProcess());
    }
    Promise.all(threadParseList).then(userFrequencies => {
      this.enumerateUserSubreddits(
        this.enumerateUsersOfThreads(userFrequencies)
      );
    });
  },
  enumerateUserSubreddits(user_list) {
    var count = user_list.length < count_users ? user_list.length : count_users;
    var userParseList = [];
    for(var i=0; i<count; i++) {
      var user = new User(user_list[i].name, user_list[i].count);
      userParseList.push(user.asyncProcess());
    }
    Promise.all(userParseList).then(user_subs => {
      var mergeSubredditList = new NameCountList();
      for(var i=0; i<user_subs.length; i++) {
        if(user_subs[i] !== undefined) {
          mergeSubredditList.merge(user_subs[i]);
        }
      }
      var sortedSubs = mergeSubredditList.get_sorted();
      console.log("user subs");
    })
  },
  enumerateUsersOfThreads: function(userFrequencies) {
    var userList = new NameCountList();
    for(var i=0; i<userFrequencies.length; i++) {
      userList.merge(userFrequencies[i]);
    }
    return userList.get_sorted()
  }
}

module.exports.Subreddit = Subreddit;
module.exports.Thread = Thread;
