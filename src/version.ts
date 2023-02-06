/*! Copyright (c) Microsoft. All rights reserved.
 *! Licensed under the MIT license. See LICENSE file in the project root for full license information.
 */

 'use strict';

 export const apiVersion = '2018-10-20-preview';

 export function versionQueryString(): string {
  return '?api-version=' + apiVersion;
}
