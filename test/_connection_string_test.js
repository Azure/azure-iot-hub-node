// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

const assert = require('chai').assert;
const ArgumentError = require('azure-iot-common').errors.ArgumentError;
const ConnectionString = require('../dist/connection_string.js');

const incompleteConnectionStrings = {
  HostName: 'SharedAccessKeyName=keyname;SharedAccessKey=key',
  SharedAccessKeyName: 'HostName=hostname;SharedAccessKey=key',
  SharedAccessKey: 'HostName=name;SharedAccessKeyName=keyname'
};

describe('ConnectionString', function () {
  describe('#parse', function () {
    /*Tests_SRS_NODE_IOTHUB_CONNSTR_05_001: [The parse method shall return the result of calling azure-iot-common.ConnectionString.parse.]*/
    /*Tests_SRS_NODE_IOTHUB_CONNSTR_05_002: [It shall throw ArgumentError if any of 'HostName', 'SharedAccessKeyName', or 'SharedAccessKey' fields are not found in the source argument.]*/
    ['HostName', 'SharedAccessKeyName', 'SharedAccessKey'].forEach(function (key) {
      it('throws if connection string is missing ' + key, function () {
        assert.throws(function () {
          ConnectionString.parse(incompleteConnectionStrings[key]);
        }, ArgumentError);
      });
    });
  });
});
