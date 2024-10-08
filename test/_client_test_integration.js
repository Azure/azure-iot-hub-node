// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';
const Registry = require('../dist/registry.js').Registry;
const AmqpWs = require('../dist/amqp_ws.js').AmqpWs;

const transportSpecificTests = require('./_client_common_testrun.js');

//This test is flaky in the build pipeline
describe.skip('Over real AMQP (Default Transport) - this test will be skipped', function () {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);
  const opts = {
    transport: null,
    connectionString: process.env.IOTHUB_CONNECTION_STRING,
    registry: Registry.fromConnectionString(process.env.IOTHUB_CONNECTION_STRING)
  };
  transportSpecificTests(opts);
});

//This test is flaky in the build pipeline
describe.skip('Over real AMQP over Websockets - this test will be skipped', function () {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);
  const opts = {
    transport: AmqpWs,
    connectionString: process.env.IOTHUB_CONNECTION_STRING,
    registry: Registry.fromConnectionString(process.env.IOTHUB_CONNECTION_STRING)
  };
  transportSpecificTests(opts);
});
