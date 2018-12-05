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

        const logMock = {
            info: infoStub,
            options: function () {
                return logMock;
            }
        };

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
                otherField: 'otherField'
            },
            OldResourceProperties: {
                password: 'password',
                otherField: 'otherField'
            }
        };
    });

    describe('handler', () => {
        it('Should log event without masking anything', (done) => {
            subject(event, []);
            const logEvent = JSON.parse(infoStub.getCalls(0)[0].proxy.args[0][1]);
            expect(logEvent.ResourceProperties.password).to.equal('password');
            expect(logEvent.ResourceProperties.otherField).to.equal('otherField');
            expect(logEvent.OldResourceProperties.password).to.equal('password');
            expect(logEvent.OldResourceProperties.otherField).to.equal('otherField');
            done();
        });
        it('Should log event and mask password property', (done) => {
            subject(event, ['password']);
            const logEvent = JSON.parse(infoStub.getCalls(0)[0].proxy.args[0][1]);
            expect(logEvent.ResourceProperties.password).to.equal('****masked****');
            expect(logEvent.ResourceProperties.otherField).to.equal('otherField');
            expect(logEvent.OldResourceProperties.password).to.equal('****masked****');
            expect(logEvent.OldResourceProperties.otherField).to.equal('otherField');
            done();
        });

        it('Coverage...', (done) => {
            delete event.ResourceProperties;
            delete event.OldResourceProperties;

            subject(event);
            const logEvent = JSON.parse(infoStub.getCalls(0)[0].proxy.args[0][1]);
            expect(logEvent.ResourceProperties).to.equal(undefined);
            expect(logEvent.OldResourceProperties).to.equal(undefined);
            done();
        });
    });
});
