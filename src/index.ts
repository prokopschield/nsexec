import nsblob from 'nsblob';

export function store(file: string) {
	return nsblob.store_file(file);
}

export async function execute(hash: string) {
	const data = await nsblob.fetch(hash);
	Function(String(data))();
}
