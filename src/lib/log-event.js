const log = require('log4njs').options({ hideDate: true });

module.exports = (event, maskedProperties) => {
    // Create copy so we don't distort the original event
    const eventCopy = JSON.parse(JSON.stringify(event));

    // Clean sensitive properties from both old and new event input
    if (eventCopy.ResourceProperties) {
        const resourceKeys = Object.getOwnPropertyNames(eventCopy.ResourceProperties);
        for (let i = 0; i < resourceKeys.length; i++) {
            if (maskedProperties.indexOf(resourceKeys[i]) > -1) {
                eventCopy.ResourceProperties[resourceKeys[i]] = '****masked****';
            }
        }
    }
    if (eventCopy.OldResourceProperties) {
        const oldResourceKeys = Object.getOwnPropertyNames(eventCopy.OldResourceProperties);
        for (let j = 0; j < oldResourceKeys.length; j++) {
            if (maskedProperties.indexOf(oldResourceKeys[j]) > -1) {
                eventCopy.OldResourceProperties[oldResourceKeys[j]] = '****masked****';
            }
        }
    }
    log.info('Processing event:\n', JSON.stringify(eventCopy));
};
