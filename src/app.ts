import Component from './component';
import Router from './router';

/** A very simple scaffolding for apps. */
export default class App extends Component {
	/** The router system. */
	public readonly router: Router = new Router();

	/** The subclass of App to be instantiated. */
	private static appClass: typeof App = App;

	/** Sets the subclass of App to be instantiated. It should be called in the main script,
	 * outside of any function. */
	static setAppClass(appClass: typeof App): void {
		App.appClass = appClass;
	}

	/** Creates the app. */
	static createApp(): void {
		const app = new App.appClass();
		app.__connectRootNodes(document.body, null);
	}

	/**
	 * Constructs a component inside the body.
	 */
	constructor() {
		super(new Component.Params());

		// Make this global.
		window.app = this;
	}
}

App.css = `
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

App.register();

declare global {
	interface Window {
		app: App;
	}
}

window.addEventListener('load', () => {
	try {
		App.createApp();
	}
	catch (error) {
		console.error(error);
	}
});
