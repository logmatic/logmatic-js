import Utils from "./utils";

var handlers = {
  consoleHandler: function (logger, props) {
    if (!console) {
      return;
    }
    var _levelAttributeName = props.levelAttributeName || "level";
    var context = {};

    // Override the default console behavior
    [{f: 'log', l: 'info'}, {f: 'info'}, {f: 'trace'}, {f: 'warn'}, {f: 'error'}].forEach(function (decl) {

      var funName = decl.f;
      var level = decl.l || decl.f;
      var oldFun = console[funName];

      console[funName] = function () {

        // Now we build the message and log it
        var message = Array.prototype.slice.call(arguments).map(function (a) {
          return typeof (a) === 'object' ? Utils.stringify(a) : String(a);
        }).join(' ');

        context[_levelAttributeName] = level;
        logger.log(message, context);

        // Fwd call to old impl.
        if (oldFun.apply) { // Most browsers
          oldFun.apply(console, arguments);
        } else { // IE
          oldFun(message);
        }
      };
    });
  },
  errorHandler: function (logger, props) {

    var _errorAttributeName = props.errorAttributeName || "error";
    var _levelAttributeName = props.levelAttributeName || "level";

    var oldHandler = window.onerror;
    window.onerror = function (message, url, line, column) {
      var errorProperties = {};
      errorProperties[_errorAttributeName] = {
        mode: 'JSException',
        url: url,
        line: line,
        column: column,
        name: message
      };

      errorProperties[_levelAttributeName] = "error";
      logger.log(message, errorProperties);
      if (oldHandler && (typeof(oldHandler) === 'function')) {
        oldHandler.apply(window, arguments);
      }
    };
  }
};

export default handlers;