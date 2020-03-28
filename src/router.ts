interface Query {
	[key: string]: string
}

type Callback = ((query: Query) => void);

/** A router that supports query strings, pushing, and replacing using the history API. */
export default class Router {
	/** The current query. */
	private query: Query = {};

	/** The callback to be called when the query changes. */
	private callbacks: Set<Callback> = new Set();

	constructor() {
		// Add an event listener so that it processes an event when the user uses the History API,
		// calling the callback.
		window.addEventListener('popstate', () => {
			this.processURL();
		});
	}

	/** Gets value of the given URL query key. */
	getValue(key: string) {
		return this.query[key];
	}

	/** Adds the callback for when the URL query params have changed. */
	addCallback(callback: Callback) {
		this.callbacks.add(callback);
	}

	/** Removes the callback for when the URL query params have changed. */
	removeCallback(callback: Callback) {
		this.callbacks.delete(callback);
	}

	/** Pushes a query to the history and process it, calling the callback. */
	pushQuery(query: Query) {
		// Copy over query.
		this.query = {};
		for (const key in query) {
			this.query[key] = query[key];
		}
		// Push the history.
		const queryString = this.createQueryString(query);
		history.pushState(undefined, '', '?' + queryString);
		// Call the callbacks.
		this.callCallbacks();
	}

	/** Replaces the query at the top of the history. Does not call the callback. */
	replaceQuery(query: Query) {
		// Copy over query.
		this.query = {};
		for (const key in query) {
			this.query[key] = query[key];
		}
		// Replace the history.
		const queryString = this.createQueryString(query);
		history.replaceState(undefined, '', '?' + queryString);
	}

	/** Processes the URL query params and calls the callback. */
	processURL() {
		const urlSearchParams = new URLSearchParams(location.search);
		this.query = {};
		for (const entry of urlSearchParams.entries()) {
			this.query[entry[0]] = entry[1];
		}
		this.callCallbacks();
	}

	/** Turns a query into a string suitable for a URL. */
	private createQueryString(query: Query) {
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
	private callCallbacks() {
		for (const callback of this.callbacks) {
			callback(this.query);
		}
	}
}
