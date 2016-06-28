(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.logmatic = factory();
  }
}(this, function () {

  var _url = 'https://api.logmatic.io/v1/input/';
  var _metas;
  var _ipTrackingAttr;
  var _uaTrackingAttr;
  var _urlTrackingAttr;
  var _levelAttr = "severity";

  //Bulk default options
  var _bulkLingerMs = 500;
  var _bulkMaxPostCount = 10;
  var _bulkMaxWaitingCount = -1;


  var _queue = [];
  var _posting = false;
  var _maxContentSize = 200 * 1024; // limit post to 200 KB

  var _lingerManager = createLingerManager(_bulkLingerMs);


  function assign(fromObject, toObject) {
    if (fromObject) {
      for (var key in fromObject) {
        if (fromObject.hasOwnProperty(key)) {
          toObject[key] = fromObject[key];
        }
      }
    }
  }


  function createLingerManager(lingerPeriodMs) {

    var manager = {};
    manager.MODE = {
      IMMEDIATE: 0,
      LINGER: 1,
      ERROR: 2
    };

    // constant values
    var _backOffPeriodMs = 500;
    var _backOffMaxPeriodMs = 30 * 1000;

    var _scheduled = false;
    var _alarm = null;
    var _mode = manager.MODE.LINGER;
    var _backOffFactor = 0;
    var _lingerPeriodMs = lingerPeriodMs;


    manager.flush = function () {
      _scheduled = false;
    };


    manager.isScheduled = function () {
      return _scheduled;
    };

    manager.setMode = function (mode) {
      _mode = mode;
      if (_mode !== manager.MODE.ERROR) {
        // reset the back-off factor
        _backOffFactor = 0;
      }
    };

    manager.postpone = function (_callback) {

      var timeMs;
      if (_alarm) {
        clearTimeout(_alarm);
      }

      _scheduled = true;

      switch (_mode) {

        case manager.MODE.IMMEDIATE:
          timeMs = 0;
          break;

        case manager.MODE.LINGER:
          timeMs = _lingerPeriodMs;
          break;

        case manager.MODE.ERROR:
          var backOffPeriodMs = _backOffPeriodMs * Math.pow(2, _backOffFactor);
          _backOffFactor++;
          timeMs = Math.min(backOffPeriodMs, _backOffMaxPeriodMs);
      }


      // Defer the callback
      _alarm = setTimeout(_callback, timeMs);
      console.debug("Defer in " + timeMs);

    };

    return manager;
  }


  var init = function (key) {
    _url = _url + key;
  };

  var forceEndpoint = function (url) {
    _url = url;
  };

  var setBulkOptions = function (opts) {
    opts = opts || {};
    if (opts.lingerMs != null && opts.lingerMs >= 0) {
      _bulkLingerMs = opts.lingerMs;
    }
    if (opts.maxPostCount != null) {
      if (opts.maxPostCount < 1) opts.maxPostCount = 1;
      _bulkMaxPostCount = opts.maxPostCount;
    }
    if (opts.maxWaitingCount != null) {
      _bulkMaxWaitingCount = opts.maxWaitingCount;
    }
    if (opts.maxContentSize != null) {
      _maxContentSize = opts.maxContentSize;
    }
  };

  var log = function (message, context) {
    if (!_url) {
      return;
    }
    var payload = {
      message: message
    };
    if (_levelAttr) {
      payload[_levelAttr] = "info";
    }
    assign(context, payload);
    queue(payload);
  };

  var queue = function (payload) {
    // Set metas
    assign(_metas, payload);

    // URL tracking
    if (_urlTrackingAttr) {
      payload[_urlTrackingAttr] = window.location.href;
    }

    _queue = _queue || [];
    _queue.push(JSON.stringify(payload));

    // Check if we are growing above the max waiting count (if any)
    if (_bulkMaxWaitingCount >= 0 && _queue.length > _bulkMaxWaitingCount) {
      _queue.shift();
    }

    tryPost();
  };

  var tryPost = function () {

    // Do nothing if the linger already scheduled or if a post is running
    if (_lingerManager.isScheduled() || _posting) {

      console.debug("Scheduled");
      return;
    }

    _lingerManager.postpone(post);


  };


  var post = function () {

    _posting = true;

    var data = [];
    var contentSize = 0;

    while (_queue.length > 0 && data.length < _bulkMaxPostCount) {

      var item = _queue.shift();
      contentSize += item.length;

      if (contentSize > _maxContentSize) {

        // Drop the element if its size is more than the max allowed
        if (item.length > _maxContentSize) {
          break;
        }

        // Otherwise, unshift the element
        _queue.unshift(item);
        break;
      }

      data.push(item)

    }

    // Worst-case: the first element was too big
    if (data.length === 0) {
      _posting = false;
      _lingerManager.flush();
      return;
    }

    var payload = '[' + data.join(',') + ']';

    var request;
    if (typeof (XDomainRequest) !== 'undefined') { // IE8/9
      request = new XDomainRequest();
    } else {
      request = new XMLHttpRequest();
    }
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


    function handleResponse(response) {

      var status = response.target.status;

      if (status === 200 || status === 0) {

        if (_queue.length > 0) {
          // continue until the queue is empty
          _lingerManager.setMode(_lingerManager.MODE.IMMEDIATE);
        } else {
          // default mode
          _lingerManager.setMode(_lingerManager.MODE.LINGER);
        }
      } else {
        // use a back-off mechanism
        _lingerManager.setMode(_lingerManager.MODE.ERROR);
      }

      _posting = false;
      _lingerManager.flush();
      tryPost();

    }


    request.onerror = handleResponse;
    request.onload = handleResponse;


    request.send(payload);

  };

  var setMetas = function (metas) {
    _metas = metas;
  };

  function setSendConsoleLogs(consoleLevelAttribute) {
    if (consoleLevelAttribute) {
      _levelAttr = consoleLevelAttribute;
    }
    if (!console) {
      return;
    }
    [{f: 'log', l: 'info'}, {f: 'info'}, {f: 'trace'}, {f: 'warn'}, {f: 'error'}].forEach(function (decl) {
      var funName = decl.f;
      var level = decl.l || decl.f;
      var oldFun = console[funName];
      console[funName] = function () {
        var props = null;
        // Set the level if requested
        if (_levelAttr) {
          props = {};
          props[_levelAttr] = level;
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

  function setSendErrors(errorAttribute) {
    if (errorAttribute) {

      //Use TraceKit if available, fallback on basic error reporting otherwise
      var TraceKit = window.TraceKit;
      if (TraceKit) {
        TraceKit.report.subscribe(function (errorReport) {
          var errorProperties = {};
          errorProperties[errorAttribute] = errorReport;
          if (_levelAttr) {
            errorProperties[_levelAttr] = "error";
          }
          log(errorReport.message, errorProperties);
        });
      } else {
        var oldhandler = window.onerror;
        window.onerror = function (message, url, line, column) {
          var errorProperties = {};
          errorProperties[errorAttribute] = {
            mode: 'JSException',
            url: url,
            line: line,
            column: column
          };

          if (_levelAttr) {
            errorProperties[_levelAttr] = "error";
          }
          log(message, errorProperties);
          if (oldhandler && (typeof(oldhandler) === 'function')) {
            oldhandler.apply(window, arguments);
          }
        };
      }
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
    forceEndpoint: forceEndpoint,
    setMetas: setMetas,
    setSendErrors: setSendErrors,
    setSendConsoleErrors: setSendErrors,
    setSendConsoleLogs: setSendConsoleLogs,
    setIPTracking: setIPTracking,
    setUserAgentTracking: setUserAgentTracking,
    setURLTracking: setURLTracking,
    setBulkOptions: setBulkOptions
  };
}))
;
