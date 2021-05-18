import { Component } from '../component';

/** An easy-to-use form. */
export class ElmForm extends Component {
	/** Creates the component. */
	constructor(params: Component.Params) {
		super(params);

		// Insert all of the children.
		for (const node of params.children) {
			this.insertNode(node, this.root, undefined, params.parent);
		}

		// Parse the entries.
		this.parseEntries(params.parent);
	}

	/** Gets the current input values as a map. Dropdowns with multiple selections are separated by commas. */
	getValues(): Map<string, string | boolean> {
		const values: Map<string, string | boolean> = new Map();
		for (const [name, elem] of this._namesToEntryElems) {
			if (elem.classList.contains('text') || elem.classList.contains('password') || elem.classList.contains('hidden')) {
				values.set(name, elem.querySelector('input')!.value);
			}
			else if (elem.classList.contains('choice')) {
				const choiceElems = elem.querySelectorAll('input');
				for (const choiceElem of choiceElems) {
					if (choiceElem.checked) {
						values.set(name, choiceElem.value);
					}
				}
			}
			else if (elem.classList.contains('dropdown')) {
				values.set(name, elem.querySelector('select')!.value);
			}
			else if (elem.classList.contains('toggle')) {
				values.set(name, elem.querySelector('input')!.checked);
			}
		}
		return values;
	}

