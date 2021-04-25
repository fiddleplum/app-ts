import { Component } from '../component';
import { RandomString } from '../random_string';

export class ElmCheckbox extends Component {
	constructor(params: Component.Params) {
		super(params);

		// Get the name attribute.
		const name = params.attributes.get('name');
		if (name === undefined || name === '') {
			throw new Error('All inputs must have a name attribute.');
		}

		// Get the checked attribute.
		const checked = params.attributes.get('checked');
		if (checked !== undefined) {
			this.root.children[0].setAttribute('checked', '');
		}

		// Register the events.
		this.registerEvent('toggle', params);

		// Get the parts.
		const input = this.root.children[0] as HTMLInputElement;
		const label = this.root.children[1] as HTMLLabelElement;

		// Setup the id-for connection.
		const id = RandomString.generate(16);
		input.id = id;
		input.name = name;
		label.htmlFor = id;

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
