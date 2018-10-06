const Graphics = require("./graphics");
const Data = require("./objects");
const Utils = require("./utils")


module.exports = {

    orbManager: Data.orbManager,
    create_url_from_search: Utils.create_url_from_search,
    setScreenSize:  Graphics.setScreenSize,
    init:  Graphics.init,
    screen_config:  Graphics.screen_config,

};