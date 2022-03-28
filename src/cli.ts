#!/usr/bin/env node

import { execute } from '.';

for (const arg of process.argv.slice(2)) {
	execute(arg);
}
