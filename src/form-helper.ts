export class FormHelper {
	/** Gets the current input values as a map. */
	static getValues(elem: Element): Map<string, string | boolean> {
		const values: Map<string, string | boolean> = new Map();
		const inputElems = elem.querySelectorAll('input');
		for (const inputElem of inputElems) {
			if (inputElem.type === 'checkbox') {
				values.set(inputElem.name, inputElem.checked);
			}
			else if (inputElem.type === 'radio') {
				if (inputElem.checked) {
					values.set(inputElem.name, true);
				}
			}
			else {
				values.set(inputElem.name, inputElem.value);
			}
		}
		const selectElems = elem.querySelectorAll('select');
		for (const selectElem of selectElems) {
			values.set(selectElem.name, selectElem.value);
		}
		return values;
	}

	/** Sets the current input values as a map. */
	static setValues(elem: Element, values: Map<string, string | boolean>): void {
		const inputElems = elem.querySelectorAll('input');
		for (const inputElem of inputElems) {
			const value = values.get(inputElem.name);
			if (value === undefined) {
				continue;
			}
			if (inputElem.type === 'checkbox') {
				if (typeof value === 'boolean') {
					inputElem.checked = value;
				}
			}
			else if (inputElem.type === 'radio') {
				if (value === inputElem.value) {
					inputElem.checked = true;
				}
				else if (typeof value === 'string') {
					inputElem.checked = false;
				}
			}
			else {
				if (typeof value === 'string') {
					inputElem.value = value;
				}
			}
		}
		const selectElems = elem.querySelectorAll('select');
		for (const selectElem of selectElems) {
			const value = values.get(selectElem.name);
			if (value === undefined) {
				continue;
			}
			if (typeof value === 'string') {
				selectElem.value = value;
			}
		}
	}
}
