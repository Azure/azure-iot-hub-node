/* eslint-disable security/detect-non-literal-fs-filename */ // Eslint is mistakenly detecting client opens as fs opens.
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

const assert = require('chai').assert;
const sinon = require('sinon');
const EventEmitter = require('events').EventEmitter;
const Amqp = require('../dist/amqp.js').Amqp;
const Client = require('../dist/client.js').Client;
const Message = require('azure-iot-common').Message;
const errors = require('azure-iot-common').errors;
const versionQueryString = require('../dist/version').versionQueryString;
const SimulatedAmqp = require('./amqp_simulated.js');
const transportSpecificTests = require('./_client_common_testrun.js');

describe('Client', function () {
  describe('#constructor', function () {
    /*Tests_SRS_NODE_IOTHUB_CLIENT_05_001: [The Client constructor shall throw ReferenceError if the transport argument is falsy.]*/
    it('throws when transport is falsy', function () {
      assert.throws(function () {
        return new Client();
      }, ReferenceError, 'transport is \'undefined\'');
    });
  });

  describe('#fromConnectionString', function () {
    const connStr = 'HostName=a.b.c;SharedAccessKeyName=name;SharedAccessKey=key';

    /*Tests_SRS_NODE_IOTHUB_CLIENT_05_002: [The fromConnectionString method shall throw ReferenceError if the connStr argument is falsy.]*/
    it('throws when value is falsy', function () {
      assert.throws(function () {
        return Client.fromConnectionString();
      }, ReferenceError, 'connStr is \'undefined\'');
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_017: [The `fromConnectionString` method shall use the default Transport (Amqp) if the `Transport` optional argument is falsy.]*/
    it('creates an instance of the default transport', function () {
      const client = Client.fromConnectionString(connStr);
      assert.instanceOf(client._transport, Amqp);
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_016: [The `fromConnectionString` method shall use the `Transport` constructor passed as argument to instantiate a transport object if it's not falsy.]*/
    it('uses the transport given as argument', function () {
      const FakeTransport = function (config) {
        assert.isOk(config);
      };

      const client = Client.fromConnectionString(connStr, FakeTransport);
      assert.instanceOf(client._transport, FakeTransport);
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_05_004: [The fromConnectionString method shall return a new instance of the Client object, as by a call to new Client(transport).]*/
    it('returns an instance of Client', function () {
      const client = Client.fromConnectionString(connStr);
      assert.instanceOf(client, Client);
      assert.isOk(client._restApiClient);
    });
  });

  describe('#fromSharedAccessSignature', function () {
    const token = 'SharedAccessSignature sr=hubName.azure-devices.net&sig=signature&skn=keyname&se=expiry';

    /*Tests_SRS_NODE_IOTHUB_CLIENT_05_005: [The fromSharedAccessSignature method shall throw ReferenceError if the sharedAccessSignature argument is falsy.]*/
    it('throws when value is falsy', function () {
      assert.throws(function () {
        return Client.fromSharedAccessSignature();
      }, ReferenceError, 'sharedAccessSignature is \'undefined\'');
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_018: [The `fromSharedAccessSignature` method shall create a new transport instance and pass it a config object formed from the connection string given as argument.]*/
    it('correctly populates the config structure', function () {
      const client = Client.fromSharedAccessSignature(token);
      assert.equal(client._transport._config.host, 'hubName.azure-devices.net');
      assert.equal(client._transport._config.keyName, 'keyname');
      assert.equal(client._transport._config.sharedAccessSignature, token);
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_020: [The `fromSharedAccessSignature` method shall use the default Transport (Amqp) if the `Transport` optional argument is falsy.]*/
    it('creates an instance of the default transport', function () {
      const client = Client.fromSharedAccessSignature(token);
      assert.instanceOf(client._transport, Amqp);
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_019: [The `fromSharedAccessSignature` method shall use the `Transport` constructor passed as argument to instantiate a transport object if it's not falsy.]*/
    it('uses the transport given as argument', function () {
      const FakeTransport = function (config) {
        assert.isOk(config);
      };

      const client = Client.fromSharedAccessSignature(token, FakeTransport);
      assert.instanceOf(client._transport, FakeTransport);
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_05_007: [The fromSharedAccessSignature method shall return a new instance of the Client object, as by a call to new Client(transport).]*/
    it('returns an instance of Client', function () {
      const client = Client.fromSharedAccessSignature(token);
      assert.instanceOf(client, Client);
      assert.isOk(client._restApiClient);
    });
  });

  describe('#fromTokenCredential', function () {
    const fakeTokenCredential = {
      getToken: sinon.stub().resolves({
        token: "fake_token",
        expiresOnTimeStamp: Date.now() + 3600000
      })
    };

    it('creates an instance of the default transport', function () {
      const client = Client.fromTokenCredential("hub.host.tv", fakeTokenCredential);
      assert.instanceOf(client._transport, Amqp);
    });

    it('uses the transport given as argument', function () {
      const FakeTransport = function (config) {
        assert.isOk(config);
      };

      const client = Client.fromTokenCredential("hub.host.tv", fakeTokenCredential, FakeTransport);
      assert.instanceOf(client._transport, FakeTransport);
    });

    it('returns an instance of Client', function () {
      const client = Client.fromTokenCredential("hub.host.tv", fakeTokenCredential);
      assert.instanceOf(client, Client);
      assert.isOk(client._restApiClient);
    });

    it('correctly populates the config structure', function () {
      const client = Client.fromTokenCredential("hub.host.tv", fakeTokenCredential);
      assert.equal(client._transport._config.host, 'hub.host.tv');
      assert.equal(client._transport._config.tokenCredential, fakeTokenCredential);
      assert.equal(client._restApiClient._config.host, 'hub.host.tv');
      assert.equal(client._restApiClient._config.tokenCredential, fakeTokenCredential);
      assert.equal(client._restApiClient._config.tokenScope, 'https://iothubs.azure.net/.default');
    });
  });

  const goodSendParameters = [
    { obj: Buffer.from('foo'), name: 'Buffer' },
    { obj: 'foo', name: 'string' },
    { obj: [], name: 'Array' },
    { obj: new ArrayBuffer(), name: 'ArrayBuffer' }
  ];
  const badSendParameters = [
    { obj: 1, name: 'number' },
    { obj: true, name: 'boolean' },
    { obj: {}, name: 'object' }
  ];

  describe('#send', function () {
    let testSubject;

    beforeEach('prepare test subject', function () {
      testSubject = new Client({}, {});
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_05_013: [The send method shall throw ReferenceError if the deviceId or message arguments are falsy.]*/
    it('throws if deviceId is falsy', function () {
      assert.throws(function () {
        testSubject.send(undefined, {}, () => { });
      }, ReferenceError, 'deviceId is \'undefined\'');
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_05_013: [The send method shall throw ReferenceError if the deviceId or message arguments are falsy.]*/
    it('throws if message is falsy', function () {
      assert.throws(function () {
        testSubject.send('id', undefined, () => { });
      }, ReferenceError, 'message is \'undefined\'');
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_030: [The `send` method shall not throw if the `done` callback is falsy.]*/
    it('returns a Promise done is falsy', function () {
      const simulatedAmqp = new SimulatedAmqp();
      const client = new Client(simulatedAmqp);
      const promise = client.send('id', new Message('msg'));
      assert.instanceOf(promise, Promise);
      promise.catch(console.log);
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_18_016: [The `send` method shall throw an `ArgumentError` if the `message` argument is not of type `azure-iot-common.Message` or `azure-iot-common.Message.BufferConvertible`.]*/
    badSendParameters.forEach(function (testConfig) {
      it('throws if message is of type ' + testConfig.name, function () {
        assert.throws(function () {
          testSubject.send('id', testConfig.obj, () => { });
        }, errors.ArgumentError);
      });
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_05_014: [The `send` method shall convert the `message` object to type `azure-iot-common.Message` if it is not already of type `azure-iot-common.Message`.]*/
    goodSendParameters.forEach(function (testConfig) {
      it('Converts to message if message is of type ' + testConfig.name, function (testCallback) {
        const simulatedAmqp = new SimulatedAmqp();
        const client = new Client(simulatedAmqp);
        sinon.spy(simulatedAmqp, 'send');
        client.send('id', testConfig.obj, function (err, state) {
          assert(!err);
          assert.equal(state.constructor.name, "MessageEnqueued");
          const sentMessage = simulatedAmqp.send.firstCall.args[1];
          assert.deepEqual(sentMessage, new Message(testConfig.obj));
          testCallback();
        });
      });
    });


  });

  describe('#basic invokeDeviceMethod', function () {
    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_014: [The `invokeDeviceMethod` method shall throw a `ReferenceError` if `deviceId` is `null`, `undefined` or an empty string.]*/
    [undefined, null, ''].forEach(function (badDeviceId) {
      it('throws if \'deviceId\' is \'' + badDeviceId + '\'', function () {
        const client = new Client({}, {});
        assert.throws(function () {
          client.invokeDeviceMethod(badDeviceId, 'method', { foo: 'bar' }, 42, function () {});
        }, ReferenceError);
      });
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_006: [The `invokeDeviceMethod` method shall throw a `ReferenceError` if `methodName` is `null`, `undefined` or an empty string.]*/
    [undefined, null, ''].forEach(function (badMethodName) {
      it('throws if \'methodParams.methodName\' is \'' + badMethodName + '\'', function () {
        const client = new Client({}, {});
        assert.throws(function () {
          client.invokeDeviceMethod('deviceId', { methodName: badMethodName, payload: { foo: 'bar' }, timeoutInSeconds: 42 }, function () {});
        }, ReferenceError);
      });
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_007: [The `invokeDeviceMethod` method shall throw a `TypeError` if `methodName` is not a `string`.]*/
    [{}, function (){}, 42].forEach(function (badMethodType) {
      it('throws if \'methodParams.methodName\' is of type \'' + badMethodType + '\'', function () {
        const client = new Client({}, {});
        assert.throws(function () {
          client.invokeDeviceMethod('deviceId', { methodName: badMethodType, payload: { foo: 'bar' }, timeoutInSeconds: 42 }, function () {});
        }, TypeError);
      });
    });
  });

  describe('invokeDeviceMethod as promise', function () {

    it ('Can fulfill a promise when using moduleId and methodParams', function (testCallback) {
      const fakeMethodParams = {
        methodName: 'method',
        payload: null,
        timeoutInSeconds: 42
      };

      const fakeResult = { foo: 'bar' };
      const fakeResponse = { statusCode: 200 };
      const fakeRestClient = {
        executeApiCall: function (method, path, headers, body, timeout, callback) {
          callback(null, fakeResult, fakeResponse);
        }
      };
      const client = new Client({}, fakeRestClient);
      client.invokeDeviceMethod('fakeDeviceId', 'fakeModuleId', fakeMethodParams).then((promiseResult) => {
        assert.strictEqual(promiseResult.result, fakeResult);
        assert.strictEqual(promiseResult.message, fakeResponse);
        testCallback();
      })
      .catch(() => {
        assert.fail('promise incorrectly rejected');
      });
    });

    it ('Can reject a promise when using using moduleId and methodParams with promise rejected', function (testCallback) {
      const fakeMethodParams = {
        methodName: 'method',
        payload: null,
        timeoutInSeconds: 42
      };

      const fakeError = new Error('good error');
      const fakeRestClient = {
        executeApiCall: function (method, path, headers, body, timeout, callback) {
          callback(fakeError);
        }
      };
      const client = new Client({}, fakeRestClient);
      client.invokeDeviceMethod('fakeDeviceId', 'fakeModuleId', fakeMethodParams).then(() => {
        assert.fail('promise incorrectly fulfilled');
      })
      .catch((err) => {
        assert.strictEqual(err, fakeError);
        testCallback();
      });
    });

    it ('Can fulfill the promise when only passing a methodParams argument', function (testCallback) {
      const fakeMethodParams = {
        methodName: 'method',
        payload: null,
        timeoutInSeconds: 42
      };

      const fakeResult = { foo: 'bar' };
      const fakeResponse = { statusCode: 200 };
      const fakeRestClient = {
        executeApiCall: function (method, path, headers, body, timeout, callback) {
          callback(null, fakeResult, fakeResponse);
        }
      };
      const client = new Client({}, fakeRestClient);
      client.invokeDeviceMethod('fakeDeviceId', fakeMethodParams).then((promiseResult) => {
        assert.strictEqual(promiseResult.result, fakeResult);
        assert.strictEqual(promiseResult.message, fakeResponse);
        testCallback();
      })
      .catch(() => {
        assert.fail('promise incorrectly rejected');
      });
    });

    it ('Can reject the promise when only passing a methodParams argument', function (testCallback) {
      const fakeMethodParams = {
        methodName: 'method',
        payload: null,
        timeoutInSeconds: 42
      };

      const fakeError = new Error('good error');
      const fakeRestClient = {
        executeApiCall: function (method, path, headers, body, timeout, callback) {
          callback(fakeError);
        }
      };
      const client = new Client({}, fakeRestClient);
      client.invokeDeviceMethod('fakeDeviceId', fakeMethodParams).then(() => {
        assert.fail('promise incorrectly fulfilled');
      })
      .catch((err) => {
        assert.strictEqual(err, fakeError);
        testCallback();
      });
    });

    [undefined, null, '', {}, 42].forEach(function (badMethod) {
      it ('throws ReferenceError when using moduleId and methodParams is \'' +  badMethod + '\'', function (testCallback) {
        const client = new Client({}, {});
        client.invokeDeviceMethod('fakeDeviceId', 'fakeModuleId', badMethod).then(() => {
          assert.fail('promise incorrectly fulfilled');
        }).catch((err) => {
          assert.instanceOf(err, ReferenceError);
          testCallback();
        });
      });
    });

    [{ methodName: 4 }].forEach(function (badMethodType) {
      it ('throws TypeError when using moduleId and methodParams has type of \'' + badMethodType + '\'', function (testCallback) {
        const client = new Client({}, {});
        client.invokeDeviceMethod('fakeDeviceId', 'fakeModuleId', badMethodType).then(() => {
          assert.fail('promise incorrectly fulfilled');
        }).catch((err) => {
          assert.instanceOf(err, TypeError);
          testCallback();
        });
      });
    });

    [undefined, null, '', {}, 42].forEach(function (badMethod) {
      it ('throws ReferenceError when NOT using moduleId and methodParams has type of \'' + badMethod + '\'', function (testCallback) {
        const client = new Client({}, {});
        client.invokeDeviceMethod('fakeDeviceId', badMethod).then(() => {
          assert.fail('promise incorrectly fulfilled');
        }).catch((err) => {
          assert.instanceOf(err, ReferenceError);
          testCallback();
        });
      });
    });

    [{ methodName: 4 }].forEach(function (badMethodType) {
      it ('throws TypeError when NOT using moduleId and methodParams has type of \'' + badMethodType + '\'', function (testCallback) {
        const client = new Client({}, {});
        client.invokeDeviceMethod('fakeDeviceId', badMethodType).then(() => {
          assert.fail('promise incorrectly fulfilled');
        }).catch((err) => {
          assert.instanceOf(err, TypeError);
          testCallback();
        });
      });
    });
  });

  [
    { functionUnderTest: function (client, param, callback) { client.invokeDeviceMethod('deviceId', param, callback); } },
    { functionUnderTest: function (client, param, callback) { client.invokeDeviceMethod('deviceId', 'moduleId', param, callback); } },
  ].forEach(function (testConfig) {
    describe('#advanced invokeDeviceMethod', function () {
      /*Tests_SRS_NODE_IOTHUB_CLIENT_16_009: [The `invokeDeviceMethod` method shall initialize a new instance of `DeviceMethod` with the `methodName` and `timeout` values passed in the arguments.]*/
      /*Tests_SRS_NODE_IOTHUB_CLIENT_16_010: [The `invokeDeviceMethod` method shall use the newly created instance of `DeviceMethod` to invoke the method with the `payload` argument on the device specified with the `deviceid` argument .]*/
      /*Tests_SRS_NODE_IOTHUB_CLIENT_16_013: [The `invokeDeviceMethod` method shall call the `done` callback with a `null` first argument, the result of the method execution in the second argument, and the transport-specific response object as a third argument.]*/
      /*Tests_SRS_NODE_IOTHUB_CLIENT_18_003: [If `moduleIdOrMethodParams` is a string the `invokeDeviceMethod` method shall call `invokeOnModule` on the new `DeviceMethod` instance. ]*/
      it('uses the DeviceMethod client to invoke the method', function (testCallback) {
        const fakeMethodParams = {
          methodName: 'method',
          payload: null,
          timeoutInSeconds: 42
        };

        const fakeResult = { foo: 'bar' };
        const fakeResponse = { statusCode: 200 };
        const fakeRestClient = {
          executeApiCall: function (method, path, headers, body, timeout, callback) {
            callback(null, fakeResult, fakeResponse);
          }
        };
        const client = new Client({}, fakeRestClient);

        testConfig.functionUnderTest(client, fakeMethodParams, function (err, result, response) {
          assert.isNull(err);
          assert.equal(result, fakeResult);
          assert.equal(response, fakeResponse);
          testCallback();
        });
      });

      /*Tests_SRS_NODE_IOTHUB_CLIENT_16_012: [The `invokeDeviceMethod` method shall call the `done` callback with a standard javascript `Error` object if the request failed.]*/
      it('works when payload and timeout are omitted', function (testCallback) {
        const fakeError = new Error('fake error');
        const fakeRestClientFails = {
          executeApiCall: function (method, path, headers, body, timeout, callback) {
            callback(fakeError);
          }
        };
        const client = new Client({}, fakeRestClientFails);

        testConfig.functionUnderTest(client, { methodName: 'method' }, function (err) {
          assert.equal(err, fakeError);
          testCallback();
        });
      });
    });
  });



  describe('#open', function () {
    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_004: [The `disconnect` event shall be emitted when the client is disconnected from the server.]*/
    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_002: [If the transport successfully establishes a connection the `open` method shall subscribe to the `disconnect` event of the transport.]*/
    it('subscribes to the \'disconnect\' event once connected', function (done) {
      const simulatedAmqp = new SimulatedAmqp();
      const client = new Client(simulatedAmqp, {});
      client.open(function () {
        client.on('disconnect', function () {
          done();
        });

        simulatedAmqp.emit('disconnect');
      });
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_05_009: [**When the `open` method completes, the callback function (indicated by the `done` argument) shall be invoked with the following arguments:
      - `err` - standard JavaScript `Error` object (or subclass)]*/
    it('calls the done callback if passed as argument', function (testCallback) {
      const simulatedAmqp = new SimulatedAmqp();
      const client = new Client(simulatedAmqp);
      client.open(testCallback);
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_006: [The `open` method should not throw if the `done` callback is not specified.]*/
    it('doesn\'t throw if the done callback is not passed as argument', function () {
      const simulatedAmqp = new SimulatedAmqp();
      const client = new Client(simulatedAmqp);
      assert.doesNotThrow(function () {
        client.open();
      });
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_05_011: [**Otherwise the argument `err` shall have an `amqpError` property containing implementation-specific response information for use in logging and troubleshooting.]*/
    it('calls the done callback with an error if the transport fails to connect', function (testCallback) {
      const fakeError = new errors.UnauthorizedError('will not retry');
      const fakeTransport = new EventEmitter();
      fakeTransport.connect = sinon.stub().callsArgWith(0, fakeError);
      const client = new Client(fakeTransport);
      client.open(function (err) {
        assert.strictEqual(err, fakeError);
        testCallback();
      });
    });
  });

  describe('#close', function () {
    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_003: [The `close` method shall remove the listener that has been attached to the transport `disconnect` event.]*/
    it('unsubscribes for the \'disconnect\' event when disconnecting', function (done) {
      const simulatedAmqp = new SimulatedAmqp();
      const client = new Client(simulatedAmqp, {});
      let disconnectReceived = false;
      client.open(function () {
        client.on('disconnect', function () {
          disconnectReceived = true;
        });
        client.close(function () {
          simulatedAmqp.emit('disconnect');
          assert.isFalse(disconnectReceived);
          done();
        });
      });
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_05_022: [When the `close` method completes, the callback function (indicated by the done argument) shall be invoked with the following arguments:
      - `err` - standard JavaScript `Error` object (or subclass)]*/
    it('calls the done callback if passed as argument', function (testCallback) {
      const simulatedAmqp = new SimulatedAmqp();
      const client = new Client(simulatedAmqp);
      client.close(testCallback);
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_005: [The `close` method should not throw if the `done` callback is not specified.]*/
    it('doesn\'t throw if the done callback is not passed as argument', function () {
      const simulatedAmqp = new SimulatedAmqp();
      const client = new Client(simulatedAmqp);
      assert.doesNotThrow(function () {
        client.close();
      });
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_05_024: [Otherwise the argument `err` shall have a transport property containing implementation-specific response information for use in logging and troubleshooting.]*/
    it('calls the done callback with an error if the transport fails to disconnect', function (testCallback) {
      const fakeError = new errors.UnauthorizedError('will not retry');
      const fakeTransport = new EventEmitter();
      fakeTransport.disconnect = sinon.stub().callsArgWith(0, fakeError);
      const client = new Client(fakeTransport);
      client.close(function (err) {
        assert.strictEqual(err, fakeError);
        testCallback();
      });
    });
  });

  /*Tests_SRS_NODE_IOTHUB_CLIENT_05_027: [When the `getFeedbackReceiver` method completes, the callback function (indicated by the `done` argument) shall be invoked with the following arguments:
    - `err` - standard JavaScript `Error` object (or subclass): `null` if the operation was successful
    - `receiver` - an `AmqpReceiver` instance: `undefined` if the operation failed.]*/
  /*Tests_SRS_NODE_IOTHUB_CLIENT_16_001: [When the `getFileNotificationReceiver` method completes, the callback function (indicated by the `done` argument) shall be invoked with the following arguments:
    - `err` - standard JavaScript `Error` object (or subclass): `null` if the operation was successful
    - `receiver` - an `AmqpReceiver` instance: `undefined` if the operation failed.]*/
  ['getFeedbackReceiver', 'getFileNotificationReceiver'].forEach(function (getReceiverMethod) {
    describe(getReceiverMethod, function () {
      it('calls ' + getReceiverMethod + ' on the transport', function (testCallback) {
        const fakeTransport = new EventEmitter();
        fakeTransport[getReceiverMethod] = sinon.stub().callsArgWith(0, null, new EventEmitter());
        const client = new Client(fakeTransport);
        client[getReceiverMethod](function (err, recv) {
          assert.isNull(err);
          assert.instanceOf(recv, EventEmitter);
          testCallback();
        });
      });

      it('calls its callback with an error if it the transport fails to provide a feedback receiver', function (testCallback) {
        const fakeError = new errors.UnauthorizedError('will not retry');
        const fakeTransport = new EventEmitter();
        fakeTransport[getReceiverMethod] = sinon.stub().callsArgWith(0, fakeError);
        const client = new Client(fakeTransport);
        client[getReceiverMethod](function (err) {
          assert.strictEqual(err, fakeError);
          testCallback();
        });
      });
    });
  });

  describe('setRetryPolicy', function () {
    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_027: [The `setRetryPolicy` method shall throw a `ReferenceError` if the `policy` argument is falsy.]*/
    [null, undefined].forEach(function (badPolicy) {
      it('throws a ReferenceError if the policy is \'' + badPolicy + '\'', function () {
        const client = new Client(new EventEmitter());
        assert.throws(function () {
          client.setRetryPolicy(badPolicy);
        }, ReferenceError);
      });
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_028: [The `setRetryPolicy` method shall throw an `ArgumentError` if the `policy` object does not have a `shouldRetry` method and a `nextRetryTimeout` method.]*/
    it('throws an ArgumentError if the policy does not have a shouldRetry method', function () {
      const badPolicy = { nextRetryTimeout: function () {} };
      const client = new Client(new EventEmitter());
      assert.throws(function () {
        client.setRetryPolicy(badPolicy);
      }, errors.ArgumentError);
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_028: [The `setRetryPolicy` method shall throw an `ArgumentError` if the `policy` object does not have a `shouldRetry` method and a `nextRetryTimeout` method.]*/
    it('throws an ArgumentError if the policy does not have a nextRetryTimeout method', function () {
      const badPolicy = { shouldRetry: function () {} };
      const client = new Client(new EventEmitter());
      assert.throws(function () {
        client.setRetryPolicy(badPolicy);
      }, errors.ArgumentError);
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_029: [Any operation (e.g. `send`, `getFeedbackReceiver`, etc) initiated after a call to `setRetryPolicy` shall use the policy passed as argument to retry.]*/
    it('uses the new retry policy for all subsequent calls', function (testCallback) {
      const fakeError = new errors.UnauthorizedError('will not retry');
      const fakeRetryPolicy = {
        shouldRetry: sinon.stub().returns(true),
        nextRetryTimeout: sinon.stub().returns(1)
      };
      const fakeTransport = new EventEmitter();
      fakeTransport.connect = sinon.stub().onFirstCall().callsArgWith(0, fakeError)
                                          .onSecondCall().callsFake(function () {
                                            assert.isTrue(fakeRetryPolicy.shouldRetry.calledOnce);
                                            assert.isTrue(fakeRetryPolicy.shouldRetry.calledOnce);
                                            testCallback();
                                          });
      const client = new Client(fakeTransport);
      client.setRetryPolicy(fakeRetryPolicy);
      client.open(function () {});
    });
  });

  describe('initiateStream', function () {
    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_031: [The `initiateStream` method shall throw a `ReferenceError` if the `deviceId` is argument falsy.]*/
    [undefined, null, ''].forEach(function (badDeviceId) {
      it('throws a ReferenceError if \'deviceId\' is \'' + badDeviceId + '\'', function () {
        let client = new Client(new EventEmitter(), {});
        assert.throws(function () {
          client.initiateStream(badDeviceId, {}, function () {});
        }, ReferenceError);
      });
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_032: [The `initiateStream` method shall throw a `ReferenceError` if the `streamInitiation` argument is falsy.]*/
    [undefined, null].forEach(function (badStreamInitiation) {
      it('throws a ReferenceError if \'streamInitiation\' is \'' + badStreamInitiation + '\'', function () {
        let client = new Client(new EventEmitter(), {});
        assert.throws(function () {
          client.initiateStream('deviceId', badStreamInitiation, function () {});
        }, ReferenceError);
      });
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_033: [The `initiateStream` method shall send an HTTP request formatted as follows:
    ```
    POST /twins/encodeUriComponentStrict(<deviceId>)/streams/encodeUriComponentStrict(streamInitiation.streamName)

    iothub-streaming-connect-timeout-in-seconds: <streamInitiation.connectTimeoutInSeconds>
    iothub-streaming-response-timeout-in-seconds: <streamInitiation.responseTimeoutInSeconds>
    ```]*/
    it('sends a well-formatted HTTP request', function (testCallback) {
      const fakeDeviceId = 'fakeDevice';
      const fakeStreamInitiation = {
        connectTimeoutInSeconds: 42,
        responseTimeoutInSeconds: 1337,
        streamName: 'streamName'
      };
      const fakeResponse = {
        statusCode: 200,
        headers: {
          'iothub-streaming-is-accepted': 'True',
          'iothub-streaming-url': 'wss://test',
          'iothub-streaming-authToken': 'token',
        }
      };
      let fakeResult = "";
      let fakeRestClient = {
        executeApiCall: function (method, path, headers, body, timeout, callback) {
          assert.strictEqual(method, 'POST');
          assert.strictEqual(path, '/twins/' + fakeDeviceId + '/streams/' + fakeStreamInitiation.streamName + versionQueryString());
          assert.strictEqual(headers['iothub-streaming-connect-timeout-in-seconds'], fakeStreamInitiation.connectTimeoutInSeconds);
          assert.strictEqual(headers['iothub-streaming-response-timeout-in-seconds'], fakeStreamInitiation.responseTimeoutInSeconds);
          /*Tests_SRS_NODE_IOTHUB_CLIENT_16_034: [The `initiateStream` method shall have a custom timeout set to the value in milliseconds of the sum of the streamInitiation.connectTimeoutInSeconds and streamInitiation.responseTimeoutInSeconds.]*/
          assert.strictEqual(timeout, 1000 * (fakeStreamInitiation.connectTimeoutInSeconds + fakeStreamInitiation.responseTimeoutInSeconds));
          callback(null, fakeResult, fakeResponse);
        }
      };

      let client = new Client(new EventEmitter(), fakeRestClient);
      client.initiateStream(fakeDeviceId, fakeStreamInitiation, function (err) {
        testCallback(err);
      });
    });

    it('returns a promise if no callback is specified', function (testCallback) {
      const fakeDeviceId = 'fakeDevice';
      const fakeStreamInitiation = {
        connectTimeoutInSeconds: 42,
        responseTimeoutInSeconds: 1337,
        streamName: 'streamName'
      };
      const fakeResponse = {
        statusCode: 200,
        headers: {
          'iothub-streaming-is-accepted': 'True',
          'iothub-streaming-url': 'wss://test',
          'iothub-streaming-authToken': 'token',
        }
      };
      let fakeRestClient = {
        executeApiCall: function (method, path, headers, body, timeout, callback) {
          callback(null, undefined, fakeResponse);
        }
      };

      let client = new Client(new EventEmitter(), fakeRestClient);
      let resultPromise = client.initiateStream(fakeDeviceId, fakeStreamInitiation);
      assert.instanceOf(resultPromise, Promise);
      resultPromise.then(function (result) {
        assert.strictEqual(result.uri, fakeResponse.headers['iothub-streaming-url']);
        assert.strictEqual(result.authorizationToken, fakeResponse.headers['iothub-streaming-auth-token']);
        assert.strictEqual(result.isAccepted, true);
        testCallback();
      });
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_036: [The `initiateStream` method shall create a `StreamInitiationResult` object from the received HTTP response as follows:
    streamInitiationResult.authorizationToken: response.headers['iothub-streaming-auth-token']
    streamInitiationResult.uri: response.headers['iothub-streaming-url']
    streamInitiationResult.isAccepted: true if response.headers['iothub-streaming-is-accepted'] is 'True', false otherwise.]*/
    it('calls the callback with a well-formed response', function (testCallback) {
      const fakeDeviceId = 'fakeDevice';
      const fakeStreamInitiation = {
        connectTimeoutInSeconds: 42,
        responseTimeoutInSeconds: 1337,
        streamName: 'streamName'
      };
      const fakeResponse = {
        statusCode: 200,
        headers: {
          'iothub-streaming-is-accepted': 'True',
          'iothub-streaming-url': 'wss://test',
          'iothub-streaming-authToken': 'token',
        }
      };
      let fakeRestClient = {
        executeApiCall: function (method, path, headers, body, timeout, callback) {
          callback(null, undefined, fakeResponse);
        }
      };

      let client = new Client(new EventEmitter(), fakeRestClient);
      client.initiateStream(fakeDeviceId, fakeStreamInitiation, function (err, result) {
        if (err) {
          testCallback(err);
        } else {
          assert.strictEqual(result.uri, fakeResponse.headers['iothub-streaming-url']);
          assert.strictEqual(result.authorizationToken, fakeResponse.headers['iothub-streaming-auth-token']);
          assert.strictEqual(result.isAccepted, true);
          testCallback();
        }
      });
    });

    /*Tests_SRS_NODE_IOTHUB_CLIENT_16_035: [The `initiateStream` method shall call its callback with an error if the RestApiClient fails to execute the API call.]*/
    it('calls the callback with an error if the RestApiClient fails to execute the API call', function (testCallback) {
      const fakeError = new Error('fake');
      const fakeStreamInitiation = {
        connectTimeoutInSeconds: 42,
        responseTimeoutInSeconds: 1337,
        streamName: 'streamName'
      };
      let fakeRestClient = {
        executeApiCall: function (method, path, headers, body, timeout, callback) {
          callback(fakeError);
        }
      };

      let client = new Client(new EventEmitter(), fakeRestClient);
      client.initiateStream('deviceId', fakeStreamInitiation, function (err) {
        assert.strictEqual(err, fakeError);
        testCallback();
      });
    });
  });
});

const fakeRegistry = {
  create: function (device, done) { done(); },
  addModule: function (module, done) { done(); },
  delete: function (deviceId, done) { done(); }
};

describe('Over simulated AMQP', function () {
  const opts = {
    transport: function () { return new SimulatedAmqp(); },
    connectionString: process.env.IOTHUB_CONNECTION_STRING,
    registry: fakeRegistry
  };
  transportSpecificTests(opts);
});
