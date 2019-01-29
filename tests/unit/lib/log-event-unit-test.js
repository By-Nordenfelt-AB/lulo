const expect  = require('chai').expect;
const sinon   = require('sinon');
const mockery = require('mockery');

describe('Logger unit tests', () => {
    let subject;
    let event;
    const infoStub = sinon.stub();

    before(() => {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });

        function logMock() {
            return {
                info: infoStub
            };
        }

        mockery.registerMock('log4njs', logMock);
        subject = require('../../../src/lib/log-event');
    });

    after(() => {
        mockery.deregisterAll();
        mockery.disable();
    });

    beforeEach(() => {
        infoStub.reset();
        event = {
            ResourceProperties: {
                password: 'password',
                otherField1: 'otherField1'
            },
            OldResourceProperties: {
                password: 'password',
                otherField2: 'otherField2'
            }
        };
    });

    describe('handler', () => {
        it('Should log event without masking anything', (done) => {
            subject(event, []);
            const logEvent = JSON.parse(infoStub.getCalls(0)[0].proxy.args[0][1]);
            expect(logEvent.ResourceProperties.password).to.equal('password');
            expect(logEvent.ResourceProperties.otherField1).to.equal('otherField1');
            expect(logEvent.OldResourceProperties.password).to.equal('password');
            expect(logEvent.OldResourceProperties.otherField2).to.equal('otherField2');
            done();
        });
        it('Should log event and mask password property', (done) => {
            subject(event, ['password']);
            const logEvent = JSON.parse(infoStub.getCalls(0)[0].proxy.args[0][1]);
            expect(logEvent.ResourceProperties.password).to.equal('****masked****');
            expect(logEvent.ResourceProperties.otherField1).to.equal('otherField1');
            expect(logEvent.OldResourceProperties.password).to.equal('****masked****');
            expect(logEvent.OldResourceProperties.otherField2).to.equal('otherField2');
            done();
        });

        it('No ResourceProperties', (done) => {
            delete event.ResourceProperties;

            subject(event);
            const logEvent = JSON.parse(infoStub.getCalls(0)[0].proxy.args[0][1]);
            expect(logEvent.ResourceProperties).to.equal(undefined);
            expect(logEvent.OldResourceProperties.password).to.equal('password');
            expect(logEvent.OldResourceProperties.otherField2).to.equal('otherField2');
            done();
        });

        it('No OldResourceProperties', (done) => {
            delete event.OldResourceProperties;

            subject(event);
            const logEvent = JSON.parse(infoStub.getCalls(0)[0].proxy.args[0][1]);
            expect(logEvent.ResourceProperties.password).to.equal('password');
            expect(logEvent.ResourceProperties.otherField1).to.equal('otherField1');
            expect(logEvent.OldResourceProperties).to.equal(undefined);
            done();
        });
    });
});
