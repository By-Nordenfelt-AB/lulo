'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');

describe('Logger unit tests', function () {
    var subject = require('../../../src/lib/logger');
    var event;
    var logSpy = sinon.spy(subject, 'log');

    beforeEach(function () {
        event = {
            ResourceProperties: {
                password: 'password',
                otherField: 'otherField'
            },
            OldResourceProperties: {
                password: 'password',
                otherField: 'otherField'
            }
        };
        logSpy.reset();
    });

    describe('log', function () {
        it('coverage...', function (done) {
            subject.log();
            done();
        });
    });

    describe('handler', function () {
        it('Should log event without masking anything', function (done) {
            subject.logEvent(event, []);
            var logEvent = JSON.parse(logSpy.getCalls(0)[0].proxy.args[0][1]);
            expect(logEvent.ResourceProperties.password).to.equal('password');
            expect(logEvent.ResourceProperties.otherField).to.equal('otherField');
            expect(logEvent.OldResourceProperties.password).to.equal('password');
            expect(logEvent.OldResourceProperties.otherField).to.equal('otherField');
            done();
        });
        it('Should log event and mask password property', function (done) {
            subject.logEvent(event, ['password']);
            var logEvent = JSON.parse(logSpy.getCalls(0)[0].proxy.args[0][1]);
            expect(logEvent.ResourceProperties.password).to.equal('****masked****');
            expect(logEvent.ResourceProperties.otherField).to.equal('otherField');
            expect(logEvent.OldResourceProperties.password).to.equal('****masked****');
            expect(logEvent.OldResourceProperties.otherField).to.equal('otherField');
            done();
        });

        it('Coverage...', function (done) {
            delete event.ResourceProperties;
            delete event.OldResourceProperties;
            subject.logEvent(event);
            var logEvent = JSON.parse(logSpy.getCalls(0)[0].proxy.args[0][1]);
            expect(logEvent.ResourceProperties).to.equal(undefined);
            expect(logEvent.OldResourceProperties).to.equal(undefined);
            done();
        });
    });
});
