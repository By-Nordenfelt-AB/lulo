/**
 * Cloudformation automatically casts all property values to string which
 * is not always accepted by the nodejs sdk for other types suh as integers and booleans.
 * This module provides the means to define a simple schema for type casting of
 * primitive types back to their original type.
 * Supported types are boolean, integer and numeric (integer or float).
 * It handles nested properties as well as array properties.
 */
const log = require('log4njs').options({ hideDate: true });

module.exports = function (event, schema) {
    event.ResourceProperties = normalize(event.ResourceProperties, schema);
    if (event.OldResourceProperties) {
        event.OldResourceProperties = normalize(event.OldResourceProperties, schema);
    }
    return event;
};

function normalize(resourceProperties, schema) {
    const keys = Object.getOwnPropertyNames(resourceProperties);
    keys.forEach(function (key) {
        if (schema[key]) {
            if (schema[key].type === 'object') {
                resourceProperties[key] = normalize(resourceProperties[key], schema[key].schema);
            } else if (schema[key].type === 'array') {
                if (typeof schema[key].schema === 'string') { // primitive array
                    resourceProperties[key] = normalizePrimitiveArrayProperty(resourceProperties[key], key, schema[key].schema);
                } else { // complex array
                    for (let i = 0; i < resourceProperties[key].length; i++) {
                        resourceProperties[key][i] = normalize(resourceProperties[key][i], schema[key].schema);
                    }
                }
            } else {
                resourceProperties[key] = normalizeProperty(resourceProperties[key], key, schema[key].type);
            }
        }
    });
    return resourceProperties;
}

function normalizePrimitiveArrayProperty(arrayProperty, key, type) {
    for (let i = 0; i < arrayProperty.length; i++) {
        arrayProperty[i] = normalizeProperty(arrayProperty[i], key, type);
    }
    return arrayProperty;
}

function normalizeProperty(property, key, type) {
    switch (type) {
        case 'boolean':
            property = property === 'true';
            break;
        case 'integer':
            property = parseInt(property);
            break;
        case 'numeric':
            property = parseFloat(property);
            break;
        default:
            log.warn('Unknown schema property type', { key: key, type: type });
    }
    return property;
}
