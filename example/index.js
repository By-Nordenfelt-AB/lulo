/* istanbul ignore file */
const Lulo = require('lulo');

const lulo = new Lulo.Lulo({ logEvent: true, logResponse: true })
    .register('StackProperties', { plugin: require('lulo-plugin-stack-properties') });

exports.handler = async (event, context) => {
    await lulo.handler(event, context);
};
