# logmatic-js

Client-side JavaScript logging library for Logmatic.io

## Features

- Use the library as a logger. Everything is forwarded to Logmatic.io as JSON documents.
- Metas and extra attributes
- Forward every JavaScript errors (optional)
- Forward JavaScript's console logs (optional)
- Track real client IP address and user-agent (optional)
- Automatic bulk posts (default to 500ms linger delay and 10 messages max per POST)
- Small minified script < 2kb

## Quick Start

### Load and initialize logger

You simply have to include the minified script and initialize it with your write API key that can be found on your *Logmatic.io* platform.

```html
<html>
  <head>
    <title>Example to send logs to Logmatic.io</title>
    <script type="text/javascript" src="<path_to_tracekit>/tracekit/tracekit.js"></script> //OPTIONAL but provides better error handling
    <script type="text/javascript" src="<path_to_logmatic>/src/logmatic.min.js"></script>
    <script>
      // Set your API key
      logmatic.init('<your_api_key>');

      // OPTIONAL init methods
      // add some meta attributes in final JSON
      logmatic.setMetas({'userId': '1234'});
      // fwd any error using 'exception' as JSON attr
      logmatic.setSendErrors('exception');
      // fwd any console log using 'severity' as JSON attr
      logmatic.setSendConsoleLogs('severity');
      // resolve client IP and copy it @ 'client.IP'
      logmatic.setIPTracking('client.IP');
      // resolve client UA and copy it @ 'client.user-agent'
      logmatic.setUserAgentTracking('client.user-agent');
      // resolve URL and copy it @ 'url'
      logmatic.setURLTracking('url');
      // Default bulking setting - OPTIONAL modifications allowed
      logmatic.setBulkOptions({ lingerMs: 500, maxPostCount: 10, maxWaitingCount: -1 })
	</script>
    ...
  </head>
...
</html>
```

#### Using npm:

`npm install --save tracekit@0.3.1` //OPTIONAL but provides better error handling
`npm install --save logmatic/logmatic-js#master`

```javascript
// commonjs
var TraceKit = require('tracekit'); //OPTIONAL but provides better error handling
var logmatic = require('logmatic-js');

// ES2015
import TraceKit from 'tracekit'; //OPTIONAL but provides better error handling
import logmatic from 'logmatic-js';

// Set your API key
logmatic.init('<your_api_key>');
// ...
// same as before
```

### Handling of errors

You can handle errors by calling the `setSendErrors` initialization method. By default, logmatic-js catches all the errors from `window.onerror`.

However, we **truelly advise you to use TraceKit** which is automatically recognized by logmatic-js and takes precedence over the former method.
[TraceKit](https://github.com/csnover/TraceKit) gives you:
- Stack traces when errors are properly fired
- Resolves source maps for minified files
- Resolves name of the method & add context

Please read their documentation for more details and options.

### Log some events

To log some events you simply there is simple an unique method called *log(<message>,<context>)*. The message is a piece of text, the context is an object that you want to associate to the message.

```html
...
<script>
...
logmatic.log('Button clicked', { name: 'My button name' });
...
</script>
...
```

To clearly explain what happens here, in this exact situation where everything is configured as above the API POSTs the following JSON content to *Logmatic.io*'s API.:

```
{
  "severity": "info",
  "userId: "1234",
  "name": "My button name",
  "message": "Button clicked",
  "url": "...",
  "client" {
    "IP" : "109.30.xx.xxx",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.130 Safari/537.36"
  }
}
```

### Try the `test-client.html` page

In `test/`, you'll find a test html page called `test-client.html` you can use to make some quick test.
We encourage you to have a look at it as you'll be able to shoot a some log events in a few seconds.

Just don't forget to set your own API key.

## API

You must call the init method to configure the logger:
```
logmatic.init(<your_api_key>);
```

There is only one method to send log events to *Logmatic.io*:
```
logmatic.log(<message>,<context>);
```

You can also use all the following parameters using the right method:

| Method        | Description           |  Example  |
| ------------- | ------------- |  ----- |
| setMetas(<object>) | add some meta attributes in final JSON | `.setMetas({ 'userId': '1234' })` |
| setSendErrors(<exception_attr>) | fwd any error using exception_attr as JSON attr | `.setSendConsoleErrors('exception');`|
| setSendConsoleLogs(<level_attr>) | fwd any console log using level_attr" as JSON attr | `.setSendConsoleLogs('level')`|
| setIPTracking(<ip_attr>) | resolve client IP and copy it @ ip_attr | `.setIPTracking('client.IP')`|
| setUserAgentTracking(<ua_attr>) | resolve client UA and copy it @ ua_attr | `.setUserAgentTracking('client.user-agent')`|
| setURLTracking(<url_attr>) | resolve URL and copy it @ url_attr | `.setURLTracking('url')`|
| setBulkOptions({ lingerMs: <duration in ms>, maxPostCount: <count>, maxWaitingCount: <count> }) | Options to configure the bulking behavior. Bulking limits the number of requests emitted. | `.setBulkOptions({ lingerMs: 500, maxPostCount: 10, maxWaitingCount: -1 })`|
| | lingerMs: A delay used to give a change to bulk a few line of logs together |
| | maxPostCount: How many log lines should each post send at most (-1 no limit) |
| | maxWaitingCount: How many log lines can be queued before dropping some (-1 no limit) |
