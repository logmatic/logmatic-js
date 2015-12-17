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
    <script type="text/javascript" src="../src/logmatic.min.js"></script>
    <script>
      // Set your API key
      logmatic.init('<your_api_key>');

      // OPTIONAL init methods
      // add some meta attributes in final JSON
      logmatic.setMetas({'userId': '1234'});
      // fwd any error using 'exception' as JSON attr
      logmatic.setSendConsoleErrors('exception');
      // fwd any console log using 'level' as JSON attr
      logmatic.setSendConsoleLogs('level');
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

Or using npm:

    npm install --save logmatic/logmatic-js#master

```javascript
// commonjs
var logmatic = require('logmatic-js');
// ES2015
import logmatic from 'logmatic-js';

// Set your API key
logmatic.init('<your_api_key>');
// ...
// same as before
```

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
| setMetas(&lt;object&gt;) | add some meta attributes in final JSON | `.setMetas({ 'userId': '1234' })` |
| setSendConsoleErrors(&lt;exception_attr&gt;, {addStrackTrace: false}) | fwd any error using exception_attr as JSON attr | `.setSendConsoleErrors('exception', { addStrackTrace: true});`|
| | addStrackTrace: Add the stack trace associated with the error |
| setSendConsoleLogs(&lt;level_attr&gt;) | fwd any console log using level_attr" as JSON attr | `.setSendConsoleLogs('level')`|
| setIPTracking(&lt;ip_attr&gt;) | resolve client IP and copy it @ ip_attr | `.setIPTracking('client.IP')`|
| setUserAgentTracking(&lt;ua_attr&gt;) | resolve client UA and copy it @ ua_attr | `.setUserAgentTracking('client.user-agent')`|
| setURLTracking(&lt;url_attr&gt;) | resolve URL and copy it @ url_attr | `.setURLTracking('url')`|
| setBulkOptions({ lingerMs: &lt;duration in ms&gt;, maxPostCount: &lt;count&gt;, maxWaitingCount: &lt;count&gt; }) | Options to configure the bulking behavior. Bulking limits the number of requests emitted. | `.setBulkOptions({ lingerMs: 500, maxPostCount: 10, maxWaitingCount: -1 })`|
| | lingerMs: A delay used to give a change to bulk a few line of logs together |
| | maxPostCount: How many log lines should each post send at most (-1 no limit) |
| | maxWaitingCount: How many log lines can be queued before dropping some (-1 no limit) |
