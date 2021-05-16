import { Component } from '../component';

export class MultiSelect extends Component {
	constructor(params: Component.Params) {
		super(params);

		// Get the name attribute.
		const name = params.attributes.get('name');
		if (name === undefined || name === '') {
			throw new Error('The multi-select must have a name attribute.');
		}

		// Get the parts.
		const label = this.root as HTMLLabelElement;
		const input = this.query('input', HTMLInputElement)!;

		// Set the name.
		input.name = name;

		// Add the children to the button.
		for (const child of params.children) {
			this.insertNode(child, label, undefined, params.parent);
		}
	}
}

MultiSelect.html = /* html */`
	<div>
		<label class="search" for="search">Search</label>
		<input class="search" id="search" type="text" />
		<button class="all">Select All</button>
		<button class="none">Select None</button>
		<button class="invert">Invert Selection</button>
		<button class="view-checked">View Selected</button>
		<button class="view-unchecked">View Unselected</button>
		<ul class="checked"></ul>
		<ul class="all"></ul>
	</div>`;

MultiSelect.css = /* css */`
	.MultiSelect label.search {
		border: 0;
		clip: rect(0 0 0 0);
		height: 1px;
		margin: -1px;
		overflow: hidden;
		padding: 0;
		position: absolute;
		width: 1px;
	}

	.MultiSelect button, .MultiSelect input {
		display: block;
	}
	`;

MultiSelect.register();
