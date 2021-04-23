export class RandomString {
	/** Generates a random string of the given length. */
	static generate(length: number): string {
		// Get a random byte buffer.
		const bytes = new Uint8Array(Math.ceil(length / 2));
		crypto.getRandomValues(bytes);
		// Convert to a hex string.
		return Array.from(bytes, (byte) => {
			return ('0' + (byte & 0xFF).toString(16)).slice(-2);
		}).join('').slice(0, length);
	}
}
