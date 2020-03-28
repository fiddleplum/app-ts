import App from './app';
import ShowHide from './show_hide';
/** @typedef {import('./component').default} Component */

export default class SimpleApp extends App {
	constructor() {
		super();

		/**
		 * A mapping from page names to page components.
		 * @type {Map<string, new (app:SimpleApp) => Component>}
		 * @private
		 */
		this._pages = new Map();

		/**
		 * The current page.
		 * @type {Component}
		 * @private
		 */
		this._page = null;

		// Setup the router callback.
		this.router.addCallback(this._processQuery.bind(this));
	}

	/**
	 * Sets the title HTML.
	 * @param {string} title
	 */
	set title(title) {
		this.__element('title').innerHTML = title;
	}

	/**
	 * Sets the message HTML.
	 * @param {string} message
	 */
	set message(message) {
		console.log(message);
		this.__element('message').innerHTML = message;
	}

	/**
	 * Registers a component as a page.
	 * @param {string} pageName
	 * @param {new (app:SimpleApp) => Component} PageClass
	 */
	registerPage(pageName, PageClass) {
		this._pages.set(pageName, PageClass);
	}

	/**
	 * Processes a query, loading a page.
	 * @param {Object<string, string>} query
	 * @private
	 */
	async _processQuery(query) {
		const pageName = query.page || '';
		const Page = this._pages.get(pageName);
		if (Page === undefined) {
			this.message = 'Page "' + pageName + '" not found. Return to <a href=".">home</a>.';
			return;
		}
		// If it's the same page, do nothing.
		if (this._page instanceof Page) {
			return;
		}
		const pageElement = this.__element('page');
		if (pageElement instanceof HTMLElement) {
			await ShowHide.hide(pageElement);
			this.__deleteComponent(this._page);
		}
		this._page = this.__insertComponent(pageElement, null, Page, this);
		if (pageElement instanceof HTMLElement) {
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
