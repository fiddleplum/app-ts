import Component from './component';

export default class Icon extends Component {
	/** The source. */
	private _src = '';

	constructor(params: Component.Params) {
		super(params);

		// Set the source from the attributes.
		if (params.attributes.has('src')) {
			this._src = params.attributes.get('src') as string;
			this.update();
		}
	}

	get src(): string {
		return this._src;
	}

	set src(src) {
		if (this._src !== src) {
			this._src = src;
			this.update();
		}
	}

	private update(): void {
		fetch(this._src).then(response => response.text()).then((text) => {
			// Parse the text into an svg element.
			const template = document.createElement('template');
			template.innerHTML = text.trim();
			if (template.content.children.length !== 1 || !(template.content.firstElementChild instanceof SVGElement)) {
				throw new Error('The source ' + this._src + ' is not a vald .svg file.');
			}
			const svg = template.content.firstElementChild;
			// Remove the old children.
			const rootElement = this.__element('root');
			while (rootElement.lastChild !== null) {
				rootElement.removeChild(rootElement.lastChild);
			}
			// Copy over or clear the viewbox.
			const viewBoxAttribute = svg.getAttribute('viewBox');
			if (viewBoxAttribute !== null) {
				rootElement.setAttribute('viewBox', viewBoxAttribute);
			}
			else {
				rootElement.removeAttribute('viewBox');
			}
			// Copy over the children.
			while (svg.firstChild !== null) {
				rootElement.appendChild(svg.firstChild);
			}
		});
	}
}

Icon.html = `
	<svg ref="root"></svg>
	`;

Icon.register();
