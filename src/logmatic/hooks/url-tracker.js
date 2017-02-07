module.exports =  function (event, props) {
  if (typeof(event) != 'object' || window == null || window.location == null) {
    return event;
  }

  var _urlTrackingAttributeName = props.urlTrackingAttributeName || null;
  var _hostTrackingAttributeName = props.hostTrackingAttributeName || "http.host";
  var _requestTrackingAttributeName = props.requestTrackingAttributeName || "http.request";

  if (_urlTrackingAttributeName) {
    event[_urlTrackingAttributeName] = window.location.href;
  }

  event[_requestTrackingAttributeName] = window.location.href.replace(window.location.origin, "");
  event[_hostTrackingAttributeName] = window.location.hostname;
  return event

};

