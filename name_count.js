
NameCountList = function() {
  this.items = {}
}
NameCountList.prototype = {
  add: function(name, count) {
    if(this.items.hasOwnProperty(name)) {
      this.items[name] += count;
    }
    else {
      this.items[name] = count;
    }
  },
  merge: function(otherList) {
    var names = Object.keys(otherList.items);
    for(var i=0; i<names.length; i++) {
      var count = otherList.items[names[i]];
      this.add(names[i], count);
    }
  },
  get_sorted: function() {
    
    var sortedItems = [];
    var names = Object.keys(this.items);
    for(var i=0; i<names.length; i++) {
      var name = names[i];
      var count = this.items[name];
      var inserted = false;
      for(var j=0; j<sortedItems.length; j++) {
        if(count > sortedItems[j].count) {
          sortedItems.splice(j, 0, {name:name, count:count});
          inserted = true;
          break;
        }
      }
      if(!inserted) {
        sortedItems.push({name:name, count:count});
      }
    }
    return sortedItems;

  }
}

module.exports.NameCountList = NameCountList;