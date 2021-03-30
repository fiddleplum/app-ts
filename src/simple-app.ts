import { App } from './app';
import { ShowHide } from './show-hide';
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

	/** Gets the page element. */
	protected abstract getPageElement(): HTMLElement;

	/** Callback when there's a new page. */
	protected abstract onNewPage(page: SimpleApp.Page): void;

	/** Processes a query, loading a page. */
	private async _processQuery(query: Router.Query): Promise<void> {
		const pageName = query.page !== undefined ? query.page : '';
		const Page = this.pages.get(pageName);
		// Invalid page, do nothing.
		if (Page === undefined) {
			return;
		}

		// If it's the same page, do nothing.
		if (this.page !== undefined && this.page.constructor === Page) {
			return;
		}

		// Hide and delete old page.
		const pageElement = this.getPageElement();
		await ShowHide.hide(pageElement);
		if (this.page !== undefined) {
			this.deleteComponent(this.page);
		}

		// Create and show new page.
		this.page = this.insertComponent(Page, pageElement, null, new Component.Params());
		await ShowHide.show(pageElement);

		// Call the new page callback.
		this.onNewPage(this.page);
	}

	/** The router system. */
	private _router: Router = new Router();

	/** A mapping from page names to page components. */
	private pages: Map<string, typeof SimpleApp.Page> = new Map();

	/** The current page. */
	private page: SimpleApp.Page | undefined = undefined;
}

SimpleApp.register();

SimpleApp.setAppClass();

export namespace SimpleApp {
	export class Page extends Component {
		constructor() {
			super(new Component.Params());
		}
	}
}
