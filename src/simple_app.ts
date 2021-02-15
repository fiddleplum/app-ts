import { App } from './app';
import { ShowHide } from './show_hide';
import { Component } from './component';
import { Router } from './router';

export abstract class SimpleApp extends App {
	/** Constructs the simple app. */
	constructor() {
		super();

		// Setup the router callback.
		this._router.addCallback(this._processQuery.bind(this));
	}

	/** Gets the router. */
	get router(): Router {
		return this._router;
	}

	/** Registers a component as a page. If pageName is an empty string, it's the default page. */
	registerPage(pageName: string, PageClass: typeof SimpleApp.Page): void {
		this.pages.set(pageName, PageClass);
	}

	/** Shows a message to the user. */
	protected abstract showMessage(_messageHtml: string): void;

	/** Gets the page element. */
	protected abstract getPageElement(): HTMLElement;

	/** Processes a query, loading a page. */
	private async _processQuery(query: Router.Query): Promise<void> {
		const pageName = query.page !== undefined ? query.page : '';
		const Page = this.pages.get(pageName);
		if (Page === undefined) {
			this.showMessage('Page "' + pageName + '" not found.');
			return;
		}

		// If it's the same page, do nothing.
		if (this.page !== null && this.page.constructor === Page) {
			return;
		}

		// Clear any previous messages.
		this.showMessage('');

		// Hide and delete old page.
		const pageElement = this.getPageElement();
		await ShowHide.hide(pageElement);
		if (this.page !== null) {
			this.deleteComponent(this.page);
		}

		// Construct the params.
		const params = new Component.Params();
		params.attributes.set('app', this);

		// Create and show new page.
		this.page = this.insertComponent(Page, pageElement, null, params);
		await ShowHide.show(pageElement);
	}

	/** The router system. */
	private _router: Router = new Router();

	/** A mapping from page names to page components. */
	private pages: Map<string, typeof SimpleApp.Page> = new Map();

	/** The current page. */
	private page: SimpleApp.Page | null = null;
}

SimpleApp.register();

SimpleApp.setAppClass();

export namespace SimpleApp {
	export class Page extends Component {
		constructor(params: Component.Params) {
			super(params);

			const app = params.attributes.get('app');
			if (!(app instanceof SimpleApp)) {
				throw new Error('While constructing page ' + this.constructor.name + ', app is not a SimpleApp.');
			}
			this._app = app;
		}

		public get app(): SimpleApp {
			return this._app;
		}

		// The parent app.
		private _app: SimpleApp;
	}
}
