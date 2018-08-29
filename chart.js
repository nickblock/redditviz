


var Create = function(label, data) {
    var labels = [], chart_data = [];
    var count = data.length < global.config.chart_item_size ? data.length : global.config.chart_item_size;
    for(var i=1; i<count; i++) {
      var item = data[i];
      labels.push(item.name);
      chart_data.push(item.count);
    }
    return {
      type: 'bar',
      data: {
          labels: labels,
          datasets: [{
              label: label,
              data: chart_data,
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

module.exports.Create = Create;