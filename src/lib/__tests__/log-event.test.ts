describe('Logger unit tests', () => {
    let subject: typeof import('../log-event');
    let event: { ResourceProperties?: object, OldResourceProperties?: object };

    const mockGetLogger = jest.fn();
    const mockInfoLog = jest.fn();
    mockGetLogger.mockReturnValue({ info: mockInfoLog });
    jest.mock('log4njs', () => ({
        getLogger: mockGetLogger,
    }));

    beforeAll(() => {
        subject = require('../log-event');
    });

    beforeEach(() => {
        jest.clearAllMocks();
        event = {
            ResourceProperties: {
                password: 'password',
                otherField1: 'otherField1',
            },
            OldResourceProperties: {
                password: 'password',
                otherField2: 'otherField2',
            },
        };
    });

    describe('handler', () => {
        it('Should log event without masking anything', () => {
            subject.logEvent(event, []);
            expect(mockInfoLog).toBeCalledTimes(1);
            expect(mockInfoLog).toBeCalledWith('Processing event:', {
                event: {
                    ResourceProperties: { otherField1: 'otherField1', password: 'password' },
                    OldResourceProperties: { otherField2: 'otherField2', password: 'password' },
                },
            });
        });

        it('Should log event and mask password property', () => {
            subject.logEvent(event, ['password']);
            expect(mockInfoLog).toBeCalledTimes(1);
            expect(mockInfoLog).toBeCalledWith('Processing event:', {
                event: {
                    ResourceProperties: { otherField1: 'otherField1', password: '****masked****' },
                    OldResourceProperties: { otherField2: 'otherField2', password: '****masked****' },
                },
            });
        });

        it('No ResourceProperties', () => {
            delete event.ResourceProperties;

            subject.logEvent(event);
            expect(mockInfoLog).toBeCalledTimes(1);
            expect(mockInfoLog).toBeCalledWith('Processing event:', {
                event: {
                    OldResourceProperties: { otherField2: 'otherField2', password: 'password' },
                },
            });
        });

        it('No OldResourceProperties', () => {
            delete event.OldResourceProperties;

            subject.logEvent(event);
            expect(mockInfoLog).toBeCalledTimes(1);
            expect(mockInfoLog).toBeCalledWith('Processing event:', {
                event: {
                    ResourceProperties: { otherField1: 'otherField1', password: 'password' },
                },
            });
        });
    });
});
