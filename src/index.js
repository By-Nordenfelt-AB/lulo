const log = require('log4njs')();
const response = require('./lib/cfn-response');
const logEvent = require('./lib/log-event');
const normalize = require('./lib/normalize');

module.exports = Lulo;

/**
 *
 * @param [options] Additional options
 * @returns {Lulo}
 * @constructor
 */
function Lulo(options = {}) {
    if (!(this instanceof Lulo)) {
        return new Lulo(options);
    }

    this.logEvents = options.logEvents || false;
    this.logResponse = options.logResponse || false;
    this.maskedProperties = options.maskedProperties || [];
    this.plugins = {};
}

/**
 * Register a new custom resource plugin
 * @param resourceName
 * @param resource
 * @param options
 * @returns {Lulo}
 */
Lulo.prototype.register = function (resourceName, resource, options = {}) {
    if (this.plugins[resourceName]) {
        throw new Error('Trying to register same plugin name twice: ' + resourceName);
    }
    this.plugins[resourceName] = {
        resource,
        options,
    };

    return this;
};

Lulo.prototype.handler = function (event, context, callback) {
    let plugin;
    let logResponse = false;

    try {
        plugin = this.loadPlugin(event);
        if (plugin === null) {
            return cfnResponse();
        }

        logResponse = this.shouldLogResponse(plugin.options);
        if (this.shouldLogEvent(plugin.options)) {
            logEvent(event, this.getMaskedProperties(plugin.options));
        }

        event = this.transformSchema(event, plugin);
        this.validateInput(event, plugin);
    } catch (error) {
        return cfnResponse(error);
    }

    switch (event.RequestType) {
        case 'Create':
            return plugin.resource.create(event, context, cfnResponse);
        case 'Delete':
            return plugin.resource.delete(event, context, cfnResponse);
        default:
            return plugin.resource.update(event, context, cfnResponse);
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
        plugin.resource.validate(event);
    }
};

Lulo.prototype.transformSchema = function (event, plugin) {
    /* istanbul ignore else */
    if (plugin.resource.schema && typeof plugin.resource.schema) {
        log.info('Normalizing event using plugin schema', JSON.stringify(plugin.resource.schema));
        event = normalize(event, plugin.resource.schema);
        log.info('Event normalized', JSON.stringify(event));
    }
    return event;
};

Lulo.prototype.shouldLogResponse = function (options) {
    if (options && typeof options.logResponse === 'boolean') {
        return options.logResponse;
    }

    return this.logResponse;
};

Lulo.prototype.shouldLogEvent = function (options) {
    if (options && typeof options.logEvents === 'boolean') {
        return options.logEvents;
    }

    return this.logEvents;
};

Lulo.prototype.getMaskedProperties = function (options) {
    if (options && Array.isArray(options.maskedProperties)) {
        return options.maskedProperties;
    }

    return this.maskedProperties;
};
