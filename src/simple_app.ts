import App from './app';
import ShowHide from './show_hide';
import Component from './component';
import Router from './router';

class SimpleApp extends App {
	/** A mapping from page names to page components. */
	private pages: Map<string, typeof SimpleApp.Page> = new Map();

	/** The current page. */
	private page: SimpleApp.Page | null = null;

	constructor() {
		super();

		// Setup the router callback.
		this.router.addCallback(this._processQuery.bind(this));
	}

	/** Sets the title HTML. */
	title(html: string): void {
		const titleElem = this.__element('title');
		titleElem.innerHTML = html;
	}

	/** Sets the nav HTML. It can include component references. */
	nav(context: Component, html: string): void {
		const elem = this.__element('nav');
		this.__setHtml(elem, context, html);
	}

	/** Sets the message HTML. */
	message(message: string): void {
		const messageElem = this.__element('message');
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
			this.message('Page "' + pageName + '" not found.');
			history.back();
			return;
		}

		// If it's the same page, do nothing.
		if (this.page !== null && this.page.constructor === Page) {
			return;
		}

		// Clear any previous messages.
		this.message('');

		// Hide and delete old page.
		const pageElement = this.__element('page');
		await ShowHide.hide(pageElement);
		if (this.page !== null) {
			this.__deleteComponent(this.page);
		}
		// Construct the params.
		const params = new Component.Params();
		params.attributes.set('app', this);

		// Create and show new page.
		this.page = this.__insertComponent(Page, pageElement, null, params);
		await ShowHide.show(pageElement);
	}

	/** Goes to the home page. */
	private _goToHome(): void {
		this.router.pushQuery({});
	}
}

SimpleApp.html = /*html*/`
	<div>
		<div class="title"><a ref="title" onclick="{{_goToHome}}"></a><span ref="nav"></span></div>
		<div ref="message" class="message"></div>
		<div ref="page" class="page"></div>
	</div>
	`;

SimpleApp.css = /*css*/`
	body {
		margin: 0;
		width: 100%;
		min-height: 100vh;
	}
	.SimpleApp {
		width: 100%;
	}
	.SimpleApp .title {
		padding: 0.5rem;
		font-size: 1.5rem;
		line-height: 1.5rem;
	}
	.SimpleApp .title a {
		color: inherit;
		text-decoration: none;
		cursor: pointer;
	}
	.SimpleApp .title a:hover {
		text-decoration: underline;
	}
	.SimpleApp [ref="nav"] {
		float: right;
		text-align: right;
	}
	.SimpleApp .message {
		line-height: 1rem;
		margin: 0 .5rem;
		height: 0;
		opacity: 0;
		transition: opacity .5s, height .5s, margin .5s;
	}
	.SimpleApp .message.active {
		height: 1rem;
		opacity: 100%;
		margin: .5rem;
	}
	.SimpleApp .message a {
		color: inherit;
		text-decoration: none;
	}
	.SimpleApp .page {
		position: relative;
		width: calc(100% - 1rem);
		max-width: 50rem;
		margin: .5rem auto .5rem auto;
	}
	.SimpleApp .page.fadeOut {
		opacity: 0;
		transition: opacity .125s;
	}
	.SimpleApp .page.fadeIn {
		opacity: 1;
		transition: opacity .125s;
	}
	`;

SimpleApp.register();

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
