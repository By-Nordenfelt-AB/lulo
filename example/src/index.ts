/* istanbul ignore file */
import { Lulo } from 'lulo';
import { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';

import * as luloPluginStackProperties from 'lulo-plugin-stack-properties';

const lulo = new Lulo()
    .register('StackProperties', luloPluginStackProperties);

export async function handler(event: CloudFormationCustomResourceEvent, context: Context): Promise<void> {
    await lulo.handler(event, context);
}
