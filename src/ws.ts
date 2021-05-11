import { UniqueIds, JSONType } from 'pine-lib';

/** A message sending and receiving WebSocket interface. */
export class WS {
	connect(url: string): Promise<void> {
		// Setup the promise that resolves when the web socket is ready to be used.
		return new Promise((resolve: () => void, reject: (error: Error) => void) => {
			// Create the web socket.
			this.webSocket = new WebSocket('wss://' + url);

			// When the websocket connects...
			this.webSocket.onopen = (): void => {
				console.log('Websocket connected.');
				resolve();
			};

			// When a message is received...
			this.webSocket.onmessage = (message: MessageEvent): void => {
				// Output the message received.
				console.log('ws.received ' + message.data);

				try {
					// Get the response.
					let response: JSONType;
					try {
						response = JSON.parse(message.data);
					}
					catch (error) {
						throw new Error('Response must be valid JSON. ' + error);
					}
					if (typeof response !== 'object' || response === null || Array.isArray(response)) {
						throw new Error('Response must be an object.');
					}

					// Get the id of the response.
					const id = response.id;
					if (id !== undefined) {
						if (typeof id !== 'number') {
							throw new Error('Response.id must be a number.');
						}

						// Get the function to be resolved using the response id.
						const promiseFunctions = this.activeSends.get(id);
						if (promiseFunctions === undefined) {
							throw new Error('No active send waiting for response.');
						}

						// Remove the id from the actively sending message list and release the id.
						this.activeSends.delete(id);
						this.uniqueIds.release(id);

						// If the response was not a success, call reject the promise function.
						const success = response.success;
						if (typeof success !== 'boolean') {
							throw new Error('Response.success must be a boolean.');
						}
						if (success === false) {
							const error = response.error;
							if (typeof error !== 'string') {
								throw new Error('Response.error must be a string when response.success is false.');
							}
							promiseFunctions.reject(new Error(error));
						}
						else {
							// Call the resolve function.
							promiseFunctions.resolve(response.data);
						}
					}
					// It doesn't have an id, so it must be a handler.
					else {
						const module = response.module;
						if (typeof module !== 'string') {
							throw new Error('Response.module must be a string.');
						}

						const handler = this.handlers.get(module);
						if (handler === undefined) {
							return;
						}
						handler(response.data);
					}
				}
				catch (error) {
					console.log('Error while receiving websocket message.');
					console.log('  Message: ' + message.data);
					console.log('  Error: ' + error);
				}
			};

			// When there is an error in the websocket...
			this.webSocket.onerror = (event: ErrorEvent): void => {
				console.log(`Error in websocket.`, event);
				reject(new Error(`Error in websocket: ${event.message}`));
			};

			// When the websocket disconnects...
			this.webSocket.onclose = (event: CloseEvent): void => {
				this.webSocket = undefined;
				console.log(event);
			};

			// Make sure to close the websocket before unloading the page.
			window.addEventListener('beforeunload', () => {
				if (this.webSocket !== undefined) {
					this.webSocket.close();
					this.webSocket = undefined;
				}
			});
		});
	}

	/** Closes the web socket connection. */
	close(): void {
		if (this.webSocket !== undefined) {
			this.webSocket.close();
			this.webSocket = undefined;
		}
	}

	/** Sends the JSON data along the web socket. Returns a promise resolving with response JSON data. */
	send(data: JSONType): Promise<JSONType | void> {
		if (this.webSocket === undefined || this.webSocket.readyState !== WebSocket.OPEN) {
			throw new Error('The web socket is not yet connected.');
		}
		console.log('ws.send ' + JSON.stringify(data));
		return new Promise<JSONType | void>((resolve, reject) => {
			const id = this.uniqueIds.get();
			this.activeSends.set(id, { resolve, reject });
			this.webSocket!.send(JSON.stringify({
				id: id,
				data: data
			}));
		});
	}

	/** Register a handler for receiving messages. */
	registerHandler(module: string, handler: (response: JSONType | undefined) => void): void {
		this.handlers.set(module, handler);
	}

	/** Unregister a handler for receiving messages. */
	unregisterHandler(module: string): void {
		this.handlers.delete(module);
	}

	/** The WebSocket connection. */
	private webSocket: WebSocket | undefined;

	/** A collection of unique ids for pairing received messages with sent messages. */
	private uniqueIds: UniqueIds = new UniqueIds();

	/** The list of active sent messages awaiting a received message. */
	private activeSends: Map<number, PromiseFunctions> = new Map();

	/** The handlers for received messages. */
	private handlers: Map<string, (response: JSONType | undefined) => void> = new Map();
}

export class PromiseFunctions {
	resolve: (data: JSONType | void) => void = () => {};
	reject: (error: Error) => void = () => {}
}
