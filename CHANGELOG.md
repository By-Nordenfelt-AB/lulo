## 4.0.0
* Breaking release!
* Introducing async/await in plugins. Old plugins are no longer supported and must be updated.
  * See the example implementation for how to use Lulo with async/await
  * All official plugins that have been updated are at version >= 4.0.0
* `logEvents` has been renamed to `logEvent
* To migrate existing plugins, review the [plugin migration guide](https://by-nordenfelt-ab.github.io/lulo/migrating-plugins-to-v4.html)

## 3.1.0
* Added support for plugin level configuration overrides

## 3.0.0
* Added support for NoEcho in response. See https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/crpg-ref-responses.html
* `_NoEcho` is now a reserved property and cannot be used by plugins.

## 2.0.2
* Dropped support for older node versions
* Refactored a bit
* Updated example to include the Lulo Lambda function

## 1.0.0
* Updated dev dependencies

## 0.3.0
* Added event normalizer for optional use in plugins

## 0.2.0
* plugin.validate is no longer called on Delete events

## 0.1.4
* Removed dependency on aws-sdk

## 0.1.0
* Bug fixes, clean up and refactoring

## 0.0.1
* Initial release
