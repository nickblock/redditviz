
const fs = require('fs');
const reddit = require("./reddit");
const cache = require("./cache");
const https = require('./http_module');


global.config = JSON.parse(fs.readFileSync("config.json"));
var TheCache = cache.GetCache();

var SubSet;
var CacheList = [];
var add_to_cache_list = function(subreddit) {
  if(global.config.cache_primer_amount > SubSet.size && !SubSet.has(subreddit)) {
    SubSet.add(subreddit);
    CacheList.unshift(subreddit);
  }
}

var get_subreddits = async function(subreddit) {

  try {

    var subreddit = new reddit.Subreddit(subreddit);
    var result = await subreddit.getSubredditsCached();
  
    var count = 0;
    for(var i=0; i<global.config.chart_item_size ;i++) {
        add_to_cache_list(result[i].name);
        if(count++ > global.config.chart_item_size) {
          return;
        }
    };
  }
  catch(err) {
    console.log(err);
  }

}

var fill_from_front_page = async function(depth) {

  SubSet = new Set();
  
  let front_page = await https.GetUrl(global.config.base_reddit_url + ".json");

  if(front_page.data.children) {

    for(var i=0; i<front_page.data.children.length; i++) {
      var child = front_page.data.children[i];
      add_to_cache_list(child.data.subreddit);
    }
    
    while(CacheList.length) {
      try {
        await get_subreddits(CacheList.pop());
        if(SubSet.length % 100 == 0) {
          console.log("Subs=" + SubSet.length + " Cache=" + CacheList.length);
        }
      }
      catch(err) {
        console.log("coudnt fetch " + err)
      }
    }

    console.log("done");
  }


}

fill_from_front_page(global.config.cache_primer_depth);
