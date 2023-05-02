/**
 * Copyright 2015 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
 *  This file is licensed to you under the AWS Customer Agreement (the 'License').
 *  You may not use this file except in compliance with the License.
 *  A copy of the License is located at http://aws.amazon.com/agreement/.
 *  This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied.
 *  See the License for the specific language governing permissions and limitations under the License.
 */
/* istanbul ignore file */
import { getLogger } from 'log4njs';
import * as https from 'https';
import * as url from 'url';
import { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';
import { CloudFormationCustomResourceEventCommon } from 'aws-lambda/trigger/cloudformation-custom-resource';

const log = getLogger();

export async function responseError(event: CloudFormationCustomResourceEvent, context: Context, logResponse: boolean, error: Error) {
    const status = 'FAILED';
    const data = { error: error.toString() };
    const reason = `${data.error}. Details in CloudWatch Log Stream: ${context.logStreamName}`;

    await _respondToCfn({ status, reason, data }, event, context, logResponse);
}

export async function responseSuccess(event: CloudFormationCustomResourceEvent, context: Context, logResponse: boolean, data?: any) {
    const status = 'SUCCESS';
    const reason = `Details in CloudWatch Log Stream: ${context.logStreamName}`;
    if (!data) {
        data = { success: true };
    }

    await _respondToCfn({ status, reason, data }, event, context, logResponse);
}

async function _respondToCfn(response: { status: string, data: any, reason: string }, event: CloudFormationCustomResourceEvent, context: Context, logResponse: boolean) {
    const requestBody = JSON.stringify({
        Status: response.status,
        Reason: response.reason,
        PhysicalResourceId: _resolvePhysicalResourceId(response.data, event, context),
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: response.data,
        NoEcho: !!event.ResourceProperties._NoEcho,
    });

    const parsedUrl = url.parse(event.ResponseURL);
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: 'PUT',
        headers: {
            'content-type': '',
            'content-length': requestBody.length,
        },
    };

    if (logResponse) {
        log.info('Plugin Response', { requestBody });
    }

    try {
        const httpResponse = await _makeHttpsRequest(options, requestBody);
        log.info('Cfn Response', { statusCode: httpResponse.statusCode });
    } catch (error) {
        log.error('Cfn Request failed', { error });
    }
}

function _resolvePhysicalResourceId(data: any, event: CloudFormationCustomResourceEventCommon, context: Context) {
    if (data.physicalResourceId) {
        return data.physicalResourceId;
    } else if ('PhysicalResourceId' in event) {
        return event.PhysicalResourceId;
    }
    return context.logStreamName;
}

async function _makeHttpsRequest(options: any, requestBody: any): Promise<{ statusCode?: number }> {
    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            const chunks: string[] = [];
            res.on('data', chunk => chunks.push(chunk));

            res.on('end', () => {
                try {
                    const { statusCode } = res;
                    const body = chunks.join('');
                    resolve({ statusCode });
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(requestBody);
        req.end();
    });
}
