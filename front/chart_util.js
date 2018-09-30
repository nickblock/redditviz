

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

var orbs = [];
var FindOrb = function(x, y) {
    var closest = Number.MAX_VALUE;
    var result;
    for(var i=0; i<orbs.length; i++) {
        var orb = orbs[i];
        var distance = Math.pow(Math.abs(x-orb.x), 2) + Math.pow(Math.abs(y-orb.y), 2);
        if(distance < closest) {
            result = orb;
            closest = distance;
        }
    }
    return result;
}
var CreateOrbital = function(ctx, label, data) {
    var labels = [];
    var count = data.length < chart_item_max ? data.length : chart_item_max;
    for(var i=1; i<count; i++) {
        orbs.push({
            x: i,
            y: Math.floor(Math.random() * 10),
            r: data[i].count,
            l: data[i].name
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
        plugins: {
            datalabels: {
        
                anchor: function(context) {
                    var value = context.dataset.data[context.dataIndex];
                    return value.v < 50 ? 'end' : 'center';
                },
                align: function(context) {
                    var value = context.dataset.data[context.dataIndex];
                    return value.v < 50 ? 'end' : 'center';
                },
                color: function(context) {
                    var value = context.dataset.data[context.dataIndex];
                    return value.v < 50 ? context.dataset.backgroundColor : 'white';
                },
                font: {
                    weight: 'bold'
                },
                formatter: function(value) {
                    return value.l;
                },
                offset: 2,
                padding: 0
            }
        },
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