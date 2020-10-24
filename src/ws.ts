import { UniqueIds } from './unique_ids';
import { JSONType } from './json_type';

/** A message sending and receiving WebSocket interface. */
export class WS {
	constructor(url: string) {
		// Create the web socket.
		this.webSocket = new WebSocket('wss://' + url);

		// Setup the promise that resolves when the web socket is ready to be used.
		this.readyPromise = new Promise((resolve: () => void, reject: (error: ErrorEvent) => void) => {
			this.webSocket.onopen = resolve;
			this.webSocket.onerror = reject;
		});

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
				if (typeof id !== 'number') {
					throw new Error('Response.id must be a number.');
				}

				// Get the function to be resolved using the response id.
				const promiseFunctions = this.activeSends.get(id);
				if (promiseFunctions === undefined) {
					throw new Error('No active send waiting for response.');
				}

				// Get the data of the response.
				const data = response.data;
				if (typeof data !== 'object' || data === null || Array.isArray(data)) {
					throw new Error('Response.data must be an object.');
				}

				// If the response was not a success, call reject the promise function.
				if (typeof data.success !== 'boolean') {
					throw new Error('Response.data.success must be a boolean.');
				}
				if (data.success === false) {
					if (typeof data.error !== 'string') {
						throw new Error('Response.data.error must be a string when response.data.success is false.');
					}
					promiseFunctions.reject(new Error(data.error));
				}

				// Remove the id from the actively sending message list and release the id.
				this.activeSends.delete(id);
				this.uniqueIds.release(id);

				// Call the resolve function without the success and error properties.
				delete data.success;
				delete data.error;
				promiseFunctions.resolve(data);
			}
			catch (error) {
				console.log('Error while receiving websocket message.');
				console.log('  Message: ' + message.data);
				console.log('  Error: ' + error);
			}
		};
		this.webSocket.onerror = (event: ErrorEvent): void => {
			console.log(event);
			console.log(`Error in websocket: ${event.message}`);
		};
		this.webSocket.onclose = (event: CloseEvent): void => {
			console.log(event);
		};
		window.addEventListener('beforeunload', () => {
			this.webSocket.close();
		});
	}

	/** Gets the promise that resolves when the web socket is ready to be used. */
	getReadyPromise(): Promise<void> {
		return this.readyPromise;
	}

	/** Closes the web socket connection. */
	close(): void {
		this.webSocket.close();
	}

	/** Sends the JSON data along the web socket. Returns a promise resolving with response JSON data. */
	send(data: JSONType): Promise<{ [prop: string]: (JSONType | undefined) }> {
		if (this.webSocket.readyState !== WebSocket.OPEN) {
			throw new Error('The web socket is not yet connected.');
		}
		console.log('ws.send ' + JSON.stringify(data));
		return new Promise<{ [prop: string]: (JSONType | undefined) }>((resolve, reject) => {
			const id = this.uniqueIds.get();
			this.activeSends.set(id, { resolve, reject });
			this.webSocket.send(JSON.stringify({
				id: id,
				data: data
			}));
		});
	}

	/** The WebSocket connection. */
	private webSocket: WebSocket;

	/** A promise that resolves when the WebSocket connection is open. */
	private readyPromise: Promise<void>;

	/** A collection of unique ids for pairing received messages with sent messages. */
	private uniqueIds: UniqueIds = new UniqueIds();

	/** The list of active sent messages awaiting a received message. */
	private activeSends: Map<number, PromiseFunctions> = new Map();
}

export namespace WS {
	export interface ResponseData {
		id: number;
		data: {
			success: boolean;
			error: string | undefined;
			data: JSONType | undefined;
		}
	}
}

export class PromiseFunctions {
	resolve: (data: { [prop: string]: (JSONType | undefined) }) => void = () => {};
	reject: (error: Error) => void = () => {}
}
