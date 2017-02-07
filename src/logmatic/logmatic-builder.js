var Logger = require("./logger");
var Handlers = require("./handlers");
var Hooks = require("./hooks");
var LogmaticClient = require("./logmatic-client");
var Utils = require("./utils");


var LogmaticBuilder = function (opts) {

  var _self =  {};

  _self.config = {
    url: "https://api.logmatic.io/v1/input/",
    token: null,
    consoleHandler: true,
    errorHandler: true,
    context: {
      "appname": null,
      "@marker": ["logmatic-js", "front", "sourcecode"]
    },
    client: {
      IPTracking: true,
      UATracking: true
    }
  };

  // Public methods
  _self.init = function (token) {
    _self.config.token = token;
    return _self;
  };

  _self.withName = function (appname) {
    _self.addField("appname", appname);
    return _self;
  };

  _self.addField = function (key, value) {
    _self.config.context[key] = value;
    return _self;
  };

  _self.disableConsole = function () {
    _self.config.consoleHandler = false;
    return _self;
  };

  _self.disableErrorHandler = function () {
    _self.config.errorHandler = false;
    return _self;
  };

  _self.disableIPTracking = function () {
    _self.config.client.IPTracking = false;
    return _self;
  };

  _self.disableUATracking = function () {
    _self.config.client.UATracking = false;
    return _self;
  };

  _self.setCustomConfiguration = function (config) {
    _self.config = Utils.assign(config, _self.config);
    return _self;

  };

  if (_self.config.context["appname"] === null) {
    _self.addField("appname", window.location.hostname);
  }

  // Init the client
  _self.config.endpoint = _self.config.url + _self.config.token;
  var client = LogmaticClient(_self.config);

  // Init the logger
  var logger = Logger(client, _self.config.context);


  if (_self.config.consoleHandler) {
    Handlers.consoleHandler(logger, {});
  }
  if (_self.config.errorHandler) {
    Handlers.errorHandler(logger, {});
  }

  // Register hooks
  logger.addHook(Hooks.urlTracker, {});
  logger.log("Navigated to " + window.location.href);

  return logger;
};

LogmaticBuilder.Hooks = Hooks;

module.exports = LogmaticBuilder;