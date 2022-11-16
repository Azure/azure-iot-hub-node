// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

const assert = require('chai').assert;
const uuid = require('uuid');
const Registry = require('../dist/registry.js').Registry;
const ConnectionString = require('../dist/connection_string.js');

function makeConnectionString(host, policy, key) {
  return 'HostName=' + host + ';SharedAccessKeyName=' + policy + ';SharedAccessKey=' + key;
}

const goodConnectionString = process.env.IOTHUB_CONNECTION_STRING;
const cn = ConnectionString.parse(goodConnectionString);

const badConnectionStrings = [
  makeConnectionString('bad' + uuid.v4() + '.net', cn.SharedAccessKeyName, cn.SharedAccessKey),
  makeConnectionString(cn.HostName, 'bad', cn.SharedAccessKey),
  makeConnectionString(cn.HostName, cn.SharedAccessKeyName, 'bad'),
];

function one() {
  return '0000000000000000000000000000000000000000';
}
function two() {
  return '1111111111111111111111111111111111111111';
}

let basicDevice = {
  deviceId: 'testDevice' + uuid.v4(),
  status: 'disabled'
};

const x509Device = {
  deviceId: 'testDevice' + uuid.v4(),
  starts: 'disabled',
  authentication: {
    x509Thumbprint : {
      primaryThumbprint: one(),
      secondaryThumbprint: two()
    }
  }
};

function badConfigTests(opName, badConnStrings, requestFn) {
  function makeRequestWith(connString, test, done) {
    const registry = Registry.fromConnectionString(connString);
    requestFn(registry, function (err, dev, res) {
      test(err, dev, res);
      done();
    });
  }

  function expectNotFoundError(err) {
    assert.include(err.message, 'getaddrinfo ENOTFOUND');
  }

  function expect401Response(err) {
    assert.isNotNull(err);
    assert.equal(err.response.statusCode, 401);
  }

  const tests = [
    { name: 'hostname is malformed', expect: expectNotFoundError },
    { name: 'policy does not exist', expect: expect401Response },
    { name: 'key is wrong', expect: expect401Response }
  ];

  badConnStrings.forEach(function (connStr, index) {
    it('fails to ' + opName + ' when the ' + tests[index].name, function (done) {
      makeRequestWith(connStr, tests[index].expect, done);
    });
  });
}

describe('Over real HTTPS', function () {
  // eslint-disable-next-line no-invalid-this
  this.timeout(60000);
  describe('Registry', function () {
    describe('#create', function () {
      [basicDevice, x509Device].forEach(function (device) {
        it('creates a new device with deviceId: ' + device.deviceId, function (done) {
          const registry = Registry.fromConnectionString(goodConnectionString);
          registry.create(device, function (err, dev, response) {
            if (err) {
              done(err);
            } else {
              assert.equal(device.deviceId, dev.deviceId);
              assert.notEqual(device, dev);
              assert.equal(response.statusCode, 200);
              done();
            }
          });
        });
      });

      badConfigTests('create device information', badConnectionStrings, function (registry, done) {
        registry.create(basicDevice, done);
      });
    });

    describe('#get', function () {
      it('returns information about the given device', function (done) {
        const registry = Registry.fromConnectionString(goodConnectionString);
        registry.get(basicDevice.deviceId, function (err, dev, response) {
          if (err) {
            done(err);
          } else {
            assert.equal(basicDevice.deviceId, dev.deviceId);
            assert.equal(response.statusCode, 200);
            basicDevice = dev;
            done();
          }
        });
      });

      badConfigTests('get device information', badConnectionStrings, function (registry, done) {
        registry.get(basicDevice.deviceId, done);
      });
    });

    describe('#list', function () {
      it('returns information about a list of devices', function (done) {
        const registry = Registry.fromConnectionString(goodConnectionString);
        registry.list(function (err, deviceList, response) {
          if (err) {
            done(err);
          } else {
            assert.isArray(deviceList);
            assert.equal(response.statusCode, 200);
            done();
          }
        });
      });

      badConfigTests('list device information', badConnectionStrings, function (registry, done) {
        registry.list(done);
      });
    });

    describe('#update', function () {
      it('updates information about a device', function (done) {
        const registry = Registry.fromConnectionString(goodConnectionString);
        registry.update(basicDevice, function (err, dev, response) {
          if (err) {
            done(err);
          } else {
            assert.equal(basicDevice.deviceId, dev.deviceId);
            assert.equal(response.statusCode, 200);
            done();
          }
        });
      });

      badConfigTests('update device information', badConnectionStrings, function (registry, done) {
        registry.update(basicDevice, done);
      });
    });

    describe('#delete', function () {
      [basicDevice, x509Device].forEach(function (device) {
        it('deletes the given device with deviceId: ' + device.deviceId, function (done) {
          const registry = Registry.fromConnectionString(goodConnectionString);
          registry.delete(device.deviceId, function (err) {
            done(err);
          });
        });
      });

      badConfigTests('delete device information', badConnectionStrings, function (registry, done) {
        registry.delete(basicDevice.deviceId, done);
      });
    });
  });
});
