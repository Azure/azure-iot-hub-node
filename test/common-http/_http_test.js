'use strict';

const Http = require('../../dist/common-http/http').Http;
const https = require('https');
const node_http = require('http');
const assert = require('chai').assert;
const sinon = require('sinon');
const EventEmitter = require('events');

describe('Http', function () {
  describe('#parseErrorBody', function (){
    /*Tests_SRS_NODE_DEVICE_HTTP_16_001: [If the error body can be parsed the `parseErrorBody` function shall return an object with the following properties:
    - `name`: the name of the error that the server is returning
    - `message`: the human-readable error message]*/
    it('returns a object with the error code and message if the error is properly formatted', function (){
      // eslint-disable-next-line no-useless-escape
      const body = '{\"Message\":\"ErrorCode:FakeErrorCode;Fake Error Message\"}';
      const result = Http.parseErrorBody(body);
      assert.equal(result.code, 'FakeErrorCode');
      assert.equal(result.message, 'Fake Error Message');
    });

    /*Tests_SRS_NODE_DEVICE_HTTP_16_002: [If the error body cannot be parsed the `parseErrorBody` function shall return `null`.]*/
    [
      { errorBody: '{ Incomplete JSON', issueDescription: 'has incomplete JSON' },
      // eslint-disable-next-line no-useless-escape
      { errorBody: '{\"Message\":\"ErrorCode:NoErrorMessageCode"}', issueDescription: 'has no error message' },
      // eslint-disable-next-line no-useless-escape
      { errorBody: '{\"Message\":\"NoErrorCode;Fake Error Message\"}', issueDescription: 'has no error code' }
    ].forEach(function (testParam) {
      it('returns null if the error ' + testParam.issueDescription, function (){
        const result = Http.parseErrorBody(testParam.errorBody);
        assert.isNull(result);
      });
    });
  });

  describe('#buildRequest 1', function () {
    const fakeOptions = {
      http: {
        agent: '__FAKE_AGENT__'
      }
    };
    const fakePath = '__FAKE_PATH__';
    const fakeHeaders = { 'fake' : true };
    const fakeHost = '__FAKE_HOST__';

    beforeEach(function () {
      sinon.stub(https, 'request').returns(new EventEmitter());
      sinon.stub(node_http, 'request').returns(new EventEmitter());
    });

    afterEach(function () {
      https.request.restore();
      node_http.request.restore();
    });

    it ('uses the right agent value', function (callback) {
      const http = new Http();
      http.setOptions(fakeOptions);
      http.buildRequest('GET', fakePath, fakeHeaders, fakeHost, function () {});
      assert(https.request.called);
      const httpOptions = https.request.firstCall.args[0];
      assert.strictEqual(httpOptions.agent, fakeOptions.http.agent);
      callback();
    });

    // Tests_SRS_NODE_HTTP_13_004: [ Use the request object from the `options` object if one has been provided or default to HTTPS request. ]
    it ('uses https when using tcp', function (callback) {
      const http = new Http();
      http.setOptions(fakeOptions);
      http.buildRequest('GET', fakePath, fakeHeaders, fakeHost, function () {});
      assert(https.request.called);
      callback();
    });

    // Tests_SRS_NODE_HTTP_13_004: [ Use the request object from the `options` object if one has been provided or default to HTTPS request. ]
    it ('uses supplied request object when using tcp', function (callback) {
      const http = new Http();
      http.setOptions(fakeOptions);
      const requestOptions = {
        request: sinon.stub().returns(new EventEmitter())
      };
      http.buildRequest('GET', fakePath, fakeHeaders, fakeHost, requestOptions, function () {});
      assert(requestOptions.request.called);
      callback();
    });

    // Tests_SRS_NODE_HTTP_13_005: [ Use the request object from the http module when dealing with unix domain socket based HTTP requests. ]
    it ('uses http when using unix domain socket', function (callback) {
      const http = new Http();
      http.setOptions(fakeOptions);
      http.buildRequest('GET', fakePath, fakeHeaders, { socketPath: fakeHost }, function () {});
      assert(node_http.request.called);
      callback();
    });

    it ('uses custom port if specified', function (callback) {
      const http = new Http();
      http.setOptions(fakeOptions);
      const requestOptions = {
        request: sinon.stub().returns(new EventEmitter()),
        port: 12345
      };
      http.buildRequest('GET', fakePath, fakeHeaders, fakeHost, requestOptions, function () {});
      assert(requestOptions.request.called);
      assert.strictEqual(requestOptions.request.args[0][0].port, 12345);
      callback();
    });

    it ('uses x509 options if specified', function (callback) {
      const http = new Http();
      http.setOptions(fakeOptions);
      const x509Options = {
        cert: 'cert1',
        key: 'key1',
        passphrase: 'pass1'
      };
      http.buildRequest('GET', fakePath, fakeHeaders, fakeHost, x509Options, function () {});
      assert.strictEqual(https.request.args[0][0].cert, 'cert1');
      assert.strictEqual(https.request.args[0][0].key, 'key1');
      assert.strictEqual(https.request.args[0][0].passphrase, 'pass1');
      callback();
    });

    it('uses x509 options if client certificate engine is specified', function (callback) {
      const http = new Http();
      const clientCertEngine = 'SecureStorageEngine.so';
      const x509Options = {
        clientCertEngine
      };

      http.setOptions(fakeOptions);
      http.buildRequest('GET', fakePath, fakeHeaders, fakeHost, x509Options, function () {});
      assert.strictEqual(https.request.args[0][0].clientCertEngine, clientCertEngine);
      callback();
    });

    it('populates the ca if provided in the options', function (callback) {
      const http = new Http();
      const fakeCA = 'ca';
      http.setOptions({ ca: fakeCA });
      http.buildRequest('GET', fakePath, fakeHeaders, fakeHost, null, function () {});
      assert.strictEqual(https.request.args[0][0].ca, fakeCA);
      callback();
    });
  });

  describe('#buildRequest 2', function () {
    const fakeOptions = {
      http: {
        agent: '__FAKE_AGENT__'
      }
    };
    const fakePath = '__FAKE_PATH__';
    const fakeHeaders = { 'fake' : true };
    const fakeHost = '__FAKE_HOST__';
    const fakeResponse = {
      on: function () {}
    };

    beforeEach(function () {
      sinon.stub(https, 'request')
        .callsFake(function (httpOptions, callback) {
          callback(fakeResponse);
          return new EventEmitter();
        });

      sinon.stub(fakeResponse, 'on')
        .callsFake(function (eventName, callback) {
          if (eventName === 'error') {
            callback('whoops');
          }
        });
    });

    afterEach(function () {
      https.request.restore();
    });

    it ('forwards response error', function (callback) {
      const http = new Http();
      http.setOptions(fakeOptions);
      http.buildRequest('GET', fakePath, fakeHeaders, fakeHost, function (err) {
        assert.strictEqual(err, 'whoops');
        callback();
      });
    });
  });

  describe('#buildRequest 3', function () {
    const fakeOptions = {
      http: {
        agent: '__FAKE_AGENT__'
      }
    };
    const fakePath = '__FAKE_PATH__';
    const fakeHeaders = { 'fake' : true };
    const fakeHost = '__FAKE_HOST__';
    const fakeResponse = {
      statusCode: 200,
      on: function () {}
    };
    let dataCallback;
    let   endCallback;

    beforeEach(function () {
      sinon.stub(https, 'request')
        .callsFake(function (httpOptions, callback) {
          callback(fakeResponse);
          return new EventEmitter();
        });

      sinon.stub(fakeResponse, 'on')
        .callsFake(function (eventName, callback) {
          if (eventName === 'data') {
            dataCallback = callback;
          } else if (eventName === 'end') {
            endCallback = callback;

            // generate some data and then raise 'end'
            setTimeout(function () {
              dataCallback('somedata');
              endCallback();
            }, 1);
          }
        });
    });

    afterEach(function () {
      https.request.restore();
    });

    it ('handles data', function (callback) {
      const http = new Http();
      http.setOptions(fakeOptions);
      http.buildRequest('GET', fakePath, fakeHeaders, fakeHost, function (err, body, response) {
        assert.isNotOk(err);
        assert.strictEqual(body, 'somedata');
        assert.strictEqual(response.statusCode, 200);
        callback();
      });
    });
  });

  describe('#buildRequest 4', function () {
    const fakeOptions = {
      http: {
        agent: '__FAKE_AGENT__'
      }
    };
    const fakePath = '__FAKE_PATH__';
    const fakeHeaders = { 'fake' : true };
    const fakeHost = '__FAKE_HOST__';
    const fakeResponse = {
      statusCode: 300,
      statusMessage: 'not good',
      on: function () {}
    };

    beforeEach(function () {
      sinon.stub(https, 'request')
        .callsFake(function (httpOptions, callback) {
          callback(fakeResponse);
          return new EventEmitter();
        });

      sinon.stub(fakeResponse, 'on')
        .callsFake(function (eventName, callback) {
          if (eventName === 'end') {
            setTimeout(callback, 1);
          }
        });
    });

    afterEach(function () {
      https.request.restore();
    });

    it ('handles request error', function (callback) {
      const http = new Http();
      http.setOptions(fakeOptions);
      http.buildRequest('GET', fakePath, fakeHeaders, fakeHost, function (err) {
        assert.isOk(err);
        assert.strictEqual(err.message, 'not good');
        callback();
      });
    });
  });

  describe('#toMessage', function () {
    /*Tests_SRS_NODE_HTTP_13_001: [ If the HTTP response has a header with the prefix iothub-app- then a new property with the header name and value as the key and value shall be added to the message. ]*/
    it('adds HTTP headers with prefix iothub-app- as message properties', function () {
      const mockResponse = {
        statusCode: 200,
        headers: {
          'iothub-app-k1': 'v1',
          'iothub-app-k2': 'v2',
          'iothub-app-k3': 'v3'
        }
      };
      const mockBody = 'boo';
      const httpTransport = new Http();
      const message = httpTransport.toMessage(mockResponse, mockBody);

      assert.isOk(message);
      assert.isOk(message.properties);
      const count = message.properties.count();
      assert.strictEqual(count, 3);

      for(let i = 1; i <= count; ++i) {
          const key = 'iothub-app-k' + i.toString();
          const val = 'v' + i.toString();
          const item = message.properties.getItem(i - 1);
          assert.isOk(item);
          assert.isOk(item.key);
          assert.isOk(item.value);
          assert.strictEqual(item.key, key);
          assert.strictEqual(item.value, val);
        }
    });
  });
});
