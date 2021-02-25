import { Component } from './component';

/** A very simple scaffolding for apps. */
export abstract class App extends Component {
	/** Sets the subclass of App to be instantiated. It should be called in the main script,
	 * outside of any function. */
	static setAppClass(): void {
		App.appClass = this as unknown as (new () => App);
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

		// Make the app global.
		window.app = this;
	}

	/** Destroys the app. */
	abstract destroy(): void;

	/** The subclass of App to be instantiated. */
	private static appClass: new () => App;
}

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
		console.log('Initializing app.');
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
