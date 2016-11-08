'use strict';

var Lulo = require('lulo');

var lulo = Lulo({ logEvents: true, logResponse: true })
    .register('StackProperties', require('lulo-plugin-stack-properties'));

exports.handler = function (event, context, callback) {
    lulo.handler(event, context, callback);
};
