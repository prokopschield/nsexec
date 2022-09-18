import fs from 'fs';

import nsblob from './nsblob';

export async function store(file: string) {
	const data = await fs.promises.readFile(file);

	return nsblob.store(data);
}

export async function execute(hash: string) {
	const data = await nsblob.fetch(hash);

	Function(String(data))();
}
