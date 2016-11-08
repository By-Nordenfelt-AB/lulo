'use strict';
/* Copyright 2015 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
 This file is licensed to you under the AWS Customer Agreement (the 'License').
 You may not use this file except in compliance with the License.
 A copy of the License is located at http://aws.amazon.com/agreement/.
 This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied.
 See the License for the specific language governing permissions and limitations under the License. */

var logger = require('./logger');
var https = require('https');
var url = require('url');
var SUCCESS = 'SUCCESS';
var FAILED = 'FAILED';

/* eslint max-params: 0 */
exports = function (error, response, event, context, callback) {
    var responseStatus = SUCCESS;
    var responseData;
    var responseReason;
    if (error) {
        responseStatus = FAILED;
        responseData = {
            error: error.toString()
        };
        responseReason = responseData.error + '. ';
    } else if (!response) {
        responseData = { success: true };
    }

    responseReason += 'Details in CloudWatch Log Stream: ' + context.logStreamName;

    var requestBody = JSON.stringify({
        Status: responseStatus,
        Reason: responseReason,
        PhysicalResourceId: responseData.physicalResourceId || event.PhysicalResourceId || context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData
    });

    var parsedUrl = url.parse(event.ResponseURL);
    var options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: 'PUT',
        headers: {
            'content-type': '',
            'content-length': requestBody.length
        }
    };

    var request = https.request(options, function (httpResponse) {
        logger.log('Status code: ' + httpResponse.statusCode);
        logger.log('Status message: ' + httpResponse.statusMessage);
        callback();
    });

    request.on('error', function (error) {
        logger.log('send(..) failed executing https.request(..): ', error);
        callback();
    });

    request.write(requestBody);
    request.end();
};
