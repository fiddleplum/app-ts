import { Component } from '../component';

export class ElmCheckbox extends Component {
	constructor(params: Component.Params) {
		super(params);

		// Get the parts.
		const label = this.root as HTMLLabelElement;
		const input = this.query('input', HTMLInputElement)!;

		// Get the name attribute.
		const name = params.attributes.get('name');
		if (name === undefined || name === '') {
			throw new Error('All inputs must have a name attribute.');
		}

		// Get the checked attribute.
		const checked = params.attributes.get('checked');
		if (checked !== undefined && checked !== 'false') {
			input.setAttribute('checked', '');
		}

		// Register the events.
		this.registerEvent('toggle', params);

		// Set the name.
		input.name = name;

		// Add the children to the button.
		for (const child of params.children) {
			this.insertNode(child, label, undefined, params.parent);
		}
	}

	/** The event that calls the handler. */
	private _toggle(): void {
		const input = this.root.children[0] as HTMLInputElement;
		this.triggerEvent('toggle', input.value);
	}
}

ElmCheckbox.html = /* html */`
	<label class="no-select" tabindex=0 onclick="_toggle">
		<input type="checkbox" />
	</label>
`;

ElmCheckbox.register();
