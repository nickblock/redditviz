

var chart_item_max = 20;

var doColors = function(num) {
    
    var colors = [
        "rgba(44, 19, 32, 1)",
        "rgba(95, 75, 102, 1)",
        "rgba(167, 173, 198, 1)",
        "rgba(135, 151, 175, 1)",
        "rgba(86, 102, 122, 1)",
    ];
    
    var backgroundColor = [];
    for(var i=0; i<num; i++) {
        backgroundColor.push(colors[i%colors.length]);
    }
    return backgroundColor;
}
var CreateChart = function(ctx, label, data) {
    var labels = [], chart_data = [];
    var count = data.length < chart_item_max ? data.length : chart_item_max;
    for(var i=1; i<count; i++) {
      var item = data[i];
      labels.push(item.name);
      chart_data.push(item.count);
    }
    var chart_config = {
      type: 'bar',
      data: {
          labels: labels,
          datasets: [{
              label: label,
              data: chart_data,
              borderWidth: 1,
              backgroundColor: doColors(chart_data.length)
          }]
      },
      options: {
          events: ["click", "hover"],
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero:true
                  }
              }]
          }
      }
    }
    return new Chart(ctx, chart_config);
}
var CreateOrbital = function(ctx, label, data) {
    var orbs = [], labels = [];
    var count = data.length < chart_item_max ? data.length : chart_item_max;
    for(var i=1; i<count; i++) {
        orbs.push({
            x: i,
            y: Math.floor(Math.random() * 10),
            r: data[i].count
        });
        labels.push(data[i].name);
    }
    var chart_config = {
      type: 'bubble',
      animation: {
          duration: 50000
      },
      data: {
          labels: labels,
          datasets: [{
              label: label,
              data: orbs,
              borderWidth: 1,
              backgroundColor: doColors(orbs.length)
          }]
      },
      options: {
          events: ["click", "hover"],
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero:true
                  }
              }]
          }
      }
    }
    return new Chart(ctx, chart_config);
}