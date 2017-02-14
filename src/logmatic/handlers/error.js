module.exports = function (logger, props) {

  var _errorAttributeName = props.errorAttributeName || "error";
  var _levelAttributeName = props.levelAttributeName || "level";


  //Use TraceKit if available, fallback on basic error reporting otherwise
  if (window && window.TraceKit) {
    var TraceKit = window.TraceKit;
    TraceKit.report.subscribe(function (errorReport) {
      var errorProperties = {};
      errorProperties[_errorAttributeName] = errorReport;
      errorProperties[_levelAttr] = "error";
      errorProperties[_errorAttributeName].name = errorReport.message;
      errorProperties[_errorAttributeName].type = errorReport.message.replace(/:.*/, "");
      log(errorReport.message, errorProperties);
    });
  } else {

    var oldHandler = window.onerror;
    window.onerror = function (message, url, line, column) {
      var errorProperties = {};
      errorProperties[_errorAttributeName] = {
        mode: 'JSException',
        file: url.replace(window.location.origin, ""),
        type: message.replace(/:.*/, ""),
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

