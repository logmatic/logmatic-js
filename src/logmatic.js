
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.logmatic = factory();
  }
}(this, function () {
  var _url;
  var _ipTrackingAttr;
  var _uaTrackingAttr;

  var init = function(key) {
    _url = "https://api.logmatic.io/v1/input/"+key;
  }

  var log = function(message, context) {
    if (!_url) {
      console.error("Please init Logmatic before pushing events"); return;
    }
    var payload = {message: message};
    if (context) {
      for (var key in context) {
        if (context.hasOwnProperty(key)) {
          payload[key] = context[key];
        }
      }
    }
    post(payload);
  }

  var post = function(data, successFn, errorFn) {

    //Set metas
    if (_metas) {
      for (var key in _metas) {
        if (_metas.hasOwnProperty(key)) {
          data[key] = _metas[key];
        }
      }
    }

    var request = new XMLHttpRequest();
    request.open('POST', _url, true);
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    //Enable IP tracking
    if(_ipTrackingAttr){
      request.setRequestHeader('X-Logmatic-Add-IP', _ipTrackingAttr);
    }
    //Enable UserAgent tracking
    if(_uaTrackingAttr){
      request.setRequestHeader('X-Logmatic-Add-UserAgent', _uaTrackingAttr);
    }

    request.onload = function() {
      if (successFn) successFn(request);
    };

    request.onerror = function() {
      if (errorFn) errorFn(request);
    };

    request.send(JSON.stringify(data));
  }

  var setMetas = function(metas) {
    _metas = metas;
  }

  function setSendConsoleLogs(consoleLevelAttribute) {
    var oldLog = console.log;
    console.log = function (message) {
        var props = {};
        if(consoleLevelAttribute){
          props[consoleLevelAttribute]="info";
        }
        log(message,props);
        oldLog.apply(console, arguments);
    };
    var oldInfo = console.info;
    console.info = function (message) {
        var props = {};
        if(consoleLevelAttribute){
          props[consoleLevelAttribute]="log";
        }
        log(message,props);
        oldInfo.apply(console, arguments);
    };
    var oldTrace = console.trace;
    console.trace = function (message) {
        var props = {};
        if(consoleLevelAttribute){
          props[consoleLevelAttribute]="trace";
        }
        log(message,props);
        oldTrace.apply(console, arguments);
    };
    var oldWarn = console.warn;
    console.warn = function (message) {
        var props = {};
        if(consoleLevelAttribute){
          props[consoleLevelAttribute]="warn";
        }
        log(message,props);
        oldWarn.apply(console, arguments);
    };
    var oldError = console.error;
    console.error = function (message) {
        var props = {};
        if(consoleLevelAttribute){
          props[consoleLevelAttribute]="error";
        }
        log(message,props);
        oldError.apply(console, arguments);
    };
  }

  function setSendConsoleErrors(errorAttribute) {
    if(errorAttribute){
      var oldhandler = window.onerror;
      window.onerror = function (message, url, line, col){
        var errorProperties = {};
        errorProperties[errorAttribute] = {
          type: "JSException",
          url: url,
          line: line,
          col: col,
        };
        log(message,errorProperties);

        if (oldhandler && typeof oldhandler === 'function') {
          oldhandler.apply(window, arguments);
        }
      };
    }
  }

  var setIPTracking = function(ipTrackingAttr) {
    _ipTrackingAttr = ipTrackingAttr;
  }

  var setUserAgentTracking = function(uaTrackingAttr) {
    _uaTrackingAttr = uaTrackingAttr;
  }

  return {
    init: init,
    log: log,
    setMetas: setMetas,
    setSendConsoleErrors: setSendConsoleErrors,
    setSendConsoleLogs: setSendConsoleLogs,
    setIPTracking: setIPTracking,
    setUserAgentTracking: setUserAgentTracking
  };
}));
