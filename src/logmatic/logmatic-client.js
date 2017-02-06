import LingerManager from "./linger";
import Utils from "./utils";


var client = function (config) {


  //Bulk default options
  const _url = config.endpoint || null;
  const _bulkLingerMs = config.client.bulkLingerMs || 100;
  const _bulkMaxPostCount = config.client.bulkMaxPostCount || 10;
  const _bulkMaxWaitingCount = config.client.bulkMaxWaitingCount || -1;
  const _maxContentSize = config.client.maxContentSize || 200 * 1024;
  const _trackIp = config.client.IPTracking || true;
  const _trackUA = config.client.UATracking || true;
  const _ipTrackingAttributeName = config.client.ipTrackingAttributeName || "network.client_ip";
  const _uaTrackingAttributeName = config.client.uaTrackingAttributeName || "http.useragent";

  // private fields
  var _queue = [];


  var linger = LingerManager(_bulkLingerMs);

  // Check if all conditions are met before calling the POST method
  function _tryPost() {
    // do nothing if the linger already scheduled or if a post is running
    if (linger.isScheduled()) {
      return;
    }
    linger.postpone(post);
  }


  // Queue a message
  var queue = function (event) {

    /*

     if (item.length > _maxContentSize) {
     var newItem = {
     "severity": "error",
     "message": "Message dropped as its size exceeded the hard limit of " + _maxContentSize + " kBytes"
     };
     assign(_metas, newItem);
     newItem[_urlTrackingAttr] = window.location.href;
     item = _stringify(newItem);
     }
     // the warn will be send with the next tick/post/call

     // Worst-case: the first element was too big
     if (data.length === 0) {
     handleExit(0);
     return;
     }
     // Set metas
     assign(_metas, event);

     // URL tracking
     if (_urlTrackingAttr) {
     event[_urlTrackingAttr] = window.location.href;
     }
     */
    var data = Utils.stringify(event);
    if (data.length > _maxContentSize) {
      // element to big
    }

    _queue.push(data);

    // Check if we are growing above the max waiting count (if any)
    if (_bulkMaxWaitingCount >= 0 && _queue.length > _bulkMaxWaitingCount) {
      _queue.shift();
    }
    _tryPost();
  };


  var addHook = function (callback, properties) {
    _hooks.push({callback: callback, props: properties || {}});
  };


  // Send the data queued to the endpoint
  var post = function () {

    var data = [];
    var contentSize = 0;

    // Internal method in order to handle the response code after each request
    function handleExit(status) {
      // no errors
      if (status === 200 || status === 0) {
        if (_queue.length > 0) {
          // continue until the queue is empty
          linger.setMode(linger.MODE.IMMEDIATE);
        } else {
          // default mode
          linger.setMode(linger.MODE.LINGER);
        }
        // an error occurred, go to the error mode
      } else {
        // use a back-off mechanism
        linger.setMode(linger.MODE.ERROR);
      }

      // set all clear for the next call
      linger.reset();
      if (_queue.length !== 0) {
        _tryPost();
      }
    }

    // stack events expect if the total bulk size is reached
    while (_queue.length > 0 && data.length < _bulkMaxPostCount) {

      var item = _queue.shift();

      contentSize += item.length;
      if (contentSize > _maxContentSize) {
        _queue.unshift(item);
        break;
      }
      data.push(item)
    }

    // pack all events into a JSON stringify array
    var payload = '[' + data.join(',') + ']';


    // build the request object
    var request;
    if (typeof (XDomainRequest) !== 'undefined') { // IE8/9
      request = new XDomainRequest();
    } else {
      request = new XMLHttpRequest();
    }

    request.open('POST', _url, true);

    if (typeof (XDomainRequest) === 'undefined') {
      request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

      // IP tracking
      if (_trackIp) {
        request.setRequestHeader('X-Logmatic-Add-IP', _ipTrackingAttributeName);
      }
      // UserAgent tracking
      if (_trackUA) {
        request.setRequestHeader('X-Logmatic-Add-UserAgent', _uaTrackingAttributeName);
      }
    }

    request.onerror = function (response) {
      handleExit(response.target.status);
    };

    request.onload = function (response) {
      handleExit(response.target.status);
    };


    request.send(payload);

  };


  return {
    queue: queue,
    post: post
  }
};

export default client;