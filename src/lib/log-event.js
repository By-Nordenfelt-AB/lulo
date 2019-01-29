const log = require('log4njs')();

module.exports = (event, maskedProperties) => {
    maskedProperties = maskedProperties || [];
    // Create copy so we don't distort the original event
    const eventCopy = JSON.parse(JSON.stringify(event));

    // Clean sensitive properties from both old and new event input
    if (eventCopy.ResourceProperties) {
        eventCopy.ResourceProperties = cleanProperties(eventCopy.ResourceProperties, maskedProperties);
    }
    if (eventCopy.OldResourceProperties) {
        eventCopy.OldResourceProperties = cleanProperties(eventCopy.OldResourceProperties, maskedProperties);
    }

    log.info('Processing event:\n', JSON.stringify(eventCopy));
};

function cleanProperties(properties, maskedProperties) {
    const propertyKeys = Object.getOwnPropertyNames(properties);
    for (let key of propertyKeys) {
        if (maskedProperties.indexOf(key) > -1) {
            properties[key] = '****masked****';
        }
    }

    return properties;
}
