import Utils from "./utils";

var hooks = {
  // Add the URL metadata to the original Json object
  urlTracker: function (event, props) {
    if (typeof(event) != 'object') {
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

  },
  // Merge 2 json object into one
  attachContext: function (event, context) {
    return Utils.assign(context, event)
  }
};

export default hooks;