const log       = require('log4njs')();
const response  = require('./lib/cfn-response');
const logEvent  = require('./lib/log-event');
const normalize = require('./lib/normalize');

module.exports = Lulo;

function Lulo(options) {
    options = options || {};
    if (!(this instanceof Lulo)) {
        return new Lulo(options);
    }

    this.logEvents        = options.logEvents;
    this.logResponse      = options.logResponse;
    this.maskedProperties = options.maskedProperties || [];
    this.plugins          = {};
}

/**
 * Register a new custom resource type
 */
Lulo.prototype.register = function (resourceName, resource) {
    if (this.plugins[resourceName]) {
        throw new Error('Trying to register same plugin name twice: ' + resourceName);
    }
    this.plugins[resourceName] = resource;

    return this;
};

Lulo.prototype.handler = function (event, context, callback) {
    const logResponse = this.logResponse;
    if (this.logEvents) {
        logEvent(event, this.maskedProperties);
    }

    let plugin;
    try {
        plugin = this.loadPlugin(event);
        if (plugin === null) {
            return cfnResponse();
        }

        event = this.transformSchema(event, plugin);
        this.validateInput(event, plugin);
    } catch (error) {
        return cfnResponse(error);
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

Lulo.prototype.loadPlugin = function (event) {
    // Make sure that the requested plugin exists
    const pluginName = event.ResourceType.split('::')[1];
    if (!this.plugins[pluginName]) {
        log.info('Missing plugin, exiting', pluginName);
        if (event.RequestType === 'Delete') {
            log.info('Not causing failure since request is of type delete', pluginName);
            return null;
        }
        log.info('Causing failure since request is not of type delete', pluginName);
        throw new Error('Unknown resource type: ' + event.ResourceType);
    }

    log.info('Loading Custom Resource', pluginName);
    return this.plugins[pluginName];
};

Lulo.prototype.validateInput = function (event, plugin) {
    // Validate the input, skip on delete to avoid ending in ROLLBACK_FAILED state
    if (event.RequestType !== 'Delete') {
        plugin.validate(event);
    }
};

Lulo.prototype.transformSchema = function (event, plugin) {
    /* istanbul ignore else */
    if (plugin.schema && typeof plugin.schema) {
        log.info('Normalizing event using plugin schema', JSON.stringify(plugin.schema));
        event = normalize(event, plugin.schema);
        log.info('Event normalized', JSON.stringify(event));
    }
    return event;
};
