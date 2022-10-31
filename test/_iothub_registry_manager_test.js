/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for
 * license information.
 */

const assert = require('chai').assert;
const sinon = require('sinon');
const IoTHubRegistryManager = require('../dist/cl/iothub_registry_manager').IoTHubRegistryManager;

const testCredentials = {
  signRequest: sinon.stub().callsFake(function (webResource) {
    return Promise.resolve(webResource);
  }),
  getHubName: sinon.stub().returns('fake.host.name')
};

describe('IoTHubRegistryManager', function () {
  it(`Constructor creates an instance of the IoTHubRegistryManager`, function (testCallback) {
    const ioTHubRegistryManager = new IoTHubRegistryManager(testCredentials);
    assert.instanceOf(ioTHubRegistryManager, IoTHubRegistryManager);
    testCallback();
  });

  it('createDeviceWithSas calls the createOrUpdateIdentity method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
      };
    const testDeviceId = 'testDeviceId';
    const testPrimaryKey = 'testPrimaryKey';
    const testSecondaryKey = 'testSecondaryKey';
    const testIsEnabled = true;

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.devices.createOrUpdateIdentity = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.createDeviceWithSas(testDeviceId, testPrimaryKey, testSecondaryKey, testIsEnabled);
    assert.isTrue(testClient._pl.devices.createOrUpdateIdentity.calledWith(
        testDeviceId,
        sinon.match.has('deviceId', testDeviceId)
        .and(sinon.match.has('status', 'enabled'))
        .and(sinon.match.has('authentication'))
        .and(sinon.match.hasNested('authentication.type', 'sas'))
        .and(sinon.match.hasNested('authentication.symmetricKey'))
        .and(sinon.match.hasNested('authentication.symmetricKey.primaryKey', testPrimaryKey))
        .and(sinon.match.hasNested('authentication.symmetricKey.secondaryKey', testSecondaryKey))
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('createDeviceWithX509 calls the createOrUpdateIdentity method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
      };
    const testDeviceId = 'testDeviceId';
    const testPrimaryThumbprint = 'primaryThumbprint';
    const testSecondaryThumbprint = 'secondaryThumbprint';
    const testIsEnabled = true;

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.devices.createOrUpdateIdentity = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.createDeviceWithX509(testDeviceId, testPrimaryThumbprint, testSecondaryThumbprint, testIsEnabled);
    assert.isTrue(testClient._pl.devices.createOrUpdateIdentity.calledWith(
        testDeviceId,
        sinon.match.has('deviceId', testDeviceId)
        .and(sinon.match.has('status', 'enabled'))
        .and(sinon.match.has('authentication'))
        .and(sinon.match.hasNested('authentication.type', 'selfSigned'))
        .and(sinon.match.hasNested('authentication.x509Thumbprint'))
        .and(sinon.match.hasNested('authentication.x509Thumbprint.primaryThumbprint', testPrimaryThumbprint))
        .and(sinon.match.hasNested('authentication.x509Thumbprint.secondaryThumbprint', testSecondaryThumbprint))
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('createDeviceWithCertificateAuthority calls the createOrUpdateIdentity method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
      };
    const testDeviceId = 'testDeviceId';
    const testIsEnabled = true;
    const testIoTEdge = true;

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.devices.createOrUpdateIdentity = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.createDeviceWithCertificateAuthority(testDeviceId, testIsEnabled, testIoTEdge);
    assert.isTrue(testClient._pl.devices.createOrUpdateIdentity.calledWith(
        testDeviceId,
        sinon.match.has('deviceId', testDeviceId)
        .and(sinon.match.has('status', 'enabled'))
        .and(sinon.match.has('capabilities'))
        .and(sinon.match.hasNested('capabilities.iotEdge', testIoTEdge))
        .and(sinon.match.has('authentication'))
        .and(sinon.match.hasNested('authentication.type', 'certificateAuthority'))
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('updateDevice calls the createOrUpdateIdentity method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
      };
    const testDeviceId = 'testDeviceId';
    const testDevice = 'testDevice';
    const testIfMatch = {
      ifMatch: '*'
    }

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.devices.createOrUpdateIdentity = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.updateDevice(testDeviceId, testDevice);
    assert.isTrue(testClient._pl.devices.createOrUpdateIdentity.calledWith(
        testDeviceId,
        testDevice,
        testIfMatch
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('getDevice calls the getIdentity method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
      };
    const testDeviceId = 'testDeviceId';

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.devices.getIdentity = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.getDevice(testDeviceId);
    assert.isTrue(testClient._pl.devices.getIdentity.calledWith(
        testDeviceId
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('deleteDevice calls the deleteIdentity method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
      };
    const testDeviceId = 'testDeviceId';
    const testETag = 'testETag';

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.devices.deleteIdentity = sinon.stub().resolves(returnValue);
    await testClient.deleteDevice(testDeviceId, testETag);
    assert.isTrue(testClient._pl.devices.deleteIdentity.calledWith(
        testDeviceId,
        sinon.match.has('ifMatch', testETag)
    ));
  });

  it('createModuleWithSas calls the createOrUpdateIdentity method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
      };
    const testDeviceId = 'testDeviceId';
    const testModuleId = 'testModuleId';
    const testManagedBy = 'testManagedBy';
    const testPrimaryKey = 'testPrimaryKey';
    const testSecondaryKey = 'testSecondaryKey';
    const testIsEnabled = true;

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.modules.createOrUpdateIdentity = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.createModuleWithSas(testDeviceId, testModuleId, testManagedBy, testPrimaryKey, testSecondaryKey, testIsEnabled);
    assert.isTrue(testClient._pl.modules.createOrUpdateIdentity.calledWith(
        testDeviceId,
        testModuleId,
        sinon.match.has('deviceId', testDeviceId)
        .and(sinon.match.has('moduleId', testModuleId))
        .and(sinon.match.has('managedBy', testManagedBy))
        .and(sinon.match.has('authentication'))
        .and(sinon.match.hasNested('authentication.type', 'sas'))
        .and(sinon.match.hasNested('authentication.symmetricKey'))
        .and(sinon.match.hasNested('authentication.symmetricKey.primaryKey', testPrimaryKey))
        .and(sinon.match.hasNested('authentication.symmetricKey.secondaryKey', testSecondaryKey))
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('createModuleWithX509 calls the createOrUpdateIdentity method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
      };
    const testDeviceId = 'testDeviceId';
    const testModuleId = 'testModuleId';
    const testManagedBy = 'testManagedBy';
    const testPrimaryThumbprint = 'primaryThumbprint';
    const testSecondaryThumbprint = 'secondaryThumbprint';
    const testIsEnabled = true;

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.modules.createOrUpdateIdentity = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.createModuleWithX509(testDeviceId, testModuleId, testManagedBy, testPrimaryThumbprint, testSecondaryThumbprint, testIsEnabled);
    assert.isTrue(testClient._pl.modules.createOrUpdateIdentity.calledWith(
        testDeviceId,
        testModuleId,
        sinon.match.has('deviceId', testDeviceId)
        .and(sinon.match.has('moduleId', testModuleId))
        .and(sinon.match.has('managedBy', testManagedBy))
        .and(sinon.match.has('authentication'))
        .and(sinon.match.hasNested('authentication.type', 'selfSigned'))
        .and(sinon.match.hasNested('authentication.x509Thumbprint'))
        .and(sinon.match.hasNested('authentication.x509Thumbprint.primaryThumbprint', testPrimaryThumbprint))
        .and(sinon.match.hasNested('authentication.x509Thumbprint.secondaryThumbprint', testSecondaryThumbprint))
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('createModuleWithCertificateAuthority calls the createOrUpdateIdentity method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
      };
    const testDeviceId = 'testDeviceId';
    const testModuleId = 'testModuleId';
    const testManagedBy = 'testManagedBy';

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.modules.createOrUpdateIdentity = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.createModuleWithCertificateAuthority(testDeviceId, testModuleId, testManagedBy);
    assert.isTrue(testClient._pl.modules.createOrUpdateIdentity.calledWith(
        testDeviceId,
        testModuleId,
        sinon.match.has('deviceId', testDeviceId)
        .and(sinon.match.has('moduleId', testModuleId))
        .and(sinon.match.has('managedBy', testManagedBy))
        .and(sinon.match.has('authentication'))
        .and(sinon.match.hasNested('authentication.type', 'certificateAuthority'))
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('updateModule calls the createOrUpdateIdentity method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
      };
    const testDeviceId = 'testDeviceId';
    const testModuleId = 'testModuleId';
    const testModule = 'testModule';
    const testIfMatch = {
      ifMatch: '*'
    }

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.modules.createOrUpdateIdentity = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.updateModule(testDeviceId, testModuleId, testModule);
    assert.isTrue(testClient._pl.modules.createOrUpdateIdentity.calledWith(
        testDeviceId,
        testModuleId,
        testModule,
        testIfMatch
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('getModule calls the getIdentity method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
      };
    const testDeviceId = 'testDeviceId';
    const testModuleId = 'testModuleId';

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.modules.getIdentity = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.getModule(testDeviceId, testModuleId);
    assert.isTrue(testClient._pl.modules.getIdentity.calledWith(
        testDeviceId,
        testModuleId
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('getModules calls the getModulesOnDevice method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
    };
    const testDeviceId = 'testDeviceId';

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.modules.getModulesOnDevice = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.getModules(testDeviceId);
    assert.isTrue(testClient._pl.modules.getModulesOnDevice.calledWith(
        testDeviceId
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('deleteModule calls the deleteIdentity method on the PL client', async function () {
    const testDeviceId = 'testDeviceId';
    const testModuleId = 'testModuleId';
    const testETag = 'testETag';

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.modules.deleteIdentity = sinon.stub().resolves();
    await testClient.deleteModule(testDeviceId, testModuleId, testETag);
    assert.isTrue(testClient._pl.modules.deleteIdentity.calledWith(
        testDeviceId,
        testModuleId,
        sinon.match.has('ifMatch', testETag)
    ));
  });

  it('getServiceStatistics calls the getServiceStatistics method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
    };

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.statistics.getServiceStatistics = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.getServiceStatistics();
    assert.isTrue(testClient._pl.statistics.getServiceStatistics.calledWith());
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('getDeviceRegistryStatistics calls the getDeviceStatistics method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
    };

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.statistics.getDeviceStatistics = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.getDeviceRegistryStatistics();
    assert.isTrue(testClient._pl.statistics.getDeviceStatistics.calledWith());
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('getDevices calls the getDevices method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
    };
    const testMaxNumberOfDevices = 42;

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.devices.getDevices = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.getDevices(testMaxNumberOfDevices);
    assert.isTrue(testClient._pl.devices.getDevices.calledWith(
        sinon.match.has('top', testMaxNumberOfDevices)
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('bulkCreateOrUpdateDevices calls the updateRegistry method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
    };
    const testDevices = ['testDevice1', 'testDevice2'];

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.bulkRegistry.updateRegistry = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.bulkCreateOrUpdateDevices(testDevices);
    assert.isTrue(testClient._pl.bulkRegistry.updateRegistry.calledWith(
        testDevices
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('queryIoTHub calls the getTwins method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
    };
    const testQuerySpecification = 'testQuerySpecification';

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.query.getTwins = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.queryIoTHub(testQuerySpecification);
    assert.isTrue(testClient._pl.query.getTwins.calledWith(
        testQuerySpecification
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('getTwin calls the getTwin method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
    };
    const testDeviceId = 'testDeviceId';

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.devices.getTwin = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.getTwin(testDeviceId);
    assert.isTrue(testClient._pl.devices.getTwin.calledWith(
        testDeviceId
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('replaceTwin calls the replaceTwin method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
    };
    const testDeviceId = 'testDeviceId';
    const testDeviceTwin = 'testDeviceTwin';

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.devices.replaceTwin = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.replaceTwin(testDeviceId, testDeviceTwin);
    assert.isTrue(testClient._pl.devices.replaceTwin.calledWith(
        testDeviceId,
        testDeviceTwin
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('updateTwin calls the updateTwin method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
    };
    const testDeviceId = 'testDeviceId';
    const testDeviceTwin = 'testDeviceTwin';
    const testETag = 'testETag';

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.devices.updateTwin = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.updateTwin(testDeviceId, testDeviceTwin, testETag);
    assert.isTrue(testClient._pl.devices.updateTwin.calledWith(
        testDeviceId,
        testDeviceTwin,
        sinon.match.has('ifMatch', testETag)
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('getModuleTwin calls the getTwin method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
    };
    const testDeviceId = 'testDeviceId';
    const testModuleId = 'testModuleId';

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.modules.getTwin = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.getModuleTwin(testDeviceId, testModuleId);
    assert.isTrue(testClient._pl.modules.getTwin.calledWith(
        testDeviceId,
        testModuleId
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('replaceModuleTwin calls the replaceTwin method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
    };
    const testDeviceId = 'testDeviceId';
    const testModuleId = 'testModuleId';
    const testDeviceTwin = 'testDeviceTwin';

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.modules.replaceTwin = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.replaceModuleTwin(testDeviceId, testModuleId, testDeviceTwin);
    assert.isTrue(testClient._pl.modules.replaceTwin.calledWith(
        testDeviceId,
        testModuleId,
        testDeviceTwin
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('updateModuleTwin calls the updateTwin method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
    };
    const testDeviceId = 'testDeviceId';
    const testModuleId = 'testModuleId';
    const testModuleTwin = 'testModuleTwin';
    const testETag = 'testETag';

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.modules.updateTwin = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.updateModuleTwin(testDeviceId, testModuleId, testModuleTwin, testETag);
    assert.isTrue(testClient._pl.modules.updateTwin.calledWith(
        testDeviceId,
        testModuleId,
        testModuleTwin,
        sinon.match.has('ifMatch', testETag)
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('invokeDeviceMethod calls the invokeMethod method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
    };
    const testDeviceId = 'testDeviceId';
    const testDirectMethodRequest = 'testDirectMethodRequest';

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.devices.invokeMethod = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.invokeDeviceMethod(testDeviceId, testDirectMethodRequest);
    assert.isTrue(testClient._pl.devices.invokeMethod.calledWith(
        testDeviceId,
        testDirectMethodRequest
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });

  it('invokeDeviceModuleMethod calls the invokeMethod method on the PL client', async function () {
    const returnValue = {
        interfaces: {
          testInterfaceInstanceName: {}
        }
    };
    const testDeviceId = 'testDeviceId';
    const testModuleId = 'testModuleId';
    const testDirectMethodRequest = 'testDirectMethodRequest';

    const testClient = new IoTHubRegistryManager(testCredentials);
    testClient._pl.modules.invokeMethod = sinon.stub().resolves(returnValue);
    const returnedPromise = await testClient.invokeDeviceModuleMethod(testDeviceId, testModuleId, testDirectMethodRequest);
    assert.isTrue(testClient._pl.modules.invokeMethod.calledWith(
        testDeviceId,
        testModuleId,
        testDirectMethodRequest
    ));
    assert.deepEqual(returnedPromise.interfaces, returnValue.interfaces);
  });
});
