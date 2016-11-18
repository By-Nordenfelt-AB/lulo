'use strict';

var response = require('./lib/cfn-response');
var logger = require('./lib/logger');

module.exports = Lulo;

function Lulo(options) {
    options = options || {};
    if (!(this instanceof Lulo)) {
        return new Lulo(options);
    }

    this.logEvents = options.logEvents;
    this.logResponse = options.logResponse;
    this.maskedProperties = options.maskedProperties || [];
    this.plugins = {};
}

/*
 * Register a new custom resource type
 *
 */
Lulo.prototype.register = function (resourceName, resource) {
    if (this.plugins[resourceName]) {
        throw new Error('Trying to register same plugin name twice: ' + resourceName);
    }
    this.plugins[resourceName] = resource;
    return this;
};

/* eslint global-require: 0 */
Lulo.prototype.handler = function (event, context, callback) {
    var logResponse = this.logResponse;
    if (this.logEvents) {
        logger.logEvent(event, this.maskedProperties);
    }

    var pluginName = event.ResourceType.split('::')[1];
    if (!this.plugins[pluginName]) {
        if (event.RequestType === 'Delete') {
            return cfnResponse();
        }
        return cfnResponse(new Error('Unknown resource type: ' + event.ResourceType));
    }

    logger.log('Loading Custom Resource', pluginName);
    var plugin = this.plugins[pluginName];

    if (event.RequestType !== 'Delete') {
        try {
            plugin.validate(event);
        } catch (error) {
            return cfnResponse(error);
        }
    }

    switch (event.RequestType) {
        case 'Create':
            return plugin.create(event, context, cfnResponse);
        case 'Delete':
            return plugin.delete(event, context, cfnResponse);
        default:
            return plugin.update(event, context, cfnResponse);
    }

    function cfnResponse(error, responseData) {
        response(error, responseData, event, context, logResponse, callback);
    }
};
