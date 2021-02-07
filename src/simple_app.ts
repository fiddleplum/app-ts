import { App } from './app';
import { ShowHide } from './show_hide';
import { Component } from './component';
import { Router } from './router';
import { WS } from './ws';

export class SimpleApp extends App {
	/** Constructs the simple app. */
	constructor() {
		super();

		// Setup the router callback.
		this._router.addCallback(this._processQuery.bind(this));

		// Connect to the server.
		this._ws = new WS('localhost:8081');
	}

	/** Destructs the app. */
	destroy(): void {
		this._ws.close();
		super.destroy();
	}

	/** Gets the websocket. */
	get ws(): WS {
		return this._ws;
	/** Gets the router. */
	get router(): Router {
		return this._router;
	}

	/** Sets the title HTML. */
	setTitle(html: string): void {
		const titleElem = this.element('title', HTMLDivElement).querySelector('a')!;
		titleElem.innerHTML = html;
	}

	/** Sets the nav HTML. It can include component references. */
	setNav(html: string): void {
		const elem = this.element('nav', HTMLDivElement);
		this.setHtml(elem, html);
	}

	/** Sets the message HTML. */
	setMessage(message: string): void {
		const messageElem = this.element('message', HTMLDivElement);
		if (message !== '') {
			console.log(message);
			messageElem.innerHTML = message;
			messageElem.classList.add('active');
		}
		else {
			messageElem.innerHTML = '';
			messageElem.classList.remove('active');
		}
	}

	/** Registers a component as a page. */
	registerPage(pageName: string, PageClass: typeof SimpleApp.Page): void {
		this.pages.set(pageName, PageClass);
	}

	/** Processes a query, loading a page. */
	private async _processQuery(query: Router.Query): Promise<void> {
		const pageName = query.page !== undefined ? query.page : '';
		const Page = this.pages.get(pageName);
		if (Page === undefined) {
			this.setMessage('Page "' + pageName + '" not found.');
			history.back();
			return;
		}

		// If it's the same page, do nothing.
		if (this.page !== null && this.page.constructor === Page) {
			return;
		}

		// Clear any previous messages.
		this.setMessage('');

		// Hide and delete old page.
		const pageElement = this.element('page', HTMLDivElement);
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

	/** Goes to the home page. */
	private _goToHome(): void {
		this._router.pushQuery({});
	}

	/** The websocket. */
	private _ws: WS;
	/** The router system. */
	private _router: Router = new Router();

	/** A mapping from page names to page components. */
	private pages: Map<string, typeof SimpleApp.Page> = new Map();

	/** The current page. */
	private page: SimpleApp.Page | null = null;
}

SimpleApp.html = /*html*/`
	<div id="title"><a onclick="{$_goToHome$}"></a></div>
	<div id="page"></div>
	<div id="message"></div>
	`;

SimpleApp.css = /*css*/`
	body {
		margin: 0;
		width: 100%;
		min-height: 100vh;
		display: grid;
		grid-template-rows: 3rem 1fr 3rem;
		grid-template-areas: "title" "page" "message";
	}
	.SimpleApp#title {
		grid-area: title;
		padding: 0.5rem;
	}
	.SimpleApp#title a {
		color: inherit;
		text-decoration: none;
		cursor: pointer;
	}
	.SimpleApp#title a:hover {
		text-decoration: underline;
	}
	.SimpleApp#message {
		grid-area: message;
		padding: 0 .5rem;
		background: var(--bg);
		height: 0;
		opacity: 0;
		transition: opacity .5s, height .5s, margin .5s;
		font-size: 1rem;
	}
	.SimpleApp#message.active {
		height: inherit;
		opacity: 100%;
		padding: .5rem;
	}
	.SimpleApp#message a {
		color: inherit;
		text-decoration: none;
	}
	.SimpleApp#page {
		grid-area: page;
		position: relative;
		max-width: 50rem;
		padding: .5rem;
	}
	.SimpleApp#page.fadeOut {
		opacity: 0;
		transition: opacity .125s;
	}
	.SimpleApp#page.fadeIn {
		opacity: 1;
		transition: opacity .125s;
	}
	`;

SimpleApp.register();

App.setAppClass();

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
