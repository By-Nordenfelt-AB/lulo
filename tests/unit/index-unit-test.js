'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');

describe('Index unit tests', () => {
    let subject;
    let event;
    const responseStub = sinon.stub();
    const validateStub = sinon.stub();
    const createStub = sinon.stub();
    const updateStub = sinon.stub();
    const deleteStub = sinon.stub();
    const logStub = sinon.stub();
    const logEventStub = sinon.stub();
    const normalizeStub = sinon.stub();

    before(() => {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });

        const pluginMock = {
            validate: validateStub,
            schema: {},
            create: createStub,
            update: updateStub,
            delete: deleteStub
        };

        mockery.registerMock('./lib/cfn-response', responseStub);
        mockery.registerMock('./lib/log-event', logEventStub);
        mockery.registerMock('plugin', pluginMock);
        mockery.registerMock('./lib/normalize', normalizeStub);
        subject = require('../../src/index');
    });
    beforeEach(() => {
        responseStub.reset();
        responseStub.yields();
        validateStub.reset();
        validateStub.returns();
        createStub.reset();
        createStub.yields(null, { success: true });
        updateStub.reset();
        updateStub.yields(null, { success: true });
        deleteStub.reset();
        deleteStub.yields(null, { success: true });
        logStub.reset();
        logStub.returns();
        normalizeStub.reset();
        normalizeStub.returnsArg(0);
        logEventStub.reset();
        logEventStub.returns();
        event = {
            RequestType: 'Create',
            ResourceType: 'Custom::Plugin',
            ResourceProperties: {
                Property: 'test'
            },
            OldResourceProperties: {
                OldProperty: 'test2'
            }
        };
    });
    after(() => {
        mockery.deregisterAll();
        mockery.disable();
    });

    describe('__construct', () => {
        it('should succeed', (done) => {
            expect(subject()).to.be.an('object');
            done();
        });
    });

    describe('register', () => {
        it('should succeed', (done) => {
            const lulo = subject().register('testPlugin', {});
            expect(lulo).to.be.an('object');
            expect(lulo.plugins.testPlugin).to.be.an('object');
            done();
        });
        it('should fail on duplicate', (done) => {
            expect(registerDuplicate).to.throw(/Trying to register same plugin name twice/);
            done();
            function registerDuplicate() {
                subject()
                    .register('testPlugin', {})
                    .register('otherPlugin', {})
                    .register('testPlugin', {});
            }
        });
    });

    describe('handler', () => {
        it('Create should succeed', (done) => {
            subject({ logEvents: true })
                .register('Plugin', require('plugin')) // eslint-disable-line import/no-extraneous-dependencies
                .handler(event, {}, () => {
                    expect(logEventStub.calledOnce).to.equal(true);
                    expect(responseStub.calledOnce).to.equal(true);
                    expect(responseStub.calledWith(null, sinon.match.has('success', true), sinon.match.object,
                        sinon.match.object, sinon.match.boolean, sinon.match.func)).to.equal(true);
                    expect(validateStub.calledOnce).to.equal(true);
                    expect(createStub.calledOnce).to.equal(true);
                    expect(deleteStub.called).to.equal(false);
                    expect(updateStub.called).to.equal(false);
                    done();
                });
        });
        it('Update should succeed', (done) => {
            subject()
                .register('Plugin', require('plugin')) // eslint-disable-line import/no-extraneous-dependencies
                .handler({ RequestType: 'Update', ResourceType: 'Custom::Plugin' }, {}, () => {
                    expect(logEventStub.called).to.equal(false);
                    expect(responseStub.calledOnce).to.equal(true);
                    expect(responseStub.calledWith(null, sinon.match.has('success', true), sinon.match.object,
                        sinon.match.object, sinon.match.boolean, sinon.match.func)).to.equal(true);
                    expect(validateStub.calledOnce).to.equal(true);
                    expect(createStub.called).to.equal(false);
                    expect(deleteStub.called).to.equal(false);
                    expect(updateStub.calledOnce).to.equal(true);
                    done();
                });
        });
        it('Delete should succeed', (done) => {
            subject()
                .register('Plugin', require('plugin')) // eslint-disable-line import/no-extraneous-dependencies
                .handler({ RequestType: 'Delete', ResourceType: 'Custom::Plugin' }, {}, () => {
                    expect(responseStub.calledOnce).to.equal(true);
                    expect(responseStub.calledWith(null, sinon.match.has('success', true), sinon.match.object,
                        sinon.match.object, sinon.match.boolean, sinon.match.func)).to.equal(true);
                    expect(validateStub.calledOnce).to.equal(false);
                    expect(createStub.called).to.equal(false);
                    expect(deleteStub.calledOnce).to.equal(true);
                    expect(updateStub.called).to.equal(false);
                    done();
                });
        });
        it('Should fail if plugin does not exist on create', (done) => {
            subject()
                .register('Plugin', require('plugin')) // eslint-disable-line import/no-extraneous-dependencies
                .handler({ RequestType: 'Create', ResourceType: 'Custom::BadPlugin' }, {}, () => {
                    expect(responseStub.calledOnce).to.equal(true);
                    expect(responseStub.calledWith(sinon.match.has('message'), undefined, sinon.match.object,
                        sinon.match.object, sinon.match.boolean, sinon.match.func)).to.equal(true);
                    expect(validateStub.called).to.equal(false);
                    expect(createStub.called).to.equal(false);
                    expect(deleteStub.called).to.equal(false);
                    expect(updateStub.called).to.equal(false);
                    done();
                });
        });
        it('Should not fail if plugin does not exist on delete', (done) => {
            subject()
                .register('Plugin', require('plugin')) // eslint-disable-line import/no-extraneous-dependencies
                .handler({ RequestType: 'Delete', ResourceType: 'Custom::BadPlugin' }, {}, () => {
                    expect(responseStub.calledOnce).to.equal(true);
                    expect(responseStub.calledWith(undefined, undefined, sinon.match.object, sinon.match.object,
                        sinon.match.boolean, sinon.match.func)).to.equal(true);
                    expect(validateStub.called).to.equal(false);
                    expect(createStub.called).to.equal(false);
                    expect(deleteStub.called).to.equal(false);
                    expect(updateStub.called).to.equal(false);
                    done();
                });
        });
        it('Should fail if plugin.validate throws error', (done) => {
            validateStub.throws('Error');
            subject()
                .register('Plugin', require('plugin')) // eslint-disable-line import/no-extraneous-dependencies
                .handler({ RequestType: 'Create', ResourceType: 'Custom::Plugin' }, {}, () => {
                    expect(responseStub.calledOnce).to.equal(true);
                    expect(responseStub.calledWith(sinon.match.has('name', 'Error'), undefined, sinon.match.object,
                        sinon.match.object, sinon.match.boolean, sinon.match.func)).to.equal(true);
                    expect(validateStub.calledOnce).to.equal(true);
                    expect(createStub.called).to.equal(false);
                    expect(deleteStub.called).to.equal(false);
                    expect(updateStub.called).to.equal(false);
                    done();
                });
        });
    });
});
