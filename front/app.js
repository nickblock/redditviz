const graphics = require("./graphics");
const data = require("./objects");
const utils = require("./utils")


module.exports = {

    orbManager: data.orbManager,
    create_url_from_search: utils.create_url_from_search,
    setScreenSize:  graphics.setScreenSize,
    init:  graphics.init,
    screen_config:  graphics.screen_config,

};