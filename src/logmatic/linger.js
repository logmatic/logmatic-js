var LingerManager = function (lingerPeriodMs) {

  // static configuration properties
  var MODE = {};
  MODE.IMMEDIATE = 0;
  MODE.IMMEDIATE = 1;
  MODE.IMMEDIATE = 2;

  // class constants
  const _backOffPeriodMs = 500;
  const _backOffMaxPeriodMs = 30 * 1000;

  // private fields
  var _alarm = null;
  var _mode = MODE.LINGER;
  var _backOffFactor = 0;
  var _lingerPeriodMs = lingerPeriodMs;


  // Cancel the action scheduled
  var reset = function () {
    if (isScheduled()) {
      clearTimeout(_alarm);
    }
    _alarm = null;
  };

  // Check if an action is already scheduled
  var isScheduled = function () {
    return _alarm !== null;
  };

  // Configure the linger behavior
  var setMode = function (mode) {
    _mode = mode;
    if (_mode !== MODE.ERROR) {
      // reset the back-off factor
      _backOffFactor = 0;
    }
  };

  // Send or postpone an action depending on the current state
  var postpone = function (_callback) {

    var timeMs = 0;
    reset();

    switch (_mode) {
      // force to be fired now
      case MODE.IMMEDIATE:
        timeMs = 0;
        break;
      // postpone the action
      case MODE.LINGER:
        timeMs = _lingerPeriodMs;
        break;
      // in case of an error, use a backoff period before retry
      case MODE.ERROR:
        var backOffPeriodMs = _backOffPeriodMs * Math.pow(2, _backOffFactor);
        _backOffFactor++;
        timeMs = Math.min(backOffPeriodMs, _backOffMaxPeriodMs);
    }

    // defer the callback
    _alarm = setTimeout(_callback, timeMs);

  };

  return {
    MODE: MODE,
    setMode: setMode,
    reset: reset,
    postpone: postpone,
    isScheduled: isScheduled
  };

};

export default LingerManager;