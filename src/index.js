const log       = require('log4njs').options({ hideDate: true });
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

/* eslint global-require: 0 */
Lulo.prototype.handler = function (event, context, callback) {
    const logResponse = this.logResponse;
    if (this.logEvents) {
        logEvent(event, this.maskedProperties);
    }

    const pluginName = event.ResourceType.split('::')[1];
    if (!this.plugins[pluginName]) {
        if (event.RequestType === 'Delete') {
            return cfnResponse();
        }
        return cfnResponse(new Error('Unknown resource type: ' + event.ResourceType));
    }

    log.info('Loading Custom Resource', pluginName);
    const plugin = this.plugins[pluginName];

    /* istanbul ignore else */
    if (plugin.schema && typeof plugin.schema) {
        log.info('Normalizing event using plugin schema', JSON.stringify(plugin.schema));
        event = normalize(event, plugin.schema);
        log.info('Event normalized', JSON.stringify(event));
    }

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
