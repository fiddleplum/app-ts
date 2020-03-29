import App from './app';
import ShowHide from './show_hide';
import Component from './component';
import Router from './router';

class SimpleApp extends App {
	/** A mapping from page names to page components. */
	private pages: Map<String, typeof SimpleApp.Page> = new Map();

	/** The current page. */
	private page: SimpleApp.Page | null = null;

	constructor() {
		super();

		// Setup the router callback.
		this.router.addCallback(this._processQuery.bind(this));
	}

	/** Sets the title HTML. */
	set title(title: string) {
		const titleElem = this.__element('title');
		if (titleElem !== null) {
			titleElem.innerHTML = title;
		}
	}

	/** Sets the message HTML. */
	set message(message: string) {
		console.log(message);
		const messageElem = this.__element('message');
		if (messageElem !== null) {
			messageElem.innerHTML = message;
		}
	}

	/** Registers a component as a page. */
	registerPage(pageName: string, PageClass: typeof SimpleApp.Page) {
		this.pages.set(pageName, PageClass);
	}

	/**
	 * Processes a query, loading a page.
	 * @param {Object<string, string>} query
	 * @private
	 */
	async _processQuery(query: Router.Query) {
		const pageName = query.page || '';
		const Page = this.pages.get(pageName);
		if (Page === undefined) {
			this.message = 'Page "' + pageName + '" not found. Return to <a href=".">home</a>.';
			return;
		}
		// If it's the same page, do nothing.
		if (this.page !== null && this.page.constructor === Page) {
			return;
		}
		// Hide and delete old page.
		const pageElement = this.__element('page');
		if (pageElement instanceof HTMLElement) {
			await ShowHide.hide(pageElement);
		}
		if (this.page !== null) {
			this.__deleteComponent(this.page);
		}
		// Create and show new page.
		if (pageElement instanceof HTMLElement) {
			this.page = this.__insertComponent(Page, pageElement, null, new Component.Params());
			await ShowHide.show(pageElement);
		}
	}
}

SimpleApp.html = `
	<div class="title"><a ref="title" href="."></a></div>
	<div ref="message" class="message"></div>
	<div ref="page" class="page"></div>
	`;

SimpleApp.css = `
	body {
		margin: 0;
		width: 100%;
		min-height: 100vh;
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 2rem 1fr;
		grid-template-areas:
			"title message"
			"page page";
	}
	.SimpleApp.title {
		grid-area: title;
		padding: 0.25rem;
		font-size: 1.5rem;
		line-height: 1.5rem;
	}
	.SimpleApp.title a {
		color: inherit;
		text-decoration: none;
	}
	.SimpleApp#title a:hover {
		text-decoration: underline;
	}
	.SimpleApp.message {
		grid-area: message;
		text-align: right;
		line-height: 1rem;
		padding: .5rem;
	}
	.SimpleApp.message a {
		color: inherit;
		text-decoration: none;
	}
	.SimpleApp.message a:hover {
		text-decoration: underline;
	}
	.SimpleApp.page {
		position: relative;
		grid-area: page;
		width: calc(100% - 2rem);
		max-width: 50rem;
		margin: 1rem auto 0 auto;
	}
	.SimpleApp.page.fadeOut {
		opacity: 0;
		transition: opacity .125s;
	}
	.SimpleApp.page.fadeIn {
		opacity: 1;
		transition: opacity .125s;
	}
	`;

App.setAppClass(SimpleApp);

namespace SimpleApp {
	export class Page extends Component {
		public readonly app: SimpleApp;
	
		constructor(params: Component.Params) {
			super(params);
	
			const app = params.attributes.get('app');
			if (!(app instanceof SimpleApp)) {
				throw new Error('While constructing page ' + this.constructor.name + ', app is not a SimpleApp.');
			}
			this.app = app;
		}
	}
}

export default SimpleApp;
