'use strict';

var pub = {};

/* eslint no-console: 0 */
pub.log = function (message, attachment) {
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'TEST') {
        if (attachment) {
            console.log(message, attachment);
        } else {
            console.log(message);
        }
    }
};

pub.logEvent = function (event, maskedProperties) {
    // Create copy so we don't distort the original event
    var eventCopy = JSON.parse(JSON.stringify(event));

    // Clean sensitive properties from both old and new event input
    if (eventCopy.ResourceProperties) {
        var resourceKeys = Object.getOwnPropertyNames(eventCopy.ResourceProperties);
        for (var i = 0; i < resourceKeys.length; i++) {
            if (maskedProperties.indexOf(resourceKeys[i]) > -1) {
                eventCopy.ResourceProperties[resourceKeys[i]] = '****masked****';
            }
        }
    }
    if (eventCopy.OldResourceProperties) {
        var oldResourceKeys = Object.getOwnPropertyNames(eventCopy.OldResourceProperties);
        for (var j = 0; j < oldResourceKeys.length; j++) {
            if (maskedProperties.indexOf(oldResourceKeys[j]) > -1) {
                eventCopy.OldResourceProperties[oldResourceKeys[j]] = '****masked****';
            }
        }
    }
    pub.log('Processing event:\n', JSON.stringify(eventCopy));
};

module.exports = pub;
