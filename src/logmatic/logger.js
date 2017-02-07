var Utils = require("./utils");

var Logger = function (opts) {

    if (!opts || !opts.client || !opts.client.queue || !opts.client.post) {
      throw "Logger initialization failed, client not valid";
    }

    var _logger = {};

    var _client = opts.client;
    var _globalContext = opts.client || {};
    var _hooks = opts.hooks || [];

    _logger.addHook = function (callback, props) {
      _hooks.push({callback: callback, props: props || {}});
    };

    _logger.addField = function (key, value) {
      _globalContext[key] = value;
    };

    _logger.removeField = function (key) {
      if (_globalContext.indexOf(key) !== -1) {
        return _globalContext.splice(_globalContext.indexOf(key), 1);
      }
    };

    _logger.log = function (message, context) {

      var event = {};
      event.message = message;
      event.level = "info";
      event = Utils.assign(_globalContext, event);
      event = Utils.assign(context, event);

      // Apply each hook register
      _hooks.forEach(function (hook) {
        event = hook.callback(event, hook.props)
      });

      _client.queue(event);

    };

    ["trace", "debug", "info", "warn", "error"].forEach(function (l) {
      _logger[l] = function (m, c) {
        c = c || {};
        c.level = l;
        _logger.log(m, c)
      };
    });

    _logger.flush = function () {
      _client.post()
    };

    return _logger;

  }
  ;


module.exports = Logger;