# lulo

lulo is a tiny plugin based framework for working with AWS CloudFormation Custom Resources.
lolu itself doesn't do much but is easily extended by registering plugins.

## Installation
```
$ npm install lulo --save
```

## Usage
### Example Lambda index.js
```node
'use strict';

var lulo = require('lulo');
lulo()
    .register('PluginNameSpace', require('lulo-plugin-name'))
    .register('AnotherPluginNameSpace', require('lulo-plugin-name-2'));

exports.handler = function (event, context, callback) {
    lulo.handler(event, context, callback);
};
```
(Yes, that is all the nodejs code you have to write)

Package your index.js and node_modules and deploy to Lambda (NodeJs4.3 runtime).

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
See the [/example](example) for a complete example

#### How it works
When you register a plugin you want to use you give it a name.
To invoke the plugin you name your Custom Resource `Custom::RegisteredPluginName`.

Each plugin works in different ways and may yield different types of results that you can interact with
in your templates.

## Plugins
### List of available plugins

* [Stack-Properties](https://github.com/carlnordenfelt/lulo-plugin-stack-properties): Yields Parameters, Outputs and Resources given another CloudFormation StackId or StackName.

### How to write a plugin
#### Plugin API
Each plugin must expse the following functions:
```
validate(event);
create(event, context, callback);
delete(event, context, callback);
update(event, context, callback);
```
##### validate(event)
Validate the incoming event.
validate is not expected to return anything but it is expected to
`throw Error(message)` on validation error.

##### create(event, context, callback)
Invoked when the custom resource is created.

##### update(event, context, callback)
Invoked when the custom resource is updated.

##### delete(event, context, callback)
Invoked when the custom resource is deleted.

##### Return values
Return values are provided as a *flat* object, keys cannot be nested.
If you need to namespace return values from a plugin, use dot.notation in the object keys.

If you want to set the PhysicalResourceId of the CustomResource, set
`response.physicalResourceId` to the value you want.

Your plugins are expected to run on the `NodeJS4.3` Lambda runtime.

#### Document permissions
Remember to document any additional IAM permissions your plugin requires.

#### List your plugin here
Update the README and submit a pull request to get your plugin listed here.

## Why Lulo?
Because it's a [very healthy fruit](https://en.wikipedia.org/wiki/Solanum_quitoense) :)

## License
[The MIT License (MIT)](/LICENSE)

## Change Log
[Change Log](/CHANGELOG.md)
