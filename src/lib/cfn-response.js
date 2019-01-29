/**
 Copyright 2015 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
 This file is licensed to you under the AWS Customer Agreement (the 'License').
 You may not use this file except in compliance with the License.
 A copy of the License is located at http://aws.amazon.com/agreement/.
 This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied.
 See the License for the specific language governing permissions and limitations under the License.
 */
/* istanbul ignore file */
const log       = require('log4njs')();
const https = require('https');
const url   = require('url');

const SUCCESS = 'SUCCESS';
const FAILED  = 'FAILED';

/* eslint max-params: 0 */
module.exports = (error, response, event, context, logResponse, callback) => {
    let responseStatus = SUCCESS;
    let responseData   = response;
    let responseReason = '';

    if (error) {
        responseStatus = FAILED;
        responseData   = {
            error: error.toString()
        };
        responseReason = responseData.error + '. ';
    } else if (!responseData) {
        responseData = { success: true };
    }

    responseReason += 'Details in CloudWatch Log Stream: ' + context.logStreamName;

    const requestBody = JSON.stringify({
        Status: responseStatus,
        Reason: responseReason,
        PhysicalResourceId: responseData.physicalResourceId || event.PhysicalResourceId || context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData,
        NoEcho: !!event.ResourceProperties._NoEcho
    });

    const parsedUrl = url.parse(event.ResponseURL);
    const options   = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: 'PUT',
        headers: {
            'content-type': '',
            'content-length': requestBody.length
        }
    };

    if (logResponse) {
        log.info('Response', JSON.stringify(requestBody));
    }

    const request = https.request(options, function (httpResponse) {
        log.info('Status code: ' + httpResponse.statusCode);
        log.info('Status message: ' + httpResponse.statusMessage);
        callback();
    });

    request.on('error', (error) => {
        log.error('send(..) failed executing https.request(..): ', error);
        callback();
    });

    request.write(requestBody);
    request.end();
};
