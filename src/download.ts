import { JSONType } from './json_type';

export async function download(url: string, type: 'text'): Promise<string>;
export async function download(url: string, type: 'json'): Promise<JSONType>;
export async function download(url: string, type: 'bytes'): Promise<Uint8Array>;
export async function download(url: string, type: 'float32s'): Promise<Float32Array>;
export async function download(url: string, type: 'text' | 'json' | 'bytes' | 'float32s'): Promise<string | JSONType | Uint8Array | Float32Array> {
	const response = await fetch(url);
	if (type === 'text') {
		return await response.text();
	}
	else if (type === 'json') {
		return await response.json();
	}
	else if (type === 'bytes') {
		return new Uint8Array(await response.arrayBuffer());
	}
	else {
		return new Float32Array(await response.arrayBuffer());
	}
}
