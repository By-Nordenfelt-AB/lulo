# lulo

lulo is a tiny plugin based framework for working with AWS CloudFormation Custom Resources.
lolu itself doesn't do much but is easily extended by registering plugins.

# Installation
```
$ npm install lulo
```

## Usage
### Example Lambda index.js
```node
'use strict';

var lulo = require('lulo');
lulo()
    .register('PluginNameSpace', require('lulo-plugin-name'))
    .register('AnotherPluginNameSpace', require('lulo-plugin-name-2'));

exports.handler = lulo.handler;
```
(Yes, that is all the nodejs code you have to write)

Package your index.js and node_modules and deploy to Lambda.

### AWS CloudFormation template
```javascript
{
    "MyCustomResourceName": {
        "Type": "Custom::PluginNameSpace",
        "Properties": {
            "ServiceToken": "{LAMBDA_ARN}",
            ...
        }
    },
    "MyOtherCustomResourceName": {
        "Type": "Custom::AnotherPluginNameSpace",
        "Properties": {
            "ServiceToken": "{LAMBDA_ARN}",
            ...
        }
    }
}
```

## Plugins
### List of available plugins
Coming soon...

### How to write a plugin
Coming soon...

## License
[The MIT License (MIT)](/LICENSE)

## Change Log
[Change Log](/CHANGELOG.md)
