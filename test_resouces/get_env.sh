# Copyright (c) Microsoft. All rights reserved.
# Licensed under the MIT license. See LICENSE file in the project root for
# full license information.

export IOTHUB_CA_ROOT_CERT=$(az keyvault secret show --query '{value:value}' --output tsv --vault-name $1 --name IOTHUB-CA-ROOT-CERT)
export IOTHUB_CA_ROOT_CERT_KEY=$(az keyvault secret show --query '{value:value}' --output tsv --vault-name $1 --name IOTHUB-CA-ROOT-CERT-KEY)
export IOTHUB_CONNECTION_STRING=$(az keyvault secret show --query '{value:value}' --output tsv --vault-name $1 --name IOTHUB-CONNECTION-STRING)
export STORAGE_CONNECTION_STRING=$(az keyvault secret show --query '{value:value}' --output tsv  --vault-name $1 --name STORAGE-CONNECTION-STRING)
export IOTHUB_CONN_STRING_INVALID_CERT=$(az keyvault secret show --query '{value:value}' --output tsv  --vault-name $1 --name IOTHUB-CONN-STRING-INVALID-CERT)
export IOTHUB_DEVICE_CONN_STRING_INVALID_CERT=$(az keyvault secret show --query '{value:value}' --output tsv  --vault-name $1 --name IOTHUB-DEVICE-CONN-STRING-INVALID-CERT)