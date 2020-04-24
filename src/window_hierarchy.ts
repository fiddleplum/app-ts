import isIn from './is_in';

export default function windowHierarchy(): { [key: string]: {} } {
	const classParents = new Map<string, string>();
	Object.getOwnPropertyNames(window).forEach(function (v) {
		if (isIn(window, v)) {
			let c = window[v];
			while (c instanceof Object && isIn(c, 'name') && c.name !== '' && !classParents.has(c.name as string) && Object.getPrototypeOf(c).name !== undefined) {
				classParents.set(c.name as string, Object.getPrototypeOf(c).name);
				c = Object.getPrototypeOf(c);
			}
		}
	});
	let count = 0;
	const addedClasses = new Map<string, { [key: string]: {} }>();
	const classes: { [key: string]: {} } = {};
	while(classParents.size > 0) {
		for(const [name, parent] of classParents) {
			if (parent === '') {
				classes[name] = {};
				addedClasses.set(name, classes[name]);
				classParents.delete(name);
			}
			else if (!addedClasses.has(name) && addedClasses.has(parent)) {
				const parentObject = addedClasses.get(parent);
				if (parentObject !== undefined) {
					parentObject[name] = {};
					addedClasses.set(name, parentObject[name]);
					classParents.delete(name);
				}
			}
		}
		count++;
		if (count > 10) {
			break;
		}
	}
	return classes;
}
