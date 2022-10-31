/*! Copyright (c) Microsoft. All rights reserved.
 *! Licensed under the MIT license. See LICENSE file in the project root for full license information.
 */

 'use strict';

 export const apiVersion = '2021-04-12';

 export function versionQueryString(): string {
  return '?api-version=' + apiVersion;
}
