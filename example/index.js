const Lulo = require('lulo');

const lulo = Lulo({ logEvents: true, logResponse: true })
    .register('StackProperties', require('lulo-plugin-stack-properties'));

exports.handler = (event, context, callback) => {
    lulo.handler(event, context, callback);
};
