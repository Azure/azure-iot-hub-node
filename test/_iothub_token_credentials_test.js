const assert = require('chai').assert;
const sinon = require('sinon');
const IoTHubTokenCredentials = require('../dist/auth/iothub_token_credentials').IoTHubTokenCredentials;

describe('IoTHubTokenCredentials', function () {
  describe('getHubName', function () {
    it('returns the Azure IoT hub hostname contained in the connection string', function () {
      const testHostName = 'host.name';
      const testConnectionString = 'HostName=' + testHostName + ';SharedAccessKeyName=service;SharedAccessKey=' + Buffer.from('testkey').toString('base64');
      const testCreds = new IoTHubTokenCredentials(testConnectionString);
      assert.strictEqual(testCreds.getHubName(), testHostName);
    });
  });

  describe('signRequest', function () {
    it('adds a shared access signature in the authorization header', function (testCallback) {
      const testConnectionString = 'HostName=host.name;SharedAccessKeyName=service;SharedAccessKey=' + Buffer.from('testkey').toString('base64');
      const testCreds = new IoTHubTokenCredentials(testConnectionString);
      const testRequest = {
        headers: {
          set: sinon.stub().callsFake(function (headerName, headerContent) {
            assert.strictEqual(headerName, 'authorization');
            assert.include(headerContent, 'SharedAccessSignature');
            assert.include(headerContent, 'sr=');
            assert.include(headerContent, 'se=');
            assert.include(headerContent, 'sig=');
          })
        }
      };

      testCreds.signRequest(testRequest).then(function (updatedRequest) {
        assert.strictEqual(updatedRequest, testRequest); // verify it's the same object
        testCallback();
      });
    });
  });
});
