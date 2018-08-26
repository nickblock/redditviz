
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
  },
  to_chart_js: function(label) {
    var sorted = this.get_sorted();
    var labels = [], data = [];
    for(var i=1; i<20; i++) {
      var item = sorted[i];
      labels.push(item.name);
      data.push(item.count);
    }
    return {
      type: 'bar',
      data: {
          labels: labels,
          datasets: [{
              label: label,
              data: data,
              borderWidth: 1
          }]
      },
      options: {
          events: ["click"],
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero:true
                  }
              }]
          }
      }
    }
  }
}

module.exports.NameCountList = NameCountList;