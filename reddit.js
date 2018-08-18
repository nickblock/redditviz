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
  asyncProcess: async function() {
    
    try {
      let user_comments = await https.GetUrlPromise(this.getUrl(this.name));
      let subreddits = this.parseSubreddits(user_comments);

      return subreddits;
    }
    catch (err) {
      console.log(err.message);
    }
  },
  parseSubreddits: function(comment_list) {

    var subreddit_freq = new NameCountList();

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

var IsComment = function(data) {
  if(data.author != undefined &&
      data.author != "[deleted]" && 
      data.body != undefined) {
        return true;
      }
  return false;
}

Thread = function(permalink) {

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
  this.sortedSubs = undefined;
}
Subreddit.prototype = {

  getUrl: function(title) {
    return thisIsReddit + "r/" + title + '/.json?limit=200';
  },
  asyncProcess: async function() {

    try {
      //Fetch this subreddits main thread page
      let response = await https.GetUrlPromise(this.getUrl(this.title));
      //parse all the user comments of those threads, totalling up the users by frequency of comments
      let userFrequencies = await this.parseThreads(response);
      let enumUsers = this.enumerateUsersOfThreads(userFrequencies);
      //go through each user, totalling up thier comments on other subreddits
      let userSubreddits = await this.enumerateUserSubreddits(enumUsers);
      //merge those subreddits into a frequency count
      let mergeSubredditList = this.mergeUserSubreddits(userSubreddits);
      
      //this is the list of subreddits most frequnted by users of this subreddit
      return mergeSubredditList;
    }
    catch (err) {
      console.log(err.message);
    }
  },
  parseThreads: function(response) {
    
    console.log('got ' + this.title + " t=" + response.data.children.length);
  
    var threadParseList = [];
    for(var i=0; i<response.data.children.length; i++) {
      var child = response.data.children[i];
  
      var thread = new Thread(child.data.permalink);
      threadParseList.push(thread.asyncProcess());
    }
    return Promise.all(threadParseList);
  },
  enumerateUserSubreddits: function(user_list) {
    var count = user_list.length < count_users ? user_list.length : count_users;
    var userParseList = [];
    for(var i=0; i<count; i++) {
      var user = new User(user_list[i].name, user_list[i].count);
      userParseList.push(user.asyncProcess());
    }
    return Promise.all(userParseList);
  },
  mergeUserSubreddits: function(user_subs) {
    var mergeSubredditList = new NameCountList();
    for(var i=0; i<user_subs.length; i++) {
      if(user_subs[i] !== undefined) {
        mergeSubredditList.merge(user_subs[i]);
      }
    }
    return mergeSubredditList.get_sorted();
  },
  enumerateUsersOfThreads: function(userFrequencies) {
    var userList = new NameCountList();
    for(var i=0; i<userFrequencies.length; i++) {
      userList.merge(userFrequencies[i]);
    }
    return userList.get_sorted()
  },
  printSortedSubs: async function() {

    let sortedSubs = await this.asyncProcess();
    // var sortedSubs = this.asyncProcess()
    for(var i=0; i<sortedSubs.length; i++) {
      var sub = sortedSubs[i];
      if(sub.count <= 1)  {
        break;
      }
      console.log(sub.name + " " + sub.count);
    }
  }
}

module.exports.Subreddit = Subreddit;
module.exports.Thread = Thread;
