const NameCountList = require("./name_count").NameCountList;
const https = require('./http_module');

const thisIsReddit = 'https://www.reddit.com/';
const count_users = 100;

User = function(name) {
  this.name = name;
}
User.prototype = {
  getUrl: function(name) {
    return thisIsReddit + "user/" + name + "/.json?limit=100";
  },
  getSubreddits: async function() {
    
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
  },
  printSubreddits: async function() {
    let subreddits = await this.getSubreddits();
    for(var i=0; i<subreddits.length; i++) {
      var sub = subreddits[i];
      if(sub.count <= 1) {
        break;
      }
      console.log(sub.name + " " + sub.count);
    }
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
  getUserFreq: async function() {

    try {
      let comment_tree = await https.GetUrlPromise(this.getUrl());
      return this.parseComments(comment_tree);
    }
    catch (err) {
      console.log(err.message);
    }
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
  getSubreddits: async function() {

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
      
      //this is the list of other subreddits most frequnted by users of this subreddit
      return mergeSubredditList;
    }
    catch (err) {
      throw err;
    }
  },
  parseThreads: function(response) {
    
    console.log('got ' + this.title + " t=" + response.data.children.length);
  
    var threadParseList = [];
    for(var i=0; i<response.data.children.length; i++) {
      var child = response.data.children[i];
  
      var thread = new Thread(child.data.permalink);
      threadParseList.push(thread.getUserFreq());
    }
    return Promise.all(threadParseList);
  },
  enumerateUserSubreddits: function(user_list) {
    var count = user_list.length < count_users ? user_list.length : count_users;
    var userParseList = [];
    for(var i=0; i<count; i++) {
      var user = new User(user_list[i].name);
      userParseList.push(user.getSubreddits());
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
    return mergeSubredditList;
  },
  enumerateUsersOfThreads: function(userFrequencies) {
    var userList = new NameCountList();
    for(var i=0; i<userFrequencies.length; i++) {
      userList.merge(userFrequencies[i]);
    }
    return userList.get_sorted()
  },
  printSortedSubs: async function() {

    let subreddits = await this.getSubreddits();
    // var subreddits = this.asyncProcess()
    for(var i=0; i<subreddits.length; i++) {
      var sub = subreddits[i];
      if(sub.count <= 1)  {
        break;
      }
      console.log(sub.name + " " + sub.count);
    }
  }
}

module.exports.Subreddit = Subreddit;
module.exports.User = User;
module.exports.Thread = Thread;
