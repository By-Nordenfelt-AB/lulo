describe('Normalize unit tests', () => {
    let subject: typeof import('../normalize');
    let schema: any;

    jest.spyOn(global.console, 'log').mockImplementation();

    beforeAll(() => {
        subject = require('../normalize');
    });

    beforeEach(() => {
        jest.clearAllMocks();
        schema = {
            BooleanParameter: { type: 'boolean' },
            IntegerParameter: { type: 'integer' },
            NumericParameter: { type: 'numeric' },
            Nested: {
                type: 'object',
                schema: {
                    NumericParameter: { type: 'integer' },
                },
            },
            PrimitiveArray: { type: 'array', schema: 'integer' },
            ComplexArray: {
                type: 'array',
                schema: {
                    BooleanParameter: { type: 'boolean' },
                    IntegerParameter: { type: 'integer' },
                    PrimitiveArray: { type: 'array', schema: 'boolean' },
                },
            },
            IncorrectParameter: { type: 'string' },
            NotInEvent: { type: 'integer' },
        };
    });

    describe('normalize', () => {
        it('should normalize all types of an event', async () => {
            const event = {
                ResourceProperties: {
                    BooleanParameter: 'true',
                    IntegerParameter: '123',
                    NumericParameter: '123.12',
                    Nested: {
                        NumericParameter: '456',
                    },
                    PrimitiveArray: ['123', '456', '789'],
                    ComplexArray: [
                        { BooleanParameter: 'true', IntegerParameter: '123', PrimitiveArray: ['true', 'false'] },
                        { BooleanParameter: 'false', IntegerParameter: '456', PrimitiveArray: ['true'] },
                    ],
                    NotInSchemaParameter: 'NotInSchemaValue',
                },
            };
            subject.normalize(event, schema);

            expect(typeof event.ResourceProperties.BooleanParameter).toEqual('boolean');
            expect(event.ResourceProperties.BooleanParameter).toEqual(true);
            expect(typeof event.ResourceProperties.IntegerParameter).toEqual('number');
            expect(event.ResourceProperties.IntegerParameter).toEqual(123);
            expect(typeof event.ResourceProperties.NumericParameter).toEqual('number');
            expect(event.ResourceProperties.NumericParameter).toEqual(123.12);
            expect(typeof event.ResourceProperties.Nested.NumericParameter).toEqual('number');
            expect(event.ResourceProperties.Nested.NumericParameter).toEqual(456);

            event.ResourceProperties.PrimitiveArray.forEach(function (arrayValue) {
                expect(typeof arrayValue).toEqual('number');
            });

            event.ResourceProperties.ComplexArray.forEach(function (arrayValue) {
                expect(typeof arrayValue.BooleanParameter).toEqual('boolean');
                expect(typeof arrayValue.IntegerParameter).toEqual('number');
                arrayValue.PrimitiveArray.forEach(function (primitiveValue) {
                    expect(typeof primitiveValue).toEqual('boolean');
                });
            });

            expect(typeof event.ResourceProperties.NotInSchemaParameter).toEqual('string');
            expect(event.ResourceProperties.NotInSchemaParameter).toEqual('NotInSchemaValue');
        });
        it('should log if schema is incorrectly defined', async () => {
            const event = {
                ResourceProperties: {
                    IncorrectParameter: 'IncorrectValue',
                },
            };
            subject.normalize(event, schema);

            expect(console.log).toBeCalledTimes(1);
            expect(console.log).toBeCalledWith('[WARNING] Unknown schema property type', '{ key: \'IncorrectParameter\', type: \'string\' }');
        });

        it('should normalize OldResource properties', async () => {
            const event = {
                ResourceProperties: {},
                OldResourceProperties: {},
            };
            subject.normalize(event, schema);
        });
    });
});
