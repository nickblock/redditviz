const Graphics = require("./graphics");
const Data = require("./objects");
const Utils = require("./utils")


module.exports.start = function() {



var graphicsCanvas = document.getElementById('canvas');
var orbManager;

document.getElementById('canvas').onclick = function(evt) {
    var orb = FindOrb(evt.layerX, evt.layerY);
    console.log("x:" + evt.layerX + " y:" + evt.layerY + " " +orb.l);
    // var activePoints = window.reddit_graph.getElementsAtEvent(evt);
    // if(activePoints.length) {
    //     fetch_graph_set_history("r/" + activePoints["0"].$datalabels._model.lines);
    //     // fetch_graph_set_history("r/" + activePoints[0]._model.label);
    // }
}
window.addEventListener("mousemove", function(evt) {
    orbManager.mouse_over(evt.clientX/Graphics.screen_config.scale, evt.clientY/Graphics.screen_config.scale);
});
window.addEventListener("click", function(evt) {
    orbManager.mouse_click(evt.clientX/Graphics.screen_config.scale, evt.clientY/Graphics.screen_config.scale);
});
window.addEventListener("resize", function(evt) {
    Graphics.setScreenSize([graphicsCanvas.offsetWidth, graphicsCanvas.offsetHeight]);
})
document.getElementById("search-button").onclick = function(evt) {
    fetch_graph_set_history("r/" + document.getElementById('search-term').value);
}
document.getElementById("search-term").addEventListener("keyup", function(evt) {
    if (event.keyCode === 13) {
        fetch_graph_set_history(format_seach_term(document.getElementById('search-term').value));
    }
});
var format_seach_term = function(input) {
    if(input.substr(0,2) == "u/" || input.substr(0,2) == "r/") {
        return input;
    }
    else {
        return "r/" + input;
    }
}
var get_relevant_search_from_address = function() {
    var remove_proto = window.location.href.replace("http://", "");
    remove_proto = remove_proto.replace("https://", "");
    var first_slash = remove_proto.indexOf("/") +1;
    var result = remove_proto.substr(first_slash, remove_proto.length - first_slash) || "r/AskReddit";
    return result;
}
var display_message = function(input) {
    document.getElementById('message').innerHTML = "<h1>" + input + "</h1>";
}
var push_history = function(search) {
    window.history.pushState({search:search}, "Title", Utils.create_url_from_search(search));
}

var fetch_graph_set_history = function(search) {
    orbManager.fetch(search, true);
}

window.onload = function() {

    orbManager.fetch(get_relevant_search_from_address(window.location.href), false);
};
window.addEventListener('popstate', function(event) {

    orbManager.fetch(get_relevant_search_from_address(window.location.href), false);
});

orbManager = Graphics.init(
    [graphicsCanvas.offsetWidth, graphicsCanvas.offsetHeight],
    display_message,
    push_history
);

}

