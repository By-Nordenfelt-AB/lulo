'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');

describe('Normalize unit tests', function () {
    var logStub = sinon.stub();
    var subject;
    var schema;

    before(function () {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });
        var logMock = {
            log: logStub
        };
        mockery.registerMock('./logger', logMock);
        subject = require('../../../src/lib/normalize');
    });

    beforeEach(function () {
        logStub.reset().resetBehavior();
        logStub.returns();

        schema = {
            BooleanParameter: { type: 'boolean' },
            IntegerParameter: { type: 'integer' },
            NumericParameter: { type: 'numeric' },
            Nested: {
                type: 'object',
                schema: {
                    NumericParameter: { type: 'integer' }
                }
            },
            PrimitiveArray: { type: 'array', schema: 'integer' },
            ComplexArray: {
                type: 'array',
                schema: {
                    BooleanParameter: { type: 'boolean' },
                    IntegerParameter: { type: 'integer' },
                    PrimitiveArray: { type: 'array', schema: 'boolean' }
                }
            },
            IncorrectParameter: { type: 'string' },
            NotInEvent: { type: 'integer' }
        };
    });

    describe('normalize', function () {
        it('should normalize all types of an event', function (done) {
            var event = {
                ResourceProperties: {
                    BooleanParameter: 'true',
                    IntegerParameter: '123',
                    NumericParameter: '123.12',
                    Nested: {
                        NumericParameter: '456'
                    },
                    PrimitiveArray: ['123', '456', '789'],
                    ComplexArray: [
                        { BooleanParameter: 'true', IntegerParameter: '123', PrimitiveArray: ['true', 'false'] },
                        { BooleanParameter: 'false', IntegerParameter: '456', PrimitiveArray: ['true'] }
                    ],
                    NotInSchemaParameter: 'NotInSchemaValue'
                }
            };
            subject(event, schema);
            expect(typeof event.ResourceProperties.BooleanParameter).to.equal('boolean');
            expect(event.ResourceProperties.BooleanParameter).to.equal(true);
            expect(typeof event.ResourceProperties.IntegerParameter).to.equal('number');
            expect(event.ResourceProperties.IntegerParameter).to.equal(123);
            expect(typeof event.ResourceProperties.NumericParameter).to.equal('number');
            expect(event.ResourceProperties.NumericParameter).to.equal(123.12);
            expect(typeof event.ResourceProperties.Nested.NumericParameter).to.equal('number');
            expect(event.ResourceProperties.Nested.NumericParameter).to.equal(456);

            event.ResourceProperties.PrimitiveArray.forEach(function (arrayValue) {
                expect(typeof arrayValue).to.equal('number');
            });

            event.ResourceProperties.ComplexArray.forEach(function (arrayValue) {
                expect(typeof arrayValue.BooleanParameter).to.equal('boolean');
                expect(typeof arrayValue.IntegerParameter).to.equal('number');
                arrayValue.PrimitiveArray.forEach(function (primitiveValue) {
                    expect(typeof primitiveValue).to.equal('boolean');
                });
            });

            expect(typeof event.ResourceProperties.NotInSchemaParameter).to.equal('string');
            expect(event.ResourceProperties.NotInSchemaParameter).to.equal('NotInSchemaValue');
            expect(logStub.called).to.equal(false);
            done();
        });
        it('should log if schema is incorrectly defined', function (done) {
            var event = {
                ResourceProperties: {
                    IncorrectParameter: 'IncorrectValue'
                }
            };
            subject(event, schema);
            expect(logStub.calledOnce).to.equal(true);
            done();
        });

        it('should normalize OldResource properties', function (done) {
            var event = {
                ResourceProperties: {},
                OldResourceProperties: {}
            };
            subject(event, schema);
            done();
        });
    });
});
