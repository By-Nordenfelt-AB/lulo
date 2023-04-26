/**
 * Cloudformation automatically casts all property values to string which
 * is not always accepted by the nodejs sdk for other types such as integers and booleans.
 * This module provides the means to define a simple schema for type casting of
 * primitive types back to their original type.
 * Supported types are boolean, integer and numeric (integer or float).
 * It handles nested properties as well as array properties.
 */
import { getLogger } from 'log4njs';

const log = getLogger();

export function normalize(event: any, schema: any) {
    event.ResourceProperties = _normalizeProperty(event.ResourceProperties, schema);
    if (event.OldResourceProperties != null) {
        event.OldResourceProperties = _normalizeProperty(event.OldResourceProperties, schema);
    }
    return event;
}

function _normalizeProperty(resourceProperties: any, schema: any) {
    const keys = Object.getOwnPropertyNames(resourceProperties);
    for (const key of keys) {
        if (schema[key]) {
            if (schema[key].type === 'object') {
                resourceProperties[key] = _normalizeProperty(resourceProperties[key], schema[key].schema);
            } else if (schema[key].type === 'array') {
                if (typeof schema[key].schema === 'string') { // primitive array
                    resourceProperties[key] = _normalizePrimitiveArrayProperty(resourceProperties[key], key, schema[key].schema);
                } else { // complex array
                    for (let i = 0; i < resourceProperties[key].length; i++) {
                        resourceProperties[key][i] = _normalizeProperty(resourceProperties[key][i], schema[key].schema);
                    }
                }
            } else {
                resourceProperties[key] = _normalizePropertyValue(resourceProperties[key], key, schema[key].type);
            }
        }
    }

    return resourceProperties;
}

function _normalizePrimitiveArrayProperty(arrayProperty: string[] | number[] | boolean[], key: string, type: string): string[] | number[] | boolean[] {
    for (let i = 0; i < arrayProperty.length; i++) {
        arrayProperty[i] = _normalizePropertyValue(arrayProperty[i], key, type);
    }
    return arrayProperty;
}

function _normalizePropertyValue(propertyValue: string | number | boolean, key: string, type: string): string | number | boolean {
    switch (type) {
        case 'boolean':
            return propertyValue === 'true';
        case 'integer':
            return parseInt(propertyValue as string, 10);
        case 'numeric':
            return parseFloat(propertyValue as string);
        default:
            log.warning('Unknown schema property type', { key, type });
            return propertyValue;
    }

}
