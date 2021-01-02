import { Component } from './component';
import { Router } from './router';

/** A very simple scaffolding for apps. */
export class App extends Component {
	/** Sets the subclass of App to be instantiated. It should be called in the main script,
	 * outside of any function. */
	static setAppClass(): void {
		App.appClass = this;
	}

	/** Creates the app. */
	static createApp(): void {
		// Create the app object.
		const app = new App.appClass();
		// Create the child components now that the app has been constructed, along with its variables.
		app.createChildComponents();
	}

	/**
	 * Constructs a app inside the body.
	 */
	constructor() {
		super(new Component.Params());

		// Append the roots to the document body.
		for (let i = 0; i < this.roots().length; i++) {
			document.body.appendChild(this.roots()[i]);
		}

		// Make the app global.
		window.app = this;
	}

	/** Destroys the app. */
	destroy(): void {
	}

	/** The router system. */
	public readonly router: Router = new Router();

	/** The subclass of App to be instantiated. */
	private static appClass: typeof App = App;
}

App.css = /*css*/`
	* {
		box-sizing: border-box;
	}

	.vertical-align {
		display: flex;
		justify-content: center;
		flex-direction: column;
	}

	.no-select {
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}
	`;

// Register the app class.
App.register();

// Typing to ensure TypeScript is happy with the app global.
declare global {
	interface Window {
		app: App | undefined;
	}
}

// Once the window 'load' event has been triggered, construct the app.
window.addEventListener('load', () => {
	try {
		App.createApp();
	}
	catch (error) {
		console.error(error);
	}
});

window.addEventListener('unload', () => {
	if (window.app !== undefined) {
		window.app.destroy();
	}
});
