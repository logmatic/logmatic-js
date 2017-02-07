module.exports = function (logger, props) {

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
};

