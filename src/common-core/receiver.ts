// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { EventEmitter } from 'events';
import { Message } from './message';

export interface Receiver extends EventEmitter {
    on(type: 'message', func: (msg: Message) => void): this;
    on(type: 'errorReceived', func: (err: Error) => void): this;
// eslint-disable-next-line @typescript-eslint/ban-types
    on(type: string, func: Function): this;
}

