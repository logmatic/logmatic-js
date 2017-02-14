var Logger = require("./logger");
var Handlers = require("./handlers");
var Hooks = require("./hooks");
var LogmaticClient = require("./logmatic-client");

var LogmaticBuilder = function (opts) {

  var _self = {};

  opts = opts || {};

  _self.config = {
    url: opts.url || "https://api.logmatic.io/v1/input/",
    token: opts.key || null,
    consoleHandler: opts.enableConsoleHandler || true,
    errorHandler: opts.enableErrorHandler || true,
    hooks: opts.hooks || [],
    context: {
      "appname": opts.appname || null,
      "@marker": ["logmatic-js", "front", "sourcecode"]
    },
    client: {
      type: "logmatic",
      IPTracking: opts.enableIPTracking || true,
      UATracking: opts.enableUATracking || true
    }
  };

  if (window && window.location && _self.config.context["appname"] === null) {
    _self.config.context["appname"] = window.location.hostname;
  }

  var client = null;
  _self.config.endpoint = _self.config.url + _self.config.token;
  switch (_self.config.client.type) {
    case "logmatic":
      client = LogmaticClient(_self.config);
      break;
    default:
      throw "You have to set a valid key for 'client.type'";
  }

  // Init the client
  var logger = Logger({
    client: client,
    context: _self.config.context
  });

  if (_self.config.consoleHandler) {
    Handlers.consoleHandler(logger, {});
  }
  if (_self.config.errorHandler) {
    Handlers.errorHandler(logger, {});
  }

  _self.config.hooks.push([Hooks.urlTracker, {}]);
  _self.config.hooks.push([Hooks.timestamper, {}]);

  // Register hooks
  _self.config.hooks.forEach(function(h) {
    logger.addHook(h[0], h[1]);
  });
  logger.log("Navigated to " + window.location.href);

  return logger;
};

LogmaticBuilder.Hooks = Hooks;
LogmaticBuilder.Handlers = Handlers;


module.exports = LogmaticBuilder;