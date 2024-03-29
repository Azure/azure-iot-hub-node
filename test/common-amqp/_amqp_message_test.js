// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

const assert = require('chai').assert;
const Message = require('../../dist/common-core/message').Message;
const AmqpMessage = require('../../dist/common-amqp/amqp_message.js').AmqpMessage;
const uuidv4 = require('uuid').v4;
const rhea = require('rhea');

describe('AmqpMessage', function () {
  describe('#fromMessage', function () {
    it('throws if message is falsy', function () {
      assert.throws(function () {
        AmqpMessage.fromMessage(null);
      }, ReferenceError, 'message is \'null\'');
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_05_001: [The fromMessage method shall create a new instance of AmqpMessage.]*/
    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_05_006: [The generated AmqpMessage object shall be returned to the caller.]*/
    it('creates an AmqpMessage object', function () {
      const amqpMessage = AmqpMessage.fromMessage(new Message());
      assert.instanceOf(amqpMessage, AmqpMessage);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_05_003: [If the message argument has a to property, the AmqpMessage object shall have a property named to with the same value.]*/
    it('maps message.to to amqpMessage.to', function () {
      const to = 'destination';
      const message = new Message();
      message.to = to;
      const amqpMessage = AmqpMessage.fromMessage(message);
      assert.equal(amqpMessage.to, to);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_05_003: [If the message argument has a to property, the AmqpMessage object shall have a property named to with the same value.]*/
    it('does not set amqpMessage.to if message.to isn\'t set', function () {
      const amqpMessage = AmqpMessage.fromMessage(new Message());
      assert.notNestedProperty(amqpMessage, 'to');
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_05_004: [If the message argument has an expiryTimeUtc property, the AmqpMessage object shall have a property named absolute_expiry_time with the same value.]*/
    it('maps message.expiryTimeUtc to amqpMessage.absoluteExpiryTime', function () {
      const ts = Date.now() + 60000; // one minute from now
      const message = new Message();
      message.expiryTimeUtc = ts;
      const amqpMessage = AmqpMessage.fromMessage(message);
      assert.equal(amqpMessage.absolute_expiry_time, ts);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_05_004: [If the message argument has an expiryTimeUtc property, the AmqpMessage object shall have a property named absolute_expiry_time with the same value.]*/
    it('does not set amqpMessage.absolute_expiry_time if message.expiryTimeUtc isn\'t set', function () {
      const amqpMessage = AmqpMessage.fromMessage(new Message());
      assert.notNestedProperty(amqpMessage, 'absolute_expiry_time');
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_05_007: [If the message argument has a messageId property, the AmqpMessage object shall have a property named message_id with the same value.]*/
    it('maps message.messageId to amqpMessage.message_id', function () {
      const messageId = '123';
      const message = new Message();
      message.messageId = messageId;
      const amqpMessage = AmqpMessage.fromMessage(message);
      assert.equal(amqpMessage.message_id, messageId);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_011: [If the `Message.messageId` property is a UUID, the AMQP type of the `AmqpMessage.message_id` property shall be forced to Buffer[16].]*/
    it('Forces the messageId type to Buffer[16] if it actually is a uuid', function () {
      const messageId = uuidv4();
      const message = new Message();
      message.messageId = messageId;
      const amqpMessage = AmqpMessage.fromMessage(message);
      assert.instanceOf(amqpMessage.message_id, Buffer, 'Buffer type');
      assert.lengthOf(amqpMessage.message_id, 16, 'length 16');
      assert.strictEqual(rhea.uuid_to_string(amqpMessage.message_id), messageId);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_010: [If the `message` argument has a `correlationId` property, the `AmqpMessage` object shall have a property named `correlation_id` with the same value.]*/
    it('maps message.correlationId to amqpMessage.correlation_id', function () {
      const correlationId = '123';
      const message = new Message();
      message.correlationId = correlationId;
      const amqpMessage = AmqpMessage.fromMessage(message);
      assert.equal(amqpMessage.correlation_id, correlationId);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_012: [If the `Message.correlationId` property is a UUID, the AMQP type of the `AmqpMessage.correlation_id` property shall be forced to Buffer[16].]*/
    it('Forces the correlationId type to Buffer[16] if it actually is a uuid', function () {
      const correlationId = uuidv4();
      const message = new Message();
      message.correlationId = correlationId;
      const amqpMessage = AmqpMessage.fromMessage(message);
      assert.instanceOf(amqpMessage.correlation_id, Buffer, 'Buffer type');
      assert.lengthOf(amqpMessage.correlation_id, 16, 'length 16');
      assert.strictEqual(rhea.uuid_to_string(amqpMessage.correlation_id), correlationId);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_05_007: [If the message argument has a messageId property, the AmqpMessage object shall have a property named message_id with the same value.]*/
    it('does not set amqpMessage.message_id if message.messageId isn\'t set', function () {
      const amqpMessage = AmqpMessage.fromMessage(new Message());
      assert.notNestedProperty(amqpMessage, 'message_id');
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_010: [If the `message` argument has a `correlationId` property, the `AmqpMessage` object shall have a property named `correlation_id` with the same value.]*/
    it('does not set the amqpMessage.correlation_id if message.correlation_id isn\'t set', function () {
      const amqpMessage = AmqpMessage.fromMessage(new Message());
      assert.notNestedProperty(amqpMessage, 'correlation_id');
    });


    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_014: [If the `message` argument has a `contentEncoding` property, the `AmqpMessage` object shall have a property named `content_encoding` with the same value.]*/
    it('maps message.contentEncoding to amqpMessage.properties.contentEncoding', function () {
      const message = new Message();
      message.contentEncoding = 'utf-8';
      const amqpMessage = AmqpMessage.fromMessage(message);
      assert.equal(amqpMessage.content_encoding, message.contentEncoding);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_015: [If the `message` argument has a `contentType` property, the `AmqpMessage` object shall have a property named `content_type` with the same value.]*/
    it('maps message.contentType to amqpMessage.content_type', function () {
      const message = new Message();
      message.contentType = 'utf-8';
      const amqpMessage = AmqpMessage.fromMessage(message);
      assert.equal(amqpMessage.content_type, message.contentType);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_05_008: [If needed, the created AmqpMessage object shall have a property of type Object named application_properties.]*/
    it('does not create amqpMessage.application_properties object if the are no application properties', function () {
      const amqpMessage = AmqpMessage.fromMessage(new Message());
      assert.notProperty(amqpMessage, 'application_properties');
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_05_008: [If needed, the created AmqpMessage object shall have a property of type Object named application_properties.]*/
    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_05_009: [If the message argument has an ack property, the application_properties property of the AmqpMessage object shall have a property named iothub-ack with the same value.]*/
    it('maps message.ack to amqpMessage.application_properties[\'iothub-ack\']', function () {
      const ack = 'full';
      const message = new Message();
      message.ack = ack;
      const amqpMessage = AmqpMessage.fromMessage(message);
      assert.equal(amqpMessage.application_properties['iothub-ack'], ack);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_13_001: [ If message.properties is truthy, then all the properties in it shall be copied to the application_properties property of the AmqpMessage object. ]*/
    it('copies message.properties to amqpMessage.application_properties', function () {
      const message = new Message();
      let keyItem = '';
      let valueItem = '';
      const numProps = 10;

      for (let i = 0; i < numProps; i++) {
        keyItem = "itemKey" + (i + 1);
        valueItem = "itemValue" + (i + 1);
        message.properties.add(keyItem, valueItem);
      }

      const amqpMessage = AmqpMessage.fromMessage(message);
      assert.isOk(amqpMessage.application_properties);

      for (let i = 0; i < numProps; i++) {
        keyItem = "itemKey" + (i + 1);
        valueItem = "itemValue" + (i + 1);
        assert.property(amqpMessage.application_properties, keyItem);
        assert.strictEqual(amqpMessage.application_properties[keyItem], valueItem);
      }
    });

    it('SPECIAL cases the message property \'dt-subject\' to be placed into the message annotations.', function () {
      const message = new Message();
      const DT_SUBJECT = 'dt-subject';
      const DT_VALUE = 'abcd';
      message.properties.add(DT_SUBJECT, DT_VALUE);

      const amqpMessage = AmqpMessage.fromMessage(message);
      assert.isOk(amqpMessage.message_annotations[DT_SUBJECT]);
      assert.strictEqual(amqpMessage.message_annotations[DT_SUBJECT], DT_VALUE);

    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_013: [If one of the property key is `IoThub-status`, this property is reserved and shall be forced to an `int` `rhea` type.]*/
    it('forces the IoThub-status property encoding to \'int\' if it exists', function () {
      const message = new Message();
      const statusKey = 'IoThub-status';
      const statusValue = 42;
      message.properties.add(statusKey, statusValue);

      const amqpMessage = AmqpMessage.fromMessage(message);
      assert.strictEqual(amqpMessage.application_properties[statusKey].type.name, 'SmallInt');
      assert.strictEqual(amqpMessage.application_properties[statusKey].value, statusValue);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_13_001: [ If message.properties is truthy, then all the properties in it shall be copied to the application_properties property of the AmqpMessage object. ]*/
    it('does not create amqpMessage.application_properties when there are no properties', function () {
      const message = new Message();
      const amqpMessage = AmqpMessage.fromMessage(message);
      assert.isNotOk(amqpMessage.application_properties);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_05_009: [If the message argument has an ack property, the application_properties property of the AmqpMessage object shall have a property named iothub-ack with the same value.]*/
    it('does not set amqpMessage.application_properties[\'iothub-ack\'] if message.ack isn\'t set', function () {
      const amqpMessage = AmqpMessage.fromMessage(new Message());
      assert.notNestedProperty(amqpMessage, 'application_properties.iothub-ack');
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_05_005: [If message.getData() is truthy, the AmqpMessage object shall have a property named body with the value returned from message.getData().]*/
    it('copies Message body', function () {
      const body = 'hello';
      const message = new Message(body);
      const amqpMessage = AmqpMessage.fromMessage(message);
      assert.equal(amqpMessage.body.content.toString(), body);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_05_005: [If message.getData() is truthy, the AmqpMessage object shall have a property named body with the value returned from message.getData().]*/
    it('does not set amqpMessage.body if message does not have a body', function () {
      const amqpMessage = AmqpMessage.fromMessage(new Message());
      assert.notProperty(amqpMessage, 'body');
    });
  });

  describe('#toMessage', function () {
    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_001: [The `toMessage` method shall throw if the `amqpMessage` argument is falsy.]*/
    [null, undefined, ''].forEach(function (badMsg) {
      it ('throws if amqpMessage is \'' + badMsg + '\'', function () {
        assert.throws(function () {
          return AmqpMessage.toMessage(badMsg);
        }, ReferenceError);
      });
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_002: [The `toMessage` method shall return a `Message` object.]*/
    it('creates a Message object', function () {
      const testAmqpMessage = { };
      assert.instanceOf(AmqpMessage.toMessage(testAmqpMessage), Message);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_003: [The `toMessage` method shall set the `Message.correlationId` property to the `AmqpMessage.correlation_id` value if it is present.]*/
    it('sets the correlationId property', function () {
      const testAmqpMessage = {
        correlation_id: 'test'
      };

      const convertedMessage = AmqpMessage.toMessage(testAmqpMessage);
      assert.strictEqual(convertedMessage.correlationId, testAmqpMessage.correlation_id);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_004: [The `toMessage` method shall set the `Message.messageId` property to the `AmqpMessage.message_id` value if it is present.]*/
    it('sets the messageId property', function () {
      const testAmqpMessage = {
        message_id: 'test'
      };

      const convertedMessage = AmqpMessage.toMessage(testAmqpMessage);
      assert.strictEqual(convertedMessage.messageId, testAmqpMessage.message_id);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_005: [The `toMessage` method shall set the `Message.to` property to the `AmqpMessage.to` value if it is present.]*/
    it('sets the to property', function () {
      const testAmqpMessage = {
        to: 'test'
      };

      const convertedMessage = AmqpMessage.toMessage(testAmqpMessage);
      assert.strictEqual(convertedMessage.to, testAmqpMessage.to);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_006: [The `toMessage` method shall set the `Message.expiryTimeUtc` property to the `AmqpMessage.absolute_expiry_time` value if it is present.]*/
    it('sets the absoluteExpiryTime property', function () {
      const testAmqpMessage = {
        absolute_expiry_time: 'test'
      };

      const convertedMessage = AmqpMessage.toMessage(testAmqpMessage);
      assert.strictEqual(convertedMessage.expiryTimeUtc, testAmqpMessage.absolute_expiry_time);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_017: [The `toMessage` method shall set the `Message.contentEncoding` property to the `AmqpMessage.content_encoding` value if it is present. ]*/
    it('sets the contentEncoding property', function () {
      const testAmqpMessage = {
        content_encoding: 'utf-8'
      };

      const convertedMessage = AmqpMessage.toMessage(testAmqpMessage);
      assert.strictEqual(convertedMessage.contentEncoding, testAmqpMessage.content_encoding);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_016: [The `toMessage` method shall set the `Message.contentType` property to the `AmqpMessage.content_type` value if it is present. ]*/
    it('sets the contentType property', function () {
      const testAmqpMessage = {
        content_type: 'utf-8'
      };

      const convertedMessage = AmqpMessage.toMessage(testAmqpMessage);
      assert.strictEqual(convertedMessage.contentType, testAmqpMessage.content_type);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_008: [The `toMessage` method shall set the `Message.ack` property to the `AmqpMessage.application_properties['iothub-ack']` value if it is present.]*/
    it('sets the ack property', function () {
      const testAmqpMessage = {
        application_properties: {
          'iothub-ack': 'test'
        }
      };

      const convertedMessage = AmqpMessage.toMessage(testAmqpMessage);
      assert.strictEqual(convertedMessage.ack, testAmqpMessage.application_properties['iothub-ack']);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_007: [The `toMessage` method shall convert the user-defined `AmqpMessage.applicationProperties` to a `Properties` collection stored in `Message.properties`.]*/
    it('sets the custom properties', function () {
      const testAmqpMessage = {
        application_properties: {
          k1: 'v1',
          k2: 'v2'
        }
      };

      const convertedMessage = AmqpMessage.toMessage(testAmqpMessage);
      assert.strictEqual(convertedMessage.properties.count(), 2);
      assert.strictEqual(convertedMessage.properties.getItem(0).key, 'k1');
      assert.strictEqual(convertedMessage.properties.getItem(0).value, 'v1');
      assert.strictEqual(convertedMessage.properties.getItem(1).key, 'k2');
      assert.strictEqual(convertedMessage.properties.getItem(1).value, 'v2');
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_009: [The `toMessage` method shall set the `Message.data` of the message to the content of the `AmqpMessage.body.content` property.]*/
    it('sets the body of the message', function () {
      const testAmqpMessage = {
        body: {
          content: 'test'
        }
      };

      const convertedMessage = AmqpMessage.toMessage(testAmqpMessage);
      assert.strictEqual(convertedMessage.data, testAmqpMessage.body.content);
    });

    /*Tests_SRS_NODE_IOTHUB_AMQPMSG_16_009: [The `toMessage` method shall set the `Message.data` of the message to the content of the `AmqpMessage.body.content` property.]*/
    it('does NOT set the body of the message if amqpMessage.body is undefined', function () {
      const testAmqpMessage = {};

      const convertedMessage = AmqpMessage.toMessage(testAmqpMessage);
      assert.isNotOk(convertedMessage.data, 'is undefined');
    });
  });
});
