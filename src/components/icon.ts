import { Component } from '../component';

export class Icon extends Component {
	/** The source. */
	private _src = '';

	constructor(params: Component.Params) {
		super(params);

		// Set the source from the attributes.
		const alt = params.attributes.get('alt');
		if (alt === undefined) {
			throw new Error(`${this} ${this.id}: All icons must have alt attribute. It can be empty if the image is decorational.`);
		}
		this.root.setAttribute('alt', alt);

		// Set the source from the attributes.
		const srcValue = params.attributes.get('src');
		if (srcValue !== undefined) {
			this._src = srcValue;
			this.update();
		}
	}

	get src(): string {
		return this._src;
	}

	set src(src: string) {
		if (this._src !== src) {
			this._src = src;
			this.update();
		}
	}

	private update(): void {
		if (this._src === '') {
			return;
		}
		fetch(this._src).then((response) => {
			if (200 <= response.status && response.status <= 299) {
				return response.text();
			}
			else {
				throw new Error(`The source ${this._src} returned ${response.status}: ${response.statusText}`);
			}
		}).then((text) => {
			// Parse the text into an svg element.
			const template = document.createElement('template');
			template.innerHTML = text.trim();
			if (template.content.children.length !== 1 || !(template.content.firstElementChild instanceof SVGElement)) {
				throw new Error(`The source ${this._src} is not a valid .svg file.`);
			}
			const svg = template.content.firstElementChild;
			// Remove the old children.
			const svgElement = this.root as SVGElement;
			while (svgElement.lastChild !== null) {
				svgElement.removeChild(svgElement.lastChild);
			}
			// Copy over or clear the viewbox.
			const viewBoxAttribute = svg.getAttribute('viewBox');
			if (viewBoxAttribute !== null) {
				svgElement.setAttribute('viewBox', viewBoxAttribute);
			}
			else {
				svgElement.removeAttribute('viewBox');
			}
			// Copy over the fill if it is transparent.
			const fillAttribute = svg.getAttribute('fill');
			if (fillAttribute === 'none') {
				svgElement.style.fill = fillAttribute;
			}
			// Copy over the children.
			while (svg.firstChild !== null) {
				svgElement.appendChild(svg.firstChild);
			}
		});
	}
}

Icon.html = /* html */`
	<svg></svg>
	`;

Icon.css = /* css */`
	.Icon {
		/* Make sure it never becomes the target of a mouse event. This can happen if a button surrounds
		   it and the user clicks part of the actual SVG lines. */
		pointer-events: none;
	}`;

Icon.register();
