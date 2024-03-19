// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';
const Amqp = require('../dist/amqp.js').Amqp;
const AmqpWs = require('../dist/amqp_ws.js').AmqpWs;
const assert = require('chai').assert;
const results = require('../dist/common-core/results.js');
const sinon = require('sinon');

describe('AmqpWs', function () {
  describe('#constructor', function () {
    /*Tests_SRS_NODE_IOTHUB_SERVICE_AMQP_WS_16_002: [`AmqpWs` should inherit from `Amqp`.]*/
    it('inherits from `Amqp`', function () {
      const amqpWs = new AmqpWs({
        host: 'host',
        keyName: 'keyName',
        sharedAccessSignature: 'sas'
      });

      assert.instanceOf(amqpWs, Amqp);
    });
  });

  describe('#connect', function () {
    it('calls the connect method on the base AMQP object with the correct URL', function () {
      const testConfig = {
        host: 'host',
        keyName: 'keyName',
        sharedAccessSignature: 'sas'
      };

      const amqpWs = new AmqpWs(testConfig);
      amqpWs._amqp.connect = sinon.stub().callsArgWith(1, null, new results.Connected());
      amqpWs.initializeCBS = sinon.stub().callsArg(0);
      amqpWs.putToken = sinon.stub().callsArg(2);
      amqpWs.disconnect = sinon.stub().callsArg(0);

      amqpWs.connect(function (){});
      assert.strictEqual(amqpWs._amqp.connect.args[0][0].uri.indexOf('wss://'), 0);
      assert(amqpWs._amqp.connect.args[0][0].uri.indexOf('$iothub/websocket') > 0);
    });
  });
});
