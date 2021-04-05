import { Component } from '../component';

/** An easy-to-use form. */
export class ElmForm extends Component {
	/** Creates the component. */
	constructor(params: Component.Params) {
		super(params);

		let html = '';
		for (const elem of params.children) {
			if (elem instanceof HTMLElement) {
				if (elem.tagName === 'ENTRY') {
					const type = elem.getAttribute('type');
					if (type === null) {
						throw new Error('Type attribute is required in the entry.');
					}
					if (type !== 'submit') {
						const name = elem.getAttribute('name');
						if (name === null) {
							throw new Error('Name attribute is required in the entry.');
						}
						if (this._entryNames.has(name)) {
							throw new Error('Only one entry of each name allowed.');
						}
						let value = elem.getAttribute('value');
						if (value === null) {
							value = '';
						}
						const width = elem.getAttribute('width');
						const widthStyle = width !== null ? ` style="width: ${width}"` : '';
						html += `<span id="${name}" class="${type} entry">`;
						if (type === 'text') {
							html += `<input name="${name}" type="text" value="${value}"${widthStyle}></input>`;
						}
						else if (type === 'password') {
							html += `<input name="${name}" type="password" value="${value}"${widthStyle}></input>`;
						}
						else if (type === 'choice') {
							for (const choiceElement of elem.children) {
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
									<input id="${name}-${choiceValue}" type="radio" name="${name}" value="${choiceValue}"${checked ? ' checked' : ''}${widthStyle}></input>
									<label for="${name}-${choiceValue}">${label}</label>
									`;
							}
						}
						else if (type === 'dropdown') {
							const multiple = elem.getAttribute('multiple');
							html += `<select name="${name}"${multiple !== null ? ' multiple' : ''}>`;
							for (const choiceElement of elem.children) {
								if (choiceElement.tagName !== 'CHOICE') {
									throw new Error(`Non-option element found in option selection.`);
								}
								const choiceValue = choiceElement.getAttribute('value');
								if (choiceValue === null) {
									throw new Error(`Value attribute is required in choice element.`);
								}
								const selected = choiceValue === value;
								const label = choiceElement.innerHTML;
								html += `<option id="${name}-${choiceValue}" value="${choiceValue}"${selected ? ' selected' : ''}>${label}</option>`;
							}
							html += `</select>`;
						}
						else if (type === 'toggle') {
							const label = elem.innerHTML;
							html += `
								<input id="${name}-input" type="checkbox" name="${name}"${value === 'true' ? ' checked' : ''}></input>
								<label for="${name}-input"${widthStyle}>${label}</label>`;
						}
						else {
							throw new Error(`Unknown entry type "${type}" found.`);
						}
						html += `</span>`;
						this._entryNames.add(name);
					}
					else {
						const action = elem.getAttribute('action');
						if (action === null) {
							throw new Error('Action is required in the submit entry.');
						}
						html += `<button class="submit" onclick="${action}">${elem.innerHTML}</button>`;
						html += `<p id="message"></p>`;
					}
				}
				else {
					html += elem.outerHTML;
				}
			}
		}
		this.insertHtml(this.root, null, html, params.parent ?? undefined);
	}

	/** Gets the current input values as a map. Dropdowns with multiple selections are separated by commas. */
	getValues(): Map<string, string | boolean> {
		const values: Map<string, string | boolean> = new Map();
		for (const entry of this._entryNames) {
			const spanElem = this.element(entry, HTMLElement);
			if (spanElem.classList.contains('text') || spanElem.classList.contains('password')) {
				values.set(entry, spanElem.querySelector('input')!.value);
			}
			else if (spanElem.classList.contains('choice')) {
				const choiceElems = spanElem.querySelectorAll('input');
				for (const choiceElem of choiceElems) {
					if (choiceElem.checked) {
						values.set(entry, choiceElem.value);
					}
				}
			}
			else if (spanElem.classList.contains('dropdown')) {
				values.set(entry, spanElem.querySelector('select')!.value);
			}
			else if (spanElem.classList.contains('toggle')) {
				values.set(entry, spanElem.querySelector('input')!.checked);
			}
		}
		return values;
	}

	setValues(values: Map<string, string | boolean>): void {
		for (const nameValue of values) {
			const name = nameValue[0];
			const value = nameValue[1];
			const elem = this.element(name, HTMLElement);
			if (elem === null) {
				throw new Error(`Invalid form name of "${name}".`);
			}
			const classList = elem.classList;
			if (classList.contains('text') || classList.contains('password')) {
				elem.querySelector('input')!.value = '' + value;
			}
			else if (classList.contains('choice')) {
				const radioElem = elem.querySelector(`input#${name}-${value}`) as HTMLInputElement | null;
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
						const optionElem = elem.querySelector(`option#${name}-${value.trim()}`) as HTMLOptionElement | null;
						if (optionElem === null) {
							throw new Error(`Invalid value of "${value.trim()}" for input "${name}".`);
						}
						optionElem.selected = true;
					}
				}
				else {
					const optionElem = elem.querySelector(`option#${name}-${value}`) as HTMLOptionElement | null;
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
	}

	/** Sets the message below the form. */
	setMessage(message: string): void {
		this.element('message', HTMLParagraphElement).innerHTML = message;
	}

	/** The entries. */
	private _entryNames: Set<string> = new Set();
}

ElmForm.html = /* html */`
	<div>
	</div>
	`;

ElmForm.css = /* css */`
	.ElmForm .submit {
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
