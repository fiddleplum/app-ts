import { UniqueIds } from './unique_ids';
import { JSONType } from './json_type';

/** A message sending and receiving WebSocket interface. */
export class WS {
	constructor(url: string) {
		// Create the web socket.
		this.webSocket = new WebSocket('ws:' + url);

		// Setup the promise that resolves when the web socket is ready to be used.
		this.readyPromise = new Promise((resolve: () => void, reject: (error: ErrorEvent) => void) => {
			this.webSocket.onopen = resolve;
			this.webSocket.onerror = reject;
		});

		// When a message is received...
		this.webSocket.onmessage = (message: MessageEvent): void => {
			// console.log('received ' + message.data);

			// Get the response data and the id.
			const responseData: WS.ResponseData = JSON.parse(message.data);
			const id = responseData.id;

			// Get the function to be resolved using the id in the json.
			const promiseFunctions = this.activeSends.get(id);
			if (promiseFunctions === undefined) {
				return;
			}

			// If the response was not a success, call reject the promise function.
			if (responseData.success === false) {
				promiseFunctions.reject(new Error(responseData.error));
			}

			// Remove the id from the actively sending message list and release the id.
			this.activeSends.delete(id);
			this.uniqueIds.release(id);

			// Call the resolve function.
			promiseFunctions.resolve(responseData.data);
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
	send<T>(json: JSONType): Promise<T> {
		// console.log('ws.send ' + JSON.stringify(json));
		return new Promise((resolve, reject) => {
			const id = this.uniqueIds.get();
			this.activeSends.set(id, { resolve, reject });
			this.webSocket.send(JSON.stringify({
				id: id,
				json: json
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
		success: boolean;
		error: string;
		data: any;
	}
}

export class PromiseFunctions {
	resolve: (data: any) => void = () => {};
	reject: (error: Error) => void = () => {}
}
