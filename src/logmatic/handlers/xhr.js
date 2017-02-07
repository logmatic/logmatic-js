module.exports = function (logger, props) {


  var oldHandler = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function (method, url, async, user, password) {

    // todo

    if (oldHandler.apply) {
      oldHandler.apply(window, [method, url, async, user, password]);
    } else {
      oldHandler(method, url, async, user, password);
    }
  }
}

