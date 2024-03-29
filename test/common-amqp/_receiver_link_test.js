const EventEmitter = require('events').EventEmitter;
const assert = require('chai').assert;
const sinon = require('sinon');
const errors = require('../../dist/common-core/errors');
const ReceiverLink = require('../../dist/common-amqp/receiver_link.js').ReceiverLink;
const AmqpMessage = require('../../dist/common-amqp/amqp_message.js').AmqpMessage;




describe('ReceiverLink', function () {
  /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_013: [The `accept` method shall use the link created by the underlying `rhea` to settle the specified `message` with IoT hub by accepting it.]*/
  /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_015: [The `complete` method shall call the `accept` method with the same arguments (it is here for backward compatibility purposes only).]*/
  /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_016: [The `reject` method shall use the link created by the underlying `rhea` to settle the specified `message` with IoT hub by rejecting it.]*/
  /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_018: [The `abandon` method shall use the link created by the underlying `rhea` to settle the specified `message` with IoT hub by abandoning it.]*/
  [{
    recvLinkMethod: 'accept',
    rheaLinkMethod: 'accept'
  },
  {
    recvLinkMethod: 'complete',
    rheaLinkMethod: 'accept'
  },
  {
    recvLinkMethod: 'reject',
    rheaLinkMethod: 'reject'
  },
  {
    recvLinkMethod: 'abandon',
    rheaLinkMethod: 'release'
  },
  ].forEach(function (testConfig) {
    describe(testConfig.recvLinkMethod, function () {
      /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_021: [The `accept` method shall throw if the `message` argument is falsy.]*/
      /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_021: [The `reject` method shall throw if the `message` argument is falsy.]*/
      /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_021: [The `abandon` method shall throw if the `message` argument is falsy.]*/
      [undefined, null].forEach(function (falsyMessage) {
        it('throws a ReferenceError if the message object is \'' +  + '\'', function () {
          const link = new ReceiverLink('link', {}, {});
          assert.throws(function (){
            link[testConfig.recvLinkMethod](falsyMessage, function () {});
          }, ReferenceError);
        });
      });

      /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_013: [The `accept` method shall use the link created by the underlying `rhea` to settle the specified `message` with IoT hub by accepting it.]*/
      /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_015: [The `complete` method shall call the `accept` method with the same arguments (it is here for backward compatibility purposes only).]*/
      /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_016: [The `reject` method shall use the link created by the underlying `rhea` to settle the specified `message` with IoT hub by rejecting it.]*/
      /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_018: [The `abandon` method shall use the link created by the underlying `rhea` to settle the specified `message` with IoT hub by abandoning it.]*/
      it(testConfig.rheaLinkMethod + 's the message passed as argument and calls the callback if successful', function (testCallback) {
        const fakeRheaLink = new EventEmitter();
        const fakeContext = { receiver: fakeRheaLink };
        const fakeRheaSession = new EventEmitter();
        fakeRheaSession.open_receiver = () => {};
        sinon.stub(fakeRheaSession, 'open_receiver').callsFake(() => {process.nextTick( () => {fakeRheaLink.emit('receiver_open', fakeContext)});return fakeRheaLink;});

        const fakeMessage = new AmqpMessage({});
        const delivery = {};
        delivery[testConfig.rheaLinkMethod] = sinon.stub();
        const context = {
          message: fakeMessage,
          delivery: delivery
        };

        const link = new ReceiverLink('link', {}, fakeRheaSession);
        link.attach(function () {
          fakeRheaLink.emit('message', context);
          link[testConfig.recvLinkMethod](fakeMessage, function () {
            assert(delivery[testConfig.rheaLinkMethod].calledOnce);
            testCallback();
          });
        });
      });

      it(testConfig.rheaLinkMethod + ' with an unknown message passed as argument indicate a lock lost error on the callback', function (testCallback) {
        const fakeRheaLink = new EventEmitter();
        const fakeContext = { receiver: fakeRheaLink };
        const fakeRheaSession = new EventEmitter();
        fakeRheaSession.open_receiver = () => {};
        sinon.stub(fakeRheaSession, 'open_receiver').callsFake(() => {process.nextTick( () => {fakeRheaLink.emit('receiver_open', fakeContext)});return fakeRheaLink;});

        const fakeMessage = new AmqpMessage({});

        const link = new ReceiverLink('link', {}, fakeRheaSession);
        link.attach(function (err) {
          assert.isNotOk(err, 'attach completes successfully');
          link[testConfig.recvLinkMethod](fakeMessage, function (disposeError) {
            assert.isOk(disposeError, 'did receive an error indication');
            assert.instanceOf(disposeError, errors.DeviceMessageLockLostError, 'a standard javascript error returned');
            testCallback();
          });
        });
      });


      /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_014: [If the state machine is not in the `attached` state, the `accept` method shall immediately fail with a `DeviceMessageLockLostError`.]*/
      /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_017: [If the state machine is not in the `attached` state, the `reject` method shall immediately fail with a `DeviceMessageLockLostError`.]*/
      /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_019: [If the state machine is not in the `attached` state, the `abandon` method shall immediately fail with a `DeviceMessageLockLostError`.]*/
      it('calls the callback with a DeviceLockLostError if the state detached', function (testCallback) {
        const fakeMessage = new AmqpMessage({});
        fakeMessage.transportObj = {};

        const link = new ReceiverLink('link', {}, new EventEmitter());
        link[testConfig.recvLinkMethod](fakeMessage, function (err) {
          assert.instanceOf(err, errors.DeviceMessageLockLostError);
          testCallback();
        });
      });

      /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_014: [If the state machine is not in the `attached` state, the `accept` method shall immediately fail with a `DeviceMessageLockLostError`.]*/
      /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_017: [If the state machine is not in the `attached` state, the `reject` method shall immediately fail with a `DeviceMessageLockLostError`.]*/
      /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_019: [If the state machine is not in the `attached` state, the `abandon` method shall immediately fail with a `DeviceMessageLockLostError`.]*/
      it('calls the callback with a DeviceLockLostError if called while the state is attaching', function (testCallback) {
        const fakeRheaLink = new EventEmitter();
        const fakeRheaSession = new EventEmitter();
        fakeRheaSession.open_receiver = sinon.stub().returns(fakeRheaLink);
        const fakeMessage = new AmqpMessage({});

        const link = new ReceiverLink('link', {}, fakeRheaSession);
        link.attach(); // stuck in "attaching" state now
        link[testConfig.recvLinkMethod](fakeMessage, function (err) {
          assert.instanceOf(err, errors.DeviceMessageLockLostError);
          testCallback();
        });
      });

      /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_022: [** The `accept` method shall work whether a `callback` is specified or not, and call the callback with a `result.MessageCompleted` object if a callback is specified.]*/
      /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_023: [** The `reject` method shall work whether a `callback` is specified or not, and call the callback with a `result.MessageRejected` object if a callback is specified.]*/
      /*Tests_SRS_NODE_AMQP_RECEIVER_LINK_16_024: [** The `abandon` method shall work whether a `callback` is specified or not, and call the callback with a `result.MessageAbandoned` object if a callback is specified.]*/
      it('doesn\'t crash if no callback is provided', function () {
        const fakeRheaLink = new EventEmitter();
        const fakeContext = { receiver: fakeRheaLink };
        const fakeRheaSession = new EventEmitter();
        fakeRheaSession.open_receiver = () => {};
        sinon.stub(fakeRheaSession, 'open_receiver').callsFake(() => {process.nextTick( () => {fakeRheaLink.emit('receiver_open', fakeContext)});return fakeRheaLink;});

        const fakeMessage = new AmqpMessage({});
        const delivery = {};
        delivery[testConfig.rheaLinkMethod] = sinon.stub();
        const context = {
          message: fakeMessage,
          delivery: delivery
        };

        const link = new ReceiverLink('link', {}, fakeRheaSession);
        link.attach(function () {
          fakeRheaLink.emit('message', context);
          link[testConfig.recvLinkMethod](fakeMessage);
          assert(delivery[testConfig.rheaLinkMethod].calledOnce);
        });
      });
    });
  });

  describe('events', function () {
    describe('message', function () {
      it('attaches the link when subscribing to the \'message\' event', function () {
        const fakeRheaLink = new EventEmitter();
        const fakeContext = { receiver: fakeRheaLink };
        const fakeRheaSession = new EventEmitter();
        fakeRheaSession.open_receiver = () => {};
        sinon.stub(fakeRheaSession, 'open_receiver').callsFake(() => {process.nextTick( () => {fakeRheaLink.emit('receiver_open', fakeContext)});return fakeRheaLink;});

        const link = new ReceiverLink('link', {}, fakeRheaSession);
        link.on('message', function () {});
        assert(fakeRheaSession.open_receiver.calledOnce);
      });

      it('emits an error if attaching the link fails while subscribing to the \'message\' event', function (testCallback) {
        const fakeRheaLink = new EventEmitter();
        const fakeContext = { receiver: fakeRheaLink };
        const fakeRheaSession = new EventEmitter();
        fakeRheaLink.name = 'rheaLink';
        const fakeError = new Error('fake error');
        fakeRheaSession.open_receiver = () => {};
        fakeRheaLink.error = fakeError;
        sinon.stub(fakeRheaSession, 'open_receiver').callsFake(() => {process.nextTick( () => {fakeRheaLink.emit('receiver_error', fakeContext);fakeRheaLink.emit('receiver_close', fakeContext)});return fakeRheaLink;});

        const link = new ReceiverLink('link', {}, fakeRheaSession);
        link.on('error', function (err) {
          assert(fakeRheaSession.open_receiver.calledOnce);
          assert.strictEqual(err, fakeError);
          testCallback();
        });
        link.on('message', function () {});
      });

      it('subscribes to the underlying rhea link events', function (testCallback) {
        const fakeRheaLink = new EventEmitter();
        const fakeContext = { receiver: fakeRheaLink };
        const fakeRheaSession = new EventEmitter();
        fakeRheaSession.open_receiver = () => {};
        sinon.stub(fakeRheaSession, 'open_receiver').callsFake(() => {process.nextTick( () => {fakeRheaLink.emit('receiver_open', fakeContext)});return fakeRheaLink;});
        sinon.spy(fakeRheaLink, 'on');

        const link = new ReceiverLink('link', {}, fakeRheaSession);
        link._fsm.on('transition', function (transitionData) {
          if (transitionData.toState === 'attached') {
            assert(fakeRheaLink.on.calledWith('receiver_close'),'receiver_closed subscribed');
            assert(fakeRheaLink.on.calledWith('receiver_error'), 'error event subscribed');
            assert(fakeRheaLink.on.calledWith('message'), 'message event subscribed');
          }
        });
        link.on('message', function () {});
        link.on('message', function () {});
        assert(fakeRheaSession.open_receiver.calledOnce);
        testCallback();
      });

      it('detaches the link if there are no subscribers left on the \'message\' event', function (testCallback) {
        const fakeRheaLink = new EventEmitter();
        fakeRheaLink.name = 'receiverLink'
        const fakeContext = { receiver: fakeRheaLink };
        fakeRheaLink.close = () => {};
        sinon.stub(fakeRheaLink, 'close').callsFake(() => {fakeRheaLink.emit('receiver_close', fakeContext)});
        fakeRheaLink.remove = sinon.stub();
        const fakeRheaSession = new EventEmitter();
        fakeRheaSession.open_receiver = () => {};
        sinon.stub(fakeRheaSession, 'open_receiver').callsFake(() => {process.nextTick( () => {fakeRheaLink.emit('receiver_open', fakeContext)});return fakeRheaLink;});

        const link = new ReceiverLink('link', {}, fakeRheaSession);
        const listener1 = function () {};
        const listener2 = function () {};
        link._fsm.on('transition', function (transitionData) {
          if (transitionData.toState === 'attached') {
            link.on('message', listener2);
            assert(fakeRheaSession.open_receiver.calledOnce);
            link.removeListener('message', listener1);
            assert(fakeRheaLink.close.notCalled);
            assert(fakeRheaLink.remove.notCalled);
            link.removeListener('message', listener2);
          } else if (transitionData.toState === 'detached') {
            assert(fakeRheaLink.close.calledOnce);
            assert(fakeRheaLink.remove.notCalled);
            testCallback();
          }
        });
        link.on('message', listener1);
      });

      it('forwards the message event if subscribed', function (testCallback) {
        const fakeRheaLink = new EventEmitter();
        const fakeContext = { receiver: fakeRheaLink };
        const fakeRheaSession = new EventEmitter();
        fakeRheaSession.open_receiver = () => {};
        sinon.stub(fakeRheaSession, 'open_receiver').callsFake(() => {process.nextTick( () => {fakeRheaLink.emit('receiver_open', fakeContext)});return fakeRheaLink;});

        const amqpMessage = new AmqpMessage('');
        amqpMessage.message_id = 'hello';
        const delivery = {};
        delivery['accept'] = sinon.stub();
        const context = {
          message: amqpMessage,
          delivery: delivery
        };

        const link = new ReceiverLink('link', {}, fakeRheaSession);
        link.attach(function () {
          link.on('message', function (msg) {
            assert.strictEqual(msg, amqpMessage);
            testCallback();
          });
          fakeRheaLink.emit('message', context);
        });
      });

      it('emits an `azure-iot-amqp-base:error-indicated` event if receiver_error is emitted by the underlying link', function (testCallback) {
        const fakeRheaLink = new EventEmitter();
        fakeRheaLink.name = 'receiver';
        const fakeContext = { receiver: fakeRheaLink };
        fakeRheaLink.remove = sinon.stub();
        fakeRheaLink.close = sinon.stub();
        const fakeRheaSession = new EventEmitter();
        const fakeRheaContainer = new EventEmitter();
        const fakeCloseContext = { receiver: fakeRheaLink, container: fakeRheaContainer };
        fakeRheaSession.open_receiver = () => {};
        sinon.stub(fakeRheaSession, 'open_receiver').callsFake(() => {process.nextTick( () => {fakeRheaLink.emit('receiver_open', fakeContext)});return fakeRheaLink;});


        const link = new ReceiverLink('link', {}, fakeRheaSession);
        link.attach(function () {
          fakeRheaContainer.on('azure-iot-amqp-base:error-indicated', (err) => {
            assert.isOk(err, 'error supplied with the indicated event');
            testCallback();
          });
          const fakeRheaLinkError = new Error('fake error');
          fakeRheaLink.error = fakeRheaLinkError;
          fakeRheaLink.emit('receiver_error', fakeContext);
          fakeRheaLink.error = undefined;
          fakeRheaLink.emit('receiver_close', fakeCloseContext);
        });
      });

      it('emits an error event if the underlying link is detached with an error', function (testCallback) {
        const fakeRheaLink = new EventEmitter();
        fakeRheaLink.name = 'receiver';
        const fakeContext = { receiver: fakeRheaLink };
        fakeRheaLink.remove = sinon.stub();
        fakeRheaLink.close = sinon.stub();
        const fakeRheaSession = new EventEmitter();
        const fakeRheaContainer = new EventEmitter();
        const fakeCloseContext = { receiver: fakeRheaLink, container: fakeRheaContainer };
        fakeRheaSession.open_receiver = () => {};
        sinon.stub(fakeRheaSession, 'open_receiver').callsFake(() => {process.nextTick( () => {fakeRheaLink.emit('receiver_open', fakeContext)});return fakeRheaLink;});


        const link = new ReceiverLink('link', {}, fakeRheaSession);
        link.attach(function () {
          fakeRheaContainer.on('azure-iot-amqp-base:error-indicated', (err) => {
            link.detach(null, err);
          });
          const fakeRheaLinkError = new Error('fake error');
          link.on('error', function (err) {
            assert.strictEqual(err, fakeRheaLinkError);
            assert(fakeRheaLink.close.calledOnce, 'close called once');
            assert(fakeRheaLink.remove.notCalled, 'remove called once');
            testCallback();
          });
          fakeRheaLink.error = fakeRheaLinkError;
          fakeRheaLink.emit('receiver_error', fakeContext);
          fakeRheaLink.error = undefined;
          fakeRheaLink.emit('receiver_close', fakeCloseContext);
        });
      });
    });
  });
});
