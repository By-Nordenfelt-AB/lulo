import { normalize } from '../lib/normalize';

describe('Index unit tests', () => {
    let subject: typeof import('../index');
    let event: any;

    const validateEventStub = jest.fn();
    const createResourceStub = jest.fn();
    const updateResourceStub = jest.fn();
    const deleteResourceStub = jest.fn();
    const pluginMock = {
        validateEvent: validateEventStub,
        createResource: createResourceStub,
        updateResource: updateResourceStub,
        deleteResource: deleteResourceStub,
    };
    const contextMock = {
        awsRequestId: 'awsRequestId',
        callbackWaitsForEmptyEventLoop: false,
        functionName: 'functionName',
        functionVersion: 'functionVersion',
        invokedFunctionArn: 'invokedFunctionArn',
        logGroupName: 'logGroupName',
        logStreamName: 'logStreamName',
        memoryLimitInMB: 'memoryLimitInMB',
        done(_error?: Error, _result?: any): void {
        },
        fail(_error: Error | string): void {
        },
        getRemainingTimeInMillis(): number {
            return 0;
        },
        succeed(_messageOrObject: any, _object?: any): void {
        },
    };

    const logEventStub = jest.fn();
    jest.mock('../lib/log-event', () => ({
        logEvent: logEventStub,
    }));

    const normalizeMock = jest.fn();
    jest.mock('../lib/normalize', () => ({
        normalize: normalizeMock,
    }));

    const responseSuccessStub = jest.fn();
    const responseErrorStub = jest.fn();
    jest.mock('../lib/cfn-response', () => ({
        responseSuccess: responseSuccessStub,
        responseError: responseErrorStub,
    }));

    beforeAll(() => {
        subject = require('../index');
    });

    beforeEach(() => {
        event = {
            RequestType: 'Create',
            ResourceType: 'Custom::PluginName',
            ResourceProperties: {
                Property1: 'test1',
                Property2: '1',
                Property3: 'true',
            },
            OldResourceProperties: {
                OldProperty: 'test2',
            },
        };
    });

    describe('__construct', () => {
        it('should succeed', () => {
            const lulo = new subject.Lulo();
            expect(typeof lulo === 'object').toBe(true);
        });
    });

    describe('register', () => {
        it('should succeed', (done) => {

            const lulo = new subject.Lulo();
            expect(lulo['plugins'].size).toBe(0);

            lulo.register('testPlugin', pluginMock);

            expect(lulo['plugins'].size).toBe(1);
            done();
        });
        it('should fail on duplicate', () => {
            expect(registerDuplicate).toThrow(/Trying to register same plugin name twice/);

            function registerDuplicate() {
                new subject.Lulo()
                    .register('testPlugin', pluginMock)
                    .register('otherPlugin', pluginMock)
                    .register('testPlugin', pluginMock);
            }
        });
    });

    describe('handler', () => {
        describe('Configuration Flow Control', () => {
            describe('Log Event', () => {
                it('Should log event from Lulo config', async () => {
                    await new subject.Lulo({ logEvent: true })
                        .register('PluginName', pluginMock)
                        .handler(event, contextMock);
                    expect(logEventStub).toHaveBeenCalledTimes(1);
                });
                it('Should not log event from Lulo config', async () => {
                    await new subject.Lulo()
                        .register('PluginName', pluginMock)
                        .handler(event, contextMock);
                    expect(logEventStub).toHaveBeenCalledTimes(0);
                });
                it('Should log event from plugin config', async () => {
                    await new subject.Lulo()
                        .register('PluginName', pluginMock, { logEvent: true })
                        .handler(event, contextMock);
                    expect(logEventStub).toHaveBeenCalledTimes(1);
                });
                it('Should not log event from plugin config', async () => {
                    await new subject.Lulo({ logEvent: true })
                        .register('PluginName', pluginMock, { logEvent: false })
                        .handler(event, contextMock);
                    expect(logEventStub).toHaveBeenCalledTimes(0);
                });
            });

            describe('Log Response', () => {
                it('Should log response from Lulo config', async () => {
                    await new subject.Lulo({ logResponse: true })
                        .register('PluginName', pluginMock)
                        .handler(event, contextMock);
                    expect(responseSuccessStub).toBeCalledWith(event, contextMock, true, undefined);
                });
                it('Should not log response from Lulo config', async () => {
                    await new subject.Lulo()
                        .register('PluginName', pluginMock)
                        .handler(event, contextMock);
                    expect(responseSuccessStub).toBeCalledWith(event, contextMock, false, undefined);
                });
                it('Should log response from plugin config', async () => {
                    await new subject.Lulo()
                        .register('PluginName', pluginMock, { logResponse: true })
                        .handler(event, contextMock);
                    expect(responseSuccessStub).toBeCalledWith(event, contextMock, true, undefined);
                });
                it('Should not log response from plugin config', async () => {
                    await new subject.Lulo({ logResponse: true })
                        .register('PluginName', pluginMock, { logResponse: false })
                        .handler(event, contextMock);
                    expect(responseSuccessStub).toBeCalledWith(event, contextMock, false, undefined);
                });
            });

            describe('Masked Properties', () => {
                it('Should not mask any properties', async () => {
                    await new subject.Lulo({ logEvent: true })
                        .register('PluginName', pluginMock)
                        .handler(event, contextMock);
                    expect(logEventStub).toBeCalledWith(event, []);
                });
                it('Should mask properties from Lulo config', async () => {
                    await new subject.Lulo({ logEvent: true, maskedProperties: ['Property2'] })
                        .register('PluginName', pluginMock)
                        .handler(event, contextMock);
                    expect(logEventStub).toBeCalledWith(event, ['Property2']);
                });
                it('Should mask properties from plugin config', async () => {
                    await new subject.Lulo({ logEvent: true, maskedProperties: ['Property2'] })
                        .register('PluginName', pluginMock, { maskedProperties: ['Property3'] })
                        .handler(event, contextMock);
                    expect(logEventStub).toBeCalledWith(event, ['Property3']);
                });
            });
        });

        it('Create should succeed', async () => {
            await new subject.Lulo({ logEvent: true })
                .register('PluginName', pluginMock)
                .handler(event, contextMock);

            expect(logEventStub).toHaveBeenCalledTimes(1);
            expect(responseSuccessStub).toHaveBeenCalledTimes(1);
            expect(responseSuccessStub).toBeCalledWith(event, contextMock, false, undefined);
            expect(validateEventStub).toHaveBeenCalledTimes(1);
            expect(createResourceStub).toHaveBeenCalledTimes(1);
            expect(updateResourceStub).toHaveBeenCalledTimes(0);
            expect(deleteResourceStub).toHaveBeenCalledTimes(0);
        });

        it('Update should succeed, with plugin specific configuration', async () => {
            event.RequestType = 'Update';

            await new subject.Lulo()
                .register('PluginName', pluginMock)
                .handler(event, contextMock);

            expect(logEventStub).toHaveBeenCalledTimes(0);
            expect(responseSuccessStub).toHaveBeenCalledTimes(1);
            expect(responseSuccessStub).toBeCalledWith(event, contextMock, false, undefined);
            expect(validateEventStub).toHaveBeenCalledTimes(1);
            expect(createResourceStub).toHaveBeenCalledTimes(0);
            expect(updateResourceStub).toHaveBeenCalledTimes(1);
            expect(deleteResourceStub).toHaveBeenCalledTimes(0);
        });

        it('Delete should succeed', async () => {
            event.RequestType = 'Delete';

            await new subject.Lulo()
                .register('PluginName', pluginMock)
                .handler(event, contextMock);

            expect(logEventStub).toHaveBeenCalledTimes(0);
            expect(responseSuccessStub).toHaveBeenCalledTimes(1);
            expect(responseSuccessStub).toBeCalledWith(event, contextMock, false, undefined);
            expect(validateEventStub).toHaveBeenCalledTimes(0);
            expect(createResourceStub).toHaveBeenCalledTimes(0);
            expect(updateResourceStub).toHaveBeenCalledTimes(0);
            expect(deleteResourceStub).toHaveBeenCalledTimes(1);
        });
    });

    describe('Error handling', () => {
        it('Should fail if plugin does not exist on create', async () => {
            event.ResourceType = 'Custom::BadPlugin';
            await new subject.Lulo()
                .register('PluginName', pluginMock)
                .handler(event, contextMock);

            expect(responseSuccessStub).toHaveBeenCalledTimes(0);
            expect(responseErrorStub).toHaveBeenCalledTimes(1);
            expect(responseErrorStub).toBeCalledWith(event, contextMock, false, new Error('Unknown resource type: Custom::BadPlugin'));
            expect(validateEventStub).toHaveBeenCalledTimes(0);
            expect(createResourceStub).toHaveBeenCalledTimes(0);
            expect(updateResourceStub).toHaveBeenCalledTimes(0);
            expect(deleteResourceStub).toHaveBeenCalledTimes(0);
        });

        it('Should not fail if plugin does not exist on delete', async () => {
            event.RequestType = 'Delete';
            event.ResourceType = 'Custom::BadPlugin';
            await new subject.Lulo()
                .register('PluginName', pluginMock)
                .handler(event, contextMock);

            expect(responseSuccessStub).toHaveBeenCalledTimes(1);
            expect(responseSuccessStub).toBeCalledWith(event, contextMock, false);
            expect(responseErrorStub).toHaveBeenCalledTimes(0);
            expect(validateEventStub).toHaveBeenCalledTimes(0);
            expect(createResourceStub).toHaveBeenCalledTimes(0);
            expect(updateResourceStub).toHaveBeenCalledTimes(0);
            expect(deleteResourceStub).toHaveBeenCalledTimes(0);
        });

        it('Should fail if plugin.validate throws error', async () => {
            validateEventStub.mockRejectedValueOnce(new Error('Validation Error'));
            await new subject.Lulo()
                .register('PluginName', pluginMock)
                .handler(event, contextMock);

            expect(responseSuccessStub).toHaveBeenCalledTimes(0);
            expect(responseErrorStub).toHaveBeenCalledTimes(1);
            expect(responseErrorStub).toBeCalledWith(event, contextMock, false, new Error('Validation Error'));
            expect(validateEventStub).toHaveBeenCalledTimes(1);
            expect(createResourceStub).toHaveBeenCalledTimes(0);
            expect(updateResourceStub).toHaveBeenCalledTimes(0);
            expect(deleteResourceStub).toHaveBeenCalledTimes(0);
        });
    });
});
