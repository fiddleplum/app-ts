import { Component } from '../component';

export class ElmForm extends Component {
	/** Creates the component. */
	constructor(params: Component.Params) {
		super(params);

		// Get the label width.
		const labelWidth = params.attributes.get('labelwidth');
		if (labelWidth === undefined) {
			throw new Error('LabelWidth is required.');
		}

		let html = '';
		for (const child of params.children) {
			if (child instanceof HTMLElement) {
				if (child.tagName === 'ENTRY') {
					const label = child.getAttribute('label');
					if (label === null) {
						throw new Error('Label is required in the entry.');
					}
					const type = child.getAttribute('type');
					if (type === null) {
						throw new Error('Type is required in the entry.');
					}
					if (type !== 'submit') {
						const name = child.getAttribute('name');
						if (name === null) {
							throw new Error('Name is required in the entry.');
						}
						if (this._entries.has(name)) {
							throw new Error('Only one entry of each name allowed.');
						}
						if (type === 'text') {
							html += `<p><label for="${name}" style="width: ${labelWidth};">${label}:</label><input id="${name}" type="text" style="width: calc(100%-${labelWidth});"></input></p>`;
						}
						else if (type === 'password') {
							html += `<p><label for="${name}" style="width: ${labelWidth};">${label}:</label><input id="${name}" type="password" style="width: calc(100%-${labelWidth});"></input></p>`;
						}
						else {
							throw new Error(`Unknown entry type "${type}" found.`);
						}
						this._entries.add(name);
					}
					else {
						if (this._entries.has('submit')) {
							throw new Error('Only one submit button allowed.');
						}
						const action = child.getAttribute('action');
						if (action === null) {
							throw new Error('Action is required in the submit entry.');
						}
						html += `<p><button id="submit" onclick="${action}">${label}</button></p>`;
						html += `<p id="message"></p>`;
						this._entries.add('submit');
					}
				}
				else {
					html += child.outerHTML;
				}
			}
		}
		this.insertHtml(this.root, null, html, params.parent ?? undefined);
	}

	getValues(): Map<string, string | boolean> {
		const values: Map<string, string | boolean> = new Map();
		for (const entry of this._entries) {
			const entryElement = this.element(entry, HTMLElement);
			if (entryElement instanceof HTMLInputElement
				|| entryElement instanceof HTMLSelectElement
				|| entryElement instanceof HTMLTextAreaElement) {
				if (entryElement instanceof HTMLInputElement && entryElement.getAttribute('type') === 'checkbox') {
					values.set(entry, entryElement.checked);
				}
				else {
					values.set(entry, entryElement.value);
				}
			}
		}
		return values;
	}

	/** Sets the form to enabled or disabled. */
	setEnabled(enabled: boolean): void {
		if (enabled) {
			for (const entry of this._entries) {
				const element = this.element(entry, HTMLElement) as HTMLInputElement | HTMLButtonElement;
				element.disabled = false;
			}
		}
		else {
			for (const entry of this._entries) {
				const element = this.element(entry, HTMLElement) as HTMLInputElement | HTMLButtonElement;
				element.disabled = true;
			}
		}
	}

	/** Sets the message below the form. */
	setMessage(message: string): void {
		this.element('message', HTMLParagraphElement).innerHTML = message;
	}

	/** The entries. */
	private _entries: Set<string> = new Set();
}

ElmForm.html = /* html */`
	<div>
	</div>
	`;

ElmForm.css = /* css */`
	.ElmForm {
		width: 100%;
		max-width: 15rem;
		margin: 0 auto;
	}
	.ElmForm.disabled {
		pointer-events: none;
		opacity: 0.4;
	}
	.ElmForm label {
		width: 5rem;
	}
	.ElmForm input {
		width: calc(100% - 5rem);
	}
	.ElmForm #submit {
		width: 100%;
	}
	.ElmForm #message:empty {
		opacity: 0;
	}
	.ElmForm #message {
		opacity: 1;
		transition: opacity .125s;
	}
	`;

ElmForm.register();
