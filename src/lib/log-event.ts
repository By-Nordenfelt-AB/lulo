import { getLogger } from 'log4njs';

const log = getLogger();

export function logEvent(event: any, maskedProperties: string[] = []) {
    // Create copy so we don't distort the original event
    const eventCopy = JSON.parse(JSON.stringify(event));

    // Clean sensitive properties from both old and new event input
    if (eventCopy.ResourceProperties) {
        eventCopy.ResourceProperties = _cleanProperties(eventCopy.ResourceProperties, maskedProperties);
    }
    if (eventCopy.OldResourceProperties) {
        eventCopy.OldResourceProperties = _cleanProperties(eventCopy.OldResourceProperties, maskedProperties);
    }

    log.info('Processing event:', { event: eventCopy });
}

/**
 * Masks properties according to the provided config
 * @param {object} properties
 * @param {Array<String>} maskedProperties List of property names to mask.
 * @returns {object}
 * @private
 */
function _cleanProperties(properties: any, maskedProperties: string[]): any {
    const propertyKeys = Object.getOwnPropertyNames(properties);
    for (const key of propertyKeys) {
        if (maskedProperties.indexOf(key) > -1) {
            properties[key] = '****masked****';
        }
    }
    return properties;
}
