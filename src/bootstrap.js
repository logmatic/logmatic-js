(function asyncLogmaticLoader(window, document, source, opts) {
  var queue = [];
  var fields = [];
  var hooks = [];
  var nop = function () {
  };
  window.logmatic = {
    addField: function () {
      fields.push(arguments);
    },
    log: function () {
      queue.push(arguments);
    },
    addHook: function () {
      hooks.push(arguments);
    },
    flush: nop,
    removeField: nop
  };

  var script = document.createElement('script');
  script.src = source;
  script.type = 'text/javascript';

  script.onload = function () {
    window.logmatic = window.LogmaticBuilder(opts)
      .build();
    for (var i = 0; i < hooks.length; i++) {
      window.logmatic.addHook.apply(window.logmatic, hooks[i]);
    }
    for (var j = 0; j < fields.length; j++) {
      window.logmatic.addField.apply(window.logmatic, fields[j]);
    }
    for (var k = 0; k < queue.length; k++) {
      window.logmatic.log.apply(window.logmatic, queue[k]);
    }
  };

  document.getElementsByTagName('head')[0].appendChild(script);

})(window, document, 'http://localhost:8000/dist/logmatic.js', {key: "<API_KEY>", appname: "customize-me"});
