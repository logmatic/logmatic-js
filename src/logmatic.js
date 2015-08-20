
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.logmatic = factory();
  }
} (this, function () {
  var _url;
  var _metas;
  var _ipTrackingAttr;
  var _uaTrackingAttr;
  var _urlTrackingAttr;

  function assign (fromObject, toObject) {
    if (fromObject) {
      for (var key in fromObject) {
        if (fromObject.hasOwnProperty(key)) {
          toObject[key] = fromObject[key];
        }
      }
    }
  }

  var init = function (key) {
    _url = 'https://api.logmatic.io/v1/input/' + key;
  };

  var log = function (message, context) {
    if (!_url) {
      console.error('Please init Logmatic before pushing events');
      return;
    }
    var payload = {
      message: message
    };
    assign(context, payload);
    post(payload);
  };

  var post = function (data, successFn, errorFn) {
    // Set metas
    assign(_metas, data);

    // URL tracking
    if (_urlTrackingAttr) {
      data[_urlTrackingAttr] = window.location.href;
    }

    var request;
    if (typeof (XDomainRequest) !== 'undefined') { // IE8/9
      request = new XDomainRequest();
    }
    request = new XMLHttpRequest();
    request.open('POST', _url, true);

    if (request.constructor === XMLHttpRequest) {
      request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

      // IP tracking
      if (_ipTrackingAttr) {
        request.setRequestHeader('X-Logmatic-Add-IP', _ipTrackingAttr);
      }
      // UserAgent tracking
      if (_uaTrackingAttr) {
        request.setRequestHeader('X-Logmatic-Add-UserAgent', _uaTrackingAttr);
      }
    }

    request.onload = function () {
      if (successFn) {
        successFn(request);
      }
    };

    request.onerror = function () {
      if (errorFn) {
        errorFn(request);
      }
    };

    request.send(JSON.stringify(data));
  };

  var setMetas = function (metas) {
    _metas = metas;
  };

  function setSendConsoleLogs (consoleLevelAttribute) {
    if (!console) {
      return;
    }
    [{ f: 'log', l: 'info' }, { f: 'info' }, { f: 'trace' }, { f: 'warn' }, { f: 'error' }].forEach(function (decl) {
      var funName = decl.f;
      var level = decl.l || decl.f;
      var oldFun = console[funName];
      console[funName] = function () {
        var props = null;
        // Set the level if requested
        if (consoleLevelAttribute) {
          props = {};
          props[consoleLevelAttribute] = level;
        }
        // Now we build the message and log it
        var message = Array.prototype.slice.call(arguments).map(function (a) {
            return typeof (a) === 'object' ? JSON.stringify(a) : String(a);
        }).join(' ');
        log(message, props);
        // Fwd call to old impl.
        if (oldFun.apply) { // Most browsers
          oldFun.apply(console, arguments);
        } else { // IE
          oldFun(message);
        }
      };
    });
  }

  function setSendConsoleErrors (errorAttribute) {
    if (errorAttribute) {
      var oldhandler = window.onerror;
      window.onerror = function (message, url, line, col) {
        var errorProperties = {};
        errorProperties[errorAttribute] = {
          type: 'JSException',
          url: url,
          line: line,
          col: col,
        };
        log(message, errorProperties);
        if (oldhandler && (typeof(oldhandler) === 'function')) {
          oldhandler.apply(window, arguments);
        }
      };
    }
  }

  var setURLTracking = function (urlTrackingAttr) {
    _urlTrackingAttr = urlTrackingAttr;
  };

  var setIPTracking = function (ipTrackingAttr) {
    _ipTrackingAttr = ipTrackingAttr;
  };

  var setUserAgentTracking = function (uaTrackingAttr) {
    _uaTrackingAttr = uaTrackingAttr;
  };

  return {
    init: init,
    log: log,
    setMetas: setMetas,
    setSendConsoleErrors: setSendConsoleErrors,
    setSendConsoleLogs: setSendConsoleLogs,
    setIPTracking: setIPTracking,
    setUserAgentTracking: setUserAgentTracking,
    setURLTracking: setURLTracking
  };
}));
