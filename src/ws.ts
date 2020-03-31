import UniqueIds from './unique_ids';

/** A message sending and receiving WebSocket interface. */
class WS {
	/** The WebSocket connection. */
	private webSocket: WebSocket;

	/** A promise that resolves when the WebSocket connection is open. */
	private readyPromise: Promise<void>;

	/** A collection of unique ids for pairing received messages with sent messages. */
	private uniqueIds: UniqueIds = new UniqueIds();

	/** The list of active sent messages awaiting a received message. */
	private activeSends: Map<number, PromiseFunctions> = new Map();

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

			// Get the json and the id.
			const json = JSON.parse(message.data);
			const id: number = json.id;

			// Get the function to be resolved using the id in the json.
			const promiseFunctions = this.activeSends.get(id);
			if (promiseFunctions === undefined) {
				return;
			}

			if (json.success === false) {
				promiseFunctions.reject(new Error(json.error));
			}

			// Remove the id from the actively sending message list and release the id.
			this.activeSends.delete(id);
			this.uniqueIds.release(id);

			// Call the resolve function.
			promiseFunctions.resolve(json.data);
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
	send(data: any): Promise<void> {
		// console.log('ws.send ' + JSON.stringify(data));
		return new Promise((resolve, reject) => {
			const id = this.uniqueIds.get();
			const json = {
				id: id,
				data: data
			};
			this.activeSends.set(id, { resolve, reject });
			this.webSocket.send(JSON.stringify(json));
		});
	}
}

namespace WS {
	export class ResponseData {
		id = 0;
		success = false;
		error = '';
		data: any;
	}
}

export class PromiseFunctions {
	resolve: (data: any) => void = () => {};
	reject: (error: Error) => void = () => {}
}

export default WS;
