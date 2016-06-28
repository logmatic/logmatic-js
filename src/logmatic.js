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
    var _maxContentSize = 200 * 1024; // limit post to 200 KB

    var _lingerManager = createLingerManager();


    function assign(fromObject, toObject) {
        if (fromObject) {
            for (var key in fromObject) {
                if (fromObject.hasOwnProperty(key)) {
                    toObject[key] = fromObject[key];
                }
            }
        }
    }


    function createLingerManager() {

        var manager = {};

        //Linger mode
        manager.LINGER_DEFAULT = 0;
        manager.LINGER_NO_WAIT = 1;
        manager.LINGER_BACKOFF = 2;

        var _locked = false;
        var _scheduled = false;
        var _disabled = false;
        var _failed = false;
        var _alarm = null;
        var _backOffFactor = 0;

        const BACKOFF_PERIOD_MS = 500;
        const BACKOFF_MAX_PERIOD_MS = 30 * 1000;


        manager.lock = function () {
            _locked = true;
        };

        manager.unlock = function () {
            _scheduled = false;
            _locked = false;
        };

        manager.isLocked = function () {
            return _locked;
        };


        manager.isScheduled = function () {
            return _scheduled;
        };
        manager.isDisabled = function () {
            return _disabled || (_bulkLingerMs === 0);
        };

        manager.postpone = function (_callback) {

            var backOffPeriod = 0;

            if (_alarm) {
                clearTimeout(_alarm);
            }

            _scheduled = true;


            if (_failed === true) {
                backOffPeriod = BACKOFF_PERIOD_MS * Math.pow(2, _backOffFactor);
                _backOffFactor++;
            }

            // Defer the callback
            _alarm = setTimeout(_callback, Math.min(_bulkLingerMs + backOffPeriod, BACKOFF_MAX_PERIOD_MS));

        };

        manager.handleResponse = function (response) {

            var status = response.target.status;

            if (status === 200 || status === 0) {

                // Disable the linger until the queue is empty
                _disabled = _queue.length > 0;
                _failed = false;
                _backOffFactor = 0;

            } else {
                _failed = true;
            }

            _scheduled = false;
            _locked = false;
            tryPost();
        };

        return manager;
    }


    var init = function (key) {
        _url = 'https://api.logmatic.io/v1/input/' + key;
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

        // Do nothing if the linger is locked, already scheduled
        if (_lingerManager.isLocked() || _lingerManager.isScheduled()) {
            return;
        }

        if (_lingerManager.isDisabled()) {
            post();
        } else {
            _lingerManager.postpone(post)
        }

    };


    var post = function () {

        // simple mutex to avoid multiple calls
        _lingerManager.lock();

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

        // Worst case: the first element was too big, do nothing
        if (data.length === 0) {
            _lingerManager.unlock();
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


        request.onerror = _lingerManager.handleResponse;
        request.onload = _lingerManager.handleResponse;


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
}));
