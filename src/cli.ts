#!/usr/bin/env node

import { execute } from '.';
import nsblob from './nsblob';

Promise.all(process.argv.slice(2).map(execute)).then(() => {
	nsblob.socket.close();
});
