/** A router that supports query strings, pushing, and replacing using the history API. */
export class Router {
	constructor() {
		// Get the current query.
		const urlSearchParams = new URLSearchParams(location.search);
		for (const entry of urlSearchParams.entries()) {
			this._query[entry[0]] = entry[1];
		}
		// Add an event listener so that it processes an event when the user uses the History API,
		// calling the callback.
		window.addEventListener('popstate', () => {
			this.processURL();
		});
	}

	/** Gets value of the given URL query key. */
	getValue(key: string): string | undefined {
		return this._query[key];
	}

	/** Adds the callback for when the URL query params have changed. */
	addCallback(callback: Router.Callback): void {
		this._callbacks.add(callback);
	}

	/** Removes the callback for when the URL query params have changed. */
	removeCallback(callback: Router.Callback): void {
		this._callbacks.delete(callback);
	}

	/** Pushes a query to the history and process it, calling the callback.
	 *  If merge is true, the query will be merged with the existing query. */
	pushQuery(query: Router.Query, merge?: boolean): void {
		if (merge === true) {
			this._query = { ...this._query, ...query };
		}
		else {
			this._query = JSON.parse(JSON.stringify(query));
		}
		const queryString = this.createQueryString(this._query);
		// Push the history.
		history.pushState(undefined, '', (queryString.length !== 0 ? '?' + queryString : './'));
		// Call the callbacks.
		this.callCallbacks();
	}

	/** Replaces the query at the top of the history. Does not call the callback.
	 *  If merge is true, the query will be merged with the existing query. */
	replaceQuery(query: Router.Query, merge?: boolean): void {
		if (merge === true) {
			this._query = { ...this._query, ...query };
		}
		else {
			this._query = JSON.parse(JSON.stringify(query));
		}
		const queryString = this.createQueryString(this._query);
		// Replace the history.
		history.replaceState(undefined, '', (queryString.length !== 0 ? '?' + queryString : './'));
	}

	/** Processes the URL query params and calls the callback. */
	processURL(): void {
		const urlSearchParams = new URLSearchParams(location.search);
		this._query = {};
		for (const entry of urlSearchParams.entries()) {
			this._query[entry[0]] = entry[1];
		}
		this.callCallbacks();
	}

	/** Turns a query into a string suitable for a URL. */
	private createQueryString(query: Router.Query): string {
		let queryString = '';
		for (const key in query) {
			if (query[key] === '') {
				continue;
			}
			if (queryString !== '') {
				queryString += '&';
			}
			queryString += encodeURIComponent(key) + '=' + encodeURIComponent(query[key]);
		}
		return queryString;
	}

	/** Calls all of the callbacks with the current query. */
	private callCallbacks(): void {
		for (const callback of this._callbacks) {
			callback(this._query);
		}
	}

	/** The current query. */
	private _query: Router.Query = {};

	/** The callback to be called when the query changes. */
	private _callbacks: Set<Router.Callback> = new Set();
}

export namespace Router {
	/** The query accepted by the router. */
	export interface Query {
		[key: string]: string;
	}

	/** The callback format when processing a query. */
	export type Callback = ((query: Query) => void);
}
