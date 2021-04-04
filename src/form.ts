export class Form {
	/** Gets the inputs from a form along with their values. Each key/value pair is an input's name and
	 * corresponding value. */
	static getInputs(elem: Element): {[key: string]: string | boolean} {
		const result: {[key: string]: string | boolean} = {};
		for (const child of elem.children) {
			if (child instanceof HTMLInputElement
				|| child instanceof HTMLSelectElement
				|| child instanceof HTMLTextAreaElement) {
				const name = child.getAttribute('name');
				if (name !== null) {
					if (child instanceof HTMLInputElement) {
						if (child.getAttribute('type') === 'checkbox') {
							result[name] = child.checked;
						}
						else if (child.getAttribute('type') === 'radio') {
							if (child.checked) {
								result[name] = child.value;
							}
						}
						else {
							result[name] = child.value;
						}
					}
					else {
						result[name] = child.value;
					}
				}
			}
			Object.assign(result, this.getInputs(child));
		}
		return result;
	}
}
