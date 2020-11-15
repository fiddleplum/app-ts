export class Cookies {
	/** Gets a cookie.
	 * @param name - The name of the cookie. */
	static get(name: string): string | undefined {
		const cookieEntries = document.cookie.split(';');
		const cookieEntry = cookieEntries.find(cookie => cookie.trim().startsWith(name + '='));
		if (cookieEntry !== undefined) {
			return decodeURIComponent(cookieEntry.split('=')[1]);
		}
		return undefined;
	}

	/** Sets a cookie.
	 * @param name - The name of the cookie.
	 * @param content - The content of the cookie.
	 * @param maxAge - The lifetime in seconds of the cookie. */
	static set(name: string, content: string, maxAge: number): void {
		document.cookie = `${name}=${encodeURIComponent(content)};max-age=${maxAge};path=/;secure`;
	}
}
