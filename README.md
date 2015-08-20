# logmatic-js

Client-side JavaScript logging library for Logmatic.io

## Features

- Use the library as a logger. Everything is forwarded to Logmatic.io as JSON documents.
- Metas and extra attributes
- Forward every JavaScript errors (optional)
- Forward JavaScript's console logs (optional)
- Track real client IP address and user-agent (optional)
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
	</script>
    ...
  </head>
...
</html>
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
| setMetas(<object>) | add some meta attributes in final JSON | `.setMetas({ 'userId': '1234' })` |
| setSendConsoleErrors(<exception_attr>) | fwd any error using exception_attr as JSON attr | `.setSendConsoleErrors('exception');`|
| setSendConsoleLogs(<level_attr>) | fwd any console log using level_attr" as JSON attr | `.setSendConsoleLogs('level')`|
| setIPTracking(<ip_attr>) | resolve client IP and copy it @ ip_attr | `.setIPTracking('client.IP')`|
| setUserAgentTracking(<ua_attr>) | resolve client UA and copy it @ ua_attr | `.setUserAgentTracking('client.user-agent')`|
| setURLTracking(<url_attr>) | resolve URL and copy it @ url_attr | `.setURLTracking('url')`|
