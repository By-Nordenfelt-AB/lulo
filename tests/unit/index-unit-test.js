'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');

describe('Index unit tests', function () {
    var subject;
    var event;
    var responseStub = sinon.stub();
    var validateStub = sinon.stub();
    var createStub = sinon.stub();
    var updateStub = sinon.stub();
    var deleteStub = sinon.stub();
    var logStub = sinon.stub();
    var logEventStub = sinon.stub();

    before(function () {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });

        var pluginMock = {
            validate: validateStub,
            create: createStub,
            update: updateStub,
            delete: deleteStub
        };
        var logMock = {
            log: logStub,
            logEvent: logEventStub
        };

        mockery.registerMock('./lib/cfn-response', responseStub);
        mockery.registerMock('./lib/logger', logMock);
        mockery.registerMock('plugin', pluginMock);
        subject = require('../../src/index');
    });
    beforeEach(function () {
        responseStub.reset().resetBehavior();
        responseStub.yields();
        validateStub.reset().resetBehavior();
        validateStub.returns();
        createStub.reset().resetBehavior();
        createStub.yields(null, { success: true });
        updateStub.reset().resetBehavior();
        updateStub.yields(null, { success: true });
        deleteStub.reset().resetBehavior();
        deleteStub.yields(null, { success: true });
        logStub.reset().resetBehavior();
        logStub.returns();
        logEventStub.reset().resetBehavior();
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
    after(function () {
        mockery.deregisterAll();
        mockery.disable();
    });

    describe('__construct', function () {
        it('should succeed', function (done) {
            expect(subject()).to.be.an('object');
            done();
        });
    });

    describe('register', function () {
        it('should succeed', function (done) {
            var lulo = subject()
                .register('testPlugin', {});
            expect(lulo).to.be.an('object');
            expect(lulo.plugins.testPlugin).to.be.an('object');
            done();
        });
        it('should fail on duplicate', function (done) {
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

    describe('handler', function () {
        it('Create should succeed', function (done) {
            subject({ logEvents: true })
                .register('Plugin', require('plugin')) // eslint-disable-line import/no-extraneous-dependencies
                .handler(event, {}, function () {
                    expect(logEventStub.calledOnce).to.equal(true);
                    expect(responseStub.calledOnce).to.equal(true);
                    expect(responseStub.calledWith(null, sinon.match.has('success', true), sinon.match.object,
                        sinon.match.object, sinon.match.func)).to.equal(true);
                    expect(validateStub.calledOnce).to.equal(true);
                    expect(createStub.calledOnce).to.equal(true);
                    expect(deleteStub.called).to.equal(false);
                    expect(updateStub.called).to.equal(false);
                    done();
                });
        });
        it('Update should succeed', function (done) {
            subject()
                .register('Plugin', require('plugin')) // eslint-disable-line import/no-extraneous-dependencies
                .handler({ RequestType: 'Update', ResourceType: 'Custom::Plugin' }, {}, function () {
                    expect(logEventStub.called).to.equal(false);
                    expect(responseStub.calledOnce).to.equal(true);
                    expect(responseStub.calledWith(null, sinon.match.has('success', true), sinon.match.object,
                        sinon.match.object, sinon.match.func)).to.equal(true);
                    expect(validateStub.calledOnce).to.equal(true);
                    expect(createStub.called).to.equal(false);
                    expect(deleteStub.called).to.equal(false);
                    expect(updateStub.calledOnce).to.equal(true);
                    done();
                });
        });
        it('Delete should succeed', function (done) {
            subject()
                .register('Plugin', require('plugin')) // eslint-disable-line import/no-extraneous-dependencies
                .handler({ RequestType: 'Delete', ResourceType: 'Custom::Plugin' }, {}, function () {
                    expect(responseStub.calledOnce).to.equal(true);
                    expect(responseStub.calledWith(null, sinon.match.has('success', true), sinon.match.object,
                        sinon.match.object, sinon.match.func)).to.equal(true);
                    expect(validateStub.calledOnce).to.equal(true);
                    expect(createStub.called).to.equal(false);
                    expect(deleteStub.calledOnce).to.equal(true);
                    expect(updateStub.called).to.equal(false);
                    done();
                });
        });
        it('Should fail if plugin does not exist on create', function (done) {
            subject()
                .register('Plugin', require('plugin')) // eslint-disable-line import/no-extraneous-dependencies
                .handler({ RequestType: 'Create', ResourceType: 'Custom::BadPlugin' }, {}, function () {
                    expect(responseStub.calledOnce).to.equal(true);
                    expect(responseStub.calledWith(sinon.match.has('message'), undefined, sinon.match.object,
                        sinon.match.object, sinon.match.func)).to.equal(true);
                    expect(validateStub.called).to.equal(false);
                    expect(createStub.called).to.equal(false);
                    expect(deleteStub.called).to.equal(false);
                    expect(updateStub.called).to.equal(false);
                    done();
                });
        });
        it('Should not fail if plugin does not exist on delete', function (done) {
            subject()
                .register('Plugin', require('plugin')) // eslint-disable-line import/no-extraneous-dependencies
                .handler({ RequestType: 'Delete', ResourceType: 'Custom::BadPlugin' }, {}, function () {
                    expect(responseStub.calledOnce).to.equal(true);
                    expect(responseStub.calledWith(undefined, undefined, sinon.match.object, sinon.match.object,
                        sinon.match.func)).to.equal(true);
                    expect(validateStub.called).to.equal(false);
                    expect(createStub.called).to.equal(false);
                    expect(deleteStub.called).to.equal(false);
                    expect(updateStub.called).to.equal(false);
                    done();
                });
        });
        it('Should fail if plugin.validate throws error', function (done) {
            validateStub.throws('Error');
            subject()
                .register('Plugin', require('plugin')) // eslint-disable-line import/no-extraneous-dependencies
                .handler({ RequestType: 'Create', ResourceType: 'Custom::Plugin' }, {}, function () {
                    expect(responseStub.calledOnce).to.equal(true);
                    expect(responseStub.calledWith(sinon.match.has('name', 'Error'), undefined, sinon.match.object,
                        sinon.match.object, sinon.match.func)).to.equal(true);
                    expect(validateStub.calledOnce).to.equal(true);
                    expect(createStub.called).to.equal(false);
                    expect(deleteStub.called).to.equal(false);
                    expect(updateStub.called).to.equal(false);
                    done();
                });
        });
    });
});
