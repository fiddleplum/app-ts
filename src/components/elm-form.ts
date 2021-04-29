import { Component } from '../component';
import { RandomString } from '../random_string';

/** An easy-to-use form. */
export class ElmForm extends Component {
	/** Creates the component. */
	constructor(params: Component.Params) {
		super(params);

		// Insert all of the children.
		for (const node of params.children) {
			this.insertNode(this.root, null, node, params.parent ?? this);
		}

		// Parse the entries.
		this.parseEntries(this.root, params.parent);
	}

	/** Gets the current input values as a map. Dropdowns with multiple selections are separated by commas. */
	getValues(): Map<string, string | boolean> {
		const values: Map<string, string | boolean> = new Map();
		for (const [name, id] of this._entryNamesToIds) {
			const spanElem = this.query(`.entry-${id}`, HTMLSpanElement);
			if (spanElem.classList.contains('text') || spanElem.classList.contains('password')) {
				values.set(name, spanElem.querySelector('input')!.value);
			}
			else if (spanElem.classList.contains('choice')) {
				const choiceElems = spanElem.querySelectorAll('input');
				for (const choiceElem of choiceElems) {
					if (choiceElem.checked) {
						values.set(name, choiceElem.value);
					}
				}
			}
			else if (spanElem.classList.contains('dropdown')) {
				values.set(name, spanElem.querySelector('select')!.value);
			}
			else if (spanElem.classList.contains('toggle')) {
				values.set(name, spanElem.querySelector('input')!.checked);
			}
		}
		return values;
	}

	/** Sets the values for the form. */
	setValues(values: Map<string, string | boolean>): void {
		for (const nameValue of values) {
			const name = nameValue[0];
			const value = nameValue[1];
			const id = this._entryNamesToIds.get(name);
			if (id === undefined) {
				throw new Error(`Invalid form name of "${name}".`);
			}
			const elem = this.query(`.entry-${id}`, HTMLDivElement);
			const classList = elem.classList;
			if (classList.contains('text') || classList.contains('password')) {
				elem.querySelector('input')!.value = '' + value;
			}
			else if (classList.contains('choice')) {
				const radioElem = elem.querySelector(`input.${id}-${value}`) as HTMLInputElement | null;
				if (radioElem === null) {
					throw new Error(`Invalid value of "${value}" for input "${name}".`);
				}
				radioElem.checked = true;
			}
			else if (classList.contains('dropdown')) {
				const selectElem = elem.querySelector('select');
				if (selectElem!.multiple) {
					if (typeof value !== 'string') {
						throw new Error(`Invalid boolean value of "${value}" for input "${name}". It must be a comma-separated string.`);
					}
					const values = value.split(',');
					for (const value of values) {
						const optionElem = elem.querySelector(`option.${id}-${value.trim()}`) as HTMLOptionElement | null;
						if (optionElem === null) {
							throw new Error(`Invalid value of "${value.trim()}" for input "${name}".`);
						}
						optionElem.selected = true;
					}
				}
				else {
					const optionElem = elem.querySelector(`option.${id}-${value}`) as HTMLOptionElement | null;
					if (optionElem === null) {
						throw new Error(`Invalid value of "${value}" for input "${name}".`);
					}
					optionElem.selected = true;
				}
			}
			else if (classList.contains('toggle')) {
				elem.querySelector('input')!.checked = typeof value === 'boolean' ? value : value === 'true';
			}
		}
	}

	/** Sets the form to enabled or disabled. */
	setEnabled(enabled: boolean): void {
		if (enabled) {
			(this.root as HTMLDivElement).style.opacity = '100%';
		}
		else {
			(this.root as HTMLDivElement).style.opacity = '50%';
		}
		for (const input of this.root.querySelectorAll('input')) {
			input.disabled = !enabled;
		}
		for (const button of this.root.querySelectorAll('button')) {
			button.disabled = !enabled;
		}
		for (const select of this.root.querySelectorAll('select')) {
			select.disabled = !enabled;
		}
	}

	/** Sets the message below the form. */
	setMessage(message: string): void {
		this.query('.message', Element).innerHTML = message;
	}

