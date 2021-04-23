import { Component } from '../component';

export class ElmCheckbox extends Component {
	constructor(params: Component.Params) {
		super(params);

		// Make sure it has an id.
		const name = params.attributes.get('name');
		if (name === undefined || name === '') {
			throw new Error('All inputs must have a name attribute.');
		}

		const checked = params.attributes.get('checked');
		if (checked !== undefined) {
			this.root.children[0].setAttribute('checked', '');
		}

		// Register the events.
		this.registerEvent('toggle', params);

		// Get the parts.
		const input = this.root.children[0];
		const label = this.root.children[1];

		// Setup the id-for connection.
		input.id = `${name}-input`;
		input.setAttribute('name', `${name}`);
		label.setAttribute('for', `${name}-input`);

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

ElmCheckbox.html = /* html */`
	<span>
		<input type="checkbox" />
		<label class="no-select" tabindex=0 onclick="_toggle"></label>
	</span>
`;

ElmCheckbox.register();
