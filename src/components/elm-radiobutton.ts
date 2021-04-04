import { Component } from '../component';

export class ElmRadioButton extends Component {
	constructor(params: Component.Params) {
		super(params);

		// Make sure it has an id.
		if (this.id === '') {
			throw new Error(`All inputs must have ids.`);
		}

		// Get the label width.
		const labelWidth = params.attributes.get('name');
		if (labelWidth === undefined) {
			throw new Error('LabelWidth attribute is required in ElmForm.');
		}

		// Register the events.
		this.registerEvent('toggle', params);

		// Get the parts.
		const input = this.root.children[0];
		const label = this.root.children[1];

		// Setup the id-for connection.
		input.id = `${this.id}-input`;
		label.setAttribute('for', `${this.id}-input`);

		// Add the children to the button.
		for (const child of params.children) {
			label.appendChild(child);
		}
	}

	/** The event that calls the handler. */
	private _toggle(): void {
		const input = this.root.children[0] as HTMLInputElement;
		this.triggerEvent('toggle', input.value);
	}
}

ElmRadioButton.html = /* html */`
	<span>
		<input type="radio" />
		<label class="no-select" tabindex=0 onclick="_toggle"></label>
	</span>
`;

ElmRadioButton.register();