	/** Inserts entries as html to be parsed as part of the form. */
	insertEntries(parent: Element, before: Node | null, html: string, context: Component = this): void {
		this.insertHtml(parent, before, html, context);
		this.parseEntries(parent, context);
	}

	/** Parses all of the entries. */
	private parseEntries(elem: Element, context: Component | undefined): void {
		const entries = elem.querySelectorAll('entry');
		for (const entry of entries) {
			let html = '';
			const type = entry.getAttribute('type');
			if (type === null) {
				throw new Error('Type attribute is required in the entry.');
			}
			if (type !== 'submit') {
				const name = entry.getAttribute('name');
				if (name === null) {
					throw new Error('Name attribute is required in the entry.');
				}
				if (this._entryNamesToIds.has(name)) {
					throw new Error(`Only one entry of each name allowed. The duplicate name is ${name}`);
				}
				let value = entry.getAttribute('value');
				if (value === null) {
					value = '';
				}
				// Generate a random id and set the name-to-id mapping.
				const id = RandomString.generate(16);
				this._entryNamesToIds.set(name, id);
				// Get the widths.
				const width = entry.getAttribute('width');
				const widthStyle = width !== null ? ` style="width: ${width}"` : '';
				// Create the html depending on the type.
				html += `<span class="entry-${id} ${type} entry">`;
				if (type === 'text') {
					html += `<input name="${name}" type="text" value="${value}"${widthStyle}></input>`;
				}
				else if (type === 'password') {
					html += `<input name="${name}" type="password" value="${value}"${widthStyle}></input>`;
				}
				else if (type === 'choice') {
					for (const choiceElement of entry.children) {
						if (choiceElement.tagName !== 'CHOICE') {
							throw new Error(`Non-choice element found in choice selection.`);
						}
						const choiceValue = choiceElement.getAttribute('value');
						if (choiceValue === null) {
							throw new Error(`Value attribute is required in choice element.`);
						}
						const checked = choiceValue === value;
						const label = choiceElement.innerHTML;
						html += `
							<input id="${id}-${choiceValue}" type="radio" name="${name}" value="${choiceValue}"${checked ? ' checked' : ''}${widthStyle}></input>
							<label for="${id}-${choiceValue}">${label}</label>
							`;
					}
				}
				else if (type === 'dropdown') {
					const multiple = entry.getAttribute('multiple');
					html += `<select name="${name}"${multiple !== null ? ' multiple' : ''}>`;
					for (const choiceElement of entry.children) {
						if (choiceElement.tagName !== 'CHOICE') {
							throw new Error(`Non-option element found in option selection.`);
						}
						const choiceValue = choiceElement.getAttribute('value');
						if (choiceValue === null) {
							throw new Error(`Value attribute is required in choice element.`);
						}
						const selected = choiceValue === value;
						const label = choiceElement.innerHTML;
						html += `<option class="${id}-${choiceValue}" value="${choiceValue}"${selected ? ' selected' : ''}>${label}</option>`;
					}
					html += `</select>`;
				}
				else if (type === 'toggle') {
					const label = entry.innerHTML;
					html += `
						<input id="${id}-input" type="checkbox" name="${name}"${value === 'true' ? ' checked' : ''}></input>
						<label for="${id}-input"${widthStyle}>${label}</label>`;
				}
				else {
					throw new Error(`Unknown entry type "${type}" found.`);
				}
				html += `</span>`;
			}
			else {
				const action = entry.getAttribute('action');
				if (action === null) {
					throw new Error('Action is required in the submit entry.');
				}
				html += `<button class="submit" onclick="${action}">${entry.innerHTML}</button>`;
				html += `<p class="message"></p>`;
			}
			// Add the html.
			this.insertHtml(entry.parentElement!, entry, html, context);
			// Delete the entry element.
			this.removeNode(entry);
		}
	}

	/** The entries. */
	private _entryNamesToIds: Map<string, string> = new Map();
}

ElmForm.html = /* html */`
	<div>
	</div>
	`;

ElmForm.css = /* css */`
	.ElmForm .submit {
		width: 100%;
	}
	.ElmForm .message:empty {
		opacity: 0;
	}
	.ElmForm .message {
		opacity: 1;
		transition: opacity .125s;
	}
	`;

ElmForm.register();