	/** Sets the values for the form. */
	setValues(values: Map<string, string | boolean>): void {
		for (const nameValue of values) {
			const name = nameValue[0];
			const value = nameValue[1];
			const elem = this._namesToEntryElems.get(name);
			if (elem === undefined) {
				throw new Error(`Form entry "${name}" not found.`);
			}
			const classList = elem.classList;
			if (classList.contains('text') || classList.contains('password') || classList.contains('hidden')) {
				elem.querySelector('input')!.value = '' + value;
			}
			else if (classList.contains('choice')) {
				const radioElem = elem.querySelector(`span[data-value="${value}"] input`) as HTMLInputElement | null;
				console.log(`span[data-value="${name}-${value}"] input`);
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
						const optionElem = elem.querySelector(`span[data-value="${value}"] input`) as HTMLOptionElement | null;
						if (optionElem === null) {
							throw new Error(`Invalid value of "${value.trim()}" for input "${name}".`);
						}
						optionElem.selected = true;
					}
				}
				else {
					const optionElem = elem.querySelector(`span[data-value="${value}"] input`) as HTMLOptionElement | null;
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
		this.query('.message', Element)!.innerHTML = message;
	}

	/** Inserts entries as html to be parsed as part of the form. */
	insertEntries(html: string, beforeName: string | undefined): void {
		let beforeElem = undefined;
		if (beforeName !== undefined) {
			beforeElem = this._namesToEntryElems.get(beforeName);
			if (beforeElem === undefined) {
				throw new Error(`Entry element with name "${beforeName}" not found.`);
			}
		}
		else {
			beforeElem = this.query(`.entry:last-child`, HTMLElement);
			if (beforeElem === undefined) {
				beforeElem = this.query(`.message`, HTMLElement);
			}
			else {
				beforeElem = beforeElem.nextElementSibling ?? undefined;
			}
		}
		this.insertHtml(html, this.root, beforeElem, this);
		this.parseEntries(this);
	}

	/** Adds a choice to a choice entry. */
	addChoice(name: string, value: string, labelHTML: string, checked: boolean, beforeValue: string | undefined): void {
		const entryElem = this._namesToEntryElems.get(name);
		if (entryElem === undefined) {
			throw new Error(`Entry element with name "${name}" not found.`);
		}
		const html = `
			<span class="choice" data-value="${value}">
				<label class="button" for="${name}-${value}">${labelHTML}</label>
				<input name="${name}" id="${name}-${value}" type="radio" value="${value}"${checked ? ' checked' : ''}></input>
			</span>`;
		let beforeChoiceElem = undefined;
		if (beforeValue !== undefined) {
			beforeChoiceElem = entryElem.querySelector(`[data-value="${beforeValue}"]`) ?? undefined;
			if (beforeChoiceElem === undefined) {
				throw new Error(`Before choice element with value ${beforeValue} not found.`);
			}
		}
		this.insertHtml(html, entryElem, beforeChoiceElem, this);
	}

	/** Removes a choice from a choice entry. */
	removeChoice(name: string, value: string): void {
		const entryElem = this._namesToEntryElems.get(name);
		if (entryElem === undefined) {
			throw new Error(`Entry element with name "${name}" not found.`);
		}
		const choiceElem = entryElem.querySelector(`[data-value="${value}"]`) ?? undefined;
		if (choiceElem === undefined) {
			throw new Error(`Choice element with value ${value} not found.`);
		}
		this.removeNode(choiceElem);
	}

	/** Parses all of the entries. */
	private parseEntries(context: Component | undefined): void {
		const entries = this.root.querySelectorAll('entry');
		for (const entry of entries) {
			const type = entry.getAttribute('type');
			if (type === null) {
				throw new Error('Type attribute is required in the entry.');
			}
			// Get the name of the entry.
			const name = entry.getAttribute('name');
			if (name === null) {
				throw new Error('Name attribute is required in the entry.');
			}
			let html = '';
			if (type !== 'submit') {
				if (this._namesToEntryElems.has(name)) {
					throw new Error(`There already exists an entry with the name ${name}. Only one entry of each name allowed.`);
				}
				// Get any value of the entry.
				const value = entry.getAttribute('value') ?? '';
				// Get the widths.
				const width = entry.getAttribute('width');
				const widthStyle = width !== null ? ` style="width: ${width}"` : '';
				// Create the html depending on the type.
				if (type === 'text') {
					html = `
						<div class="entry ${type}">
							<label for="${name}">${entry.innerHTML}</label>
							<input name="${name}" id="${name}" type="text" value="${value}"${widthStyle}></input>
						</div>`;
				}
				else if (type === 'password') {
					html = `
						<div class="entry ${type}">
							<label for="${name}">${entry.innerHTML}</label>
							<input name="${name}" id="${name}" type="password" value="${value}"${widthStyle}></input>
						</div>`;
				}
				else if (type === 'hidden') {
					html = `
						<span class="entry ${type}">
							<input name="${name}" type="hidden" value="${value}"></input>
						</span>`;
				}
				else if (type === 'choice') {
					html = `<div class="entry ${type}">`;
					for (const choiceElement of entry.children) {
						if (choiceElement.tagName !== 'CHOICE') {
							throw new Error(`Non-choice element found in choice selection.`);
						}
						const choiceValue = choiceElement.getAttribute('value');
						if (choiceValue === null) {
							throw new Error(`Value attribute is required in choice element.`);
						}
						const checked = choiceValue === value;
						html += `
							<span class="choice" data-value="${choiceValue}">
								<input name="${name}" id="${name}-${choiceValue}" type="radio" value="${choiceValue}"${checked ? ' checked' : ''}></input>
								<label class="button" for="${name}-${choiceValue}">${choiceElement.innerHTML}</label>
							</span>`;
					}
					html += `</div>`;
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
						html += `<option class="${name}-${choiceValue}" value="${choiceValue}"${selected ? ' selected' : ''}>${label}</option>`;
					}
					html += `</select>`;
				}
				else if (type === 'toggle') {
					html = `
						<span class="entry ${type}">
							<input name="${name}" id="${name}" type="checkbox" ${value === 'true' ? ' checked' : ''}></input>
							<label class="button" for="${name}"${widthStyle}>${entry.innerHTML}</label>
						</span>`;
				}
				else {
					throw new Error(`Unknown entry type "${type}" found.`);
				}
			}
			else {
				const action = entry.getAttribute('action');
				if (action === null) {
					throw new Error('Action is required in the submit entry.');
				}
				html = `
					<div class="message"></div>
					<div class="submit">
						<button onclick="${action}">${entry.innerHTML}</button>
					</div>`;

			}
			const entryElem = this.insertHtml(html, entry.parentElement!, entry, context)[0] as HTMLElement;
			this._namesToEntryElems.set(name, entryElem);
			// Delete the entry element.
			this.removeNode(entry);
		}
	}

	/** The entries. */
	private _namesToEntryElems: Map<string, HTMLElement> = new Map();
}

ElmForm.html = /* html */`
	<div>
	</div>
	`;

ElmForm.css = /* css */`
	.ElmForm .entry.text, .ElmForm .entry.password {
		display: block;
	}
	.ElmForm .submit button {
		width: 100%;
	}
	.ElmForm .message:empty {
		opacity: 0;
		margin: 0;
	}
	.ElmForm .message {
		opacity: 1;
		transition: opacity .125s, margin .125s;
	}
	`;

ElmForm.register();
