import { isIn } from './is_in';

/**
 * A base component from which other components can extend.
 * Each subclass can have an `html` and a `css` property to add content and style to the components.
 * Only the most derived subclass's `html` property will be used.
 */
export class Component {
	/** Creates the component. */
	constructor(params: Component.Params) {
		// Make sure the component is registered.
		const registryEntry = Component._registry.get(this.constructor.name.toLowerCase());
		if (registryEntry === undefined) {
			throw new Error('The component "' + this.constructor.name + '" has not been registered.');
		}
		this._registryEntry = registryEntry;

		// Set the id.
		this._id = params.id;

		// Create the template and add the html content as the root nodes.
		const templateElem = document.createElement('template');
		templateElem.innerHTML = registryEntry.html;
		this._roots = [...templateElem.content.cloneNode(true).childNodes];

		// Setup the root nodes.
		for (const root of this._roots) {
			// Set the id to element mapping of the root and its children.
			if (root instanceof Element) {
				this.setIds(root);
				this.setEventHandlersFromElemAttributes(root);

				// Add the classes to the root element.
				for (const ancestorEntries of registryEntry.ancestors) {
					root.classList.add(ancestorEntries.ComponentType.name);
				}
			}
		}

		// Set the style element.
		let lastStyleElem = null;
		for (let i = 0; i < registryEntry.ancestors.length; i++) {
			const ancestorEntry = registryEntry.ancestors[i];

			// Create the ancestor's style element if it doesn't already exist, and increment the use count.
			if (ancestorEntry.css !== '') {
				if (ancestorEntry.styleElemUseCount === 0) {
					ancestorEntry.styleElem = document.createElement('style');
					ancestorEntry.styleElem.id = ancestorEntry.ComponentType.name;
					ancestorEntry.styleElem.innerHTML = ancestorEntry.css;
					document.head.insertBefore(ancestorEntry.styleElem, lastStyleElem);
				}
				ancestorEntry.styleElemUseCount += 1;
				lastStyleElem = ancestorEntry.styleElem;
			}
		}
	}

	/** Creates any child components in the HTML. It's separate from the constructor, because
	 * the subclass needs to have its variables set for the child component attributes. */
	protected createChildComponents(): void {
		for (let i = 0; i < this._roots.length; i++) {
			const root = this._roots[i];
			if (root instanceof HTMLElement) {
				// If the root or its children are components, create them.
				const newRoots = this.setComponents(root);

				// If new roots were created, replace the old root with them, and add on the old root's classes.
				if (newRoots.length > 0) {
					this._roots.splice(i, 1, ...newRoots);
					for (const newRoot of newRoots) {
						if (newRoot instanceof Element) {
							newRoot.classList.add(...root.classList);
						}
					}
					i += newRoots.length - 1;
				}
			}
		}
	}

	/** Destroys the component when it is no longer needed. Call to clean up the object. */
	protected destroy(): void {
		// Destroy all of the child components.
		for (const component of this._components) {
			component.destroy();
		}

		// Remove the style elements of the component and its ancestors.
		for (let i = 0; i < this._registryEntry.ancestors.length; i++) {
			// Decrement the use count of the ancestor's style element and remove it if the use count is zero.
			const ancestorEntry = this._registryEntry.ancestors[i];
			if (ancestorEntry.styleElem !== null) {
				ancestorEntry.styleElemUseCount -= 1;
				if (ancestorEntry.styleElemUseCount === 0) {
					document.head.removeChild(ancestorEntry.styleElem);
					ancestorEntry.styleElem = null;
				}
			}
		}
	}

	/** Returns a string form of the component. */
	toString(): string {
		const componentName = this.constructor.name;
		const id = this._id;
		if (id !== '') {
			return componentName + ' id:' + id;
		}
		else {
			return componentName;
		}
	}

	/** Returns the root elements. */
	protected roots(): Node[] {
		return this._roots;
	}

	/** Returns true if this has an element with the id. */
	protected hasElement(id: string): boolean {
		return this._idsToElements.has(id);
	}

	/** Gets the element with the id. Throws a ReferenceError if not found. */
	protected element<Type extends Element>(id: string, Type: { new (...args: any[]): Type }): Type {
		const element = this._idsToElements.get(id);
		if (element === undefined) {
			throw new ReferenceError(`The element with id "${id}" could not be found.`);
		}
		if (!(element instanceof Type)) {
			throw new ReferenceError(`The element with id "${id}" is not of type ${Type.name}`);
		}
		return element;
	}

	/** Returns true if this has an component with the id. */
	protected hasComponent(id: string): boolean {
		return this._idsToComponents.has(id);
	}

	/** Gets the component with the id. Throws a ReferenceError if not found. */
	protected component<Type extends Component>(id: string, Type: { new (params: Component.Params): Type }): Type {
		const component = this._idsToComponents.get(id);
		if (component === undefined) {
			throw new ReferenceError(`The component with id "${id}" could not be found.`);
		}
		if (!(component instanceof Type)) {
			throw new ReferenceError(`The component with id "${id}" is not of type ${Type.constructor.name}`);
		}
		return component;
	}

	/** Sets the inner html for an element. Cleans up tabs and newlines in the HTML.
	 * Cleans up old id, handlers, and components and adds new id, handlers, and components. */
	protected setHtml(element: Element, html: string): void {
		for (const child of element.children) {
			this.removeElement(child);
		}
		element.innerHTML = '';
		this.insertHtml(element, null, html);
	}

	/** Removes an element. */
	protected removeElement(element: Element): void {
		this.unsetIds(element);
		this.unsetComponents(element);
		element.parentNode?.removeChild(element);
	}

	/** Inserts html at the end of the parent or before a child node. */
	protected insertHtml(parent: Element, before: Node | null, html: string): void {
		html = html.replace(/>[\t\n]+</g, '><');
		const templateElem = document.createElement('template');
		templateElem.innerHTML = html;
		for (const child of templateElem.content.childNodes) {
			const newNode = child.cloneNode(true);
			parent.insertBefore(newNode, before);
			if (newNode instanceof Element) {
				this.setIds(newNode);
				this.setEventHandlersFromElemAttributes(newNode);
				this.setComponents(newNode);
			}
		}
	}

	/** Sets a new component of type *ComponentType* as a child of *parentNode* right before
	 * the child *beforeChild* using the *params*. */
	protected insertComponent<T extends Component>(ComponentType: new (params: Component.Params) => T, parentNode: Node, beforeChild: Node | null, params: Component.Params): T {
		// Create the component.
		const newComponent = new ComponentType(params);
		// Create any child components that are within the html of the component.
		newComponent.createChildComponents();
		// For each root in the new component,
		for (let i = 0; i < newComponent._roots.length; i++) {
			// Set the event handlers for the roots if they are elements.
			// It happens after the child components have been created, because the root nodes may have changed.
			const root = newComponent._roots[i];
			if (root instanceof Element) {
				newComponent.setEventHandlersFromElemAttributes(root);
			}
			// Insert the new component root in the right spot of this component.
			parentNode.insertBefore(root, beforeChild);
		}
		// Add it to the list of components.
		this._components.add(newComponent);
		// Set the id, if there is one.
		if (params.id !== '') {
			this._idsToComponents.set(params.id, newComponent);
		}
		return newComponent;
	}

	/** Deletes the component. Does nothing if it isn't found. */
	protected deleteComponent(component: Component): void {
		if (!this._components.has(component)) {
			return;
		}
		// Delete the component from the lists.
		if (component._id !== '') {
			this._idsToComponents.delete(component._id);
		}
		this._components.delete(component);

		// Remove the component's root nodes.
		for (let i = 0; i < component._roots.length; i++) {
			component._roots[i].parentNode?.removeChild(component._roots[i]);
		}

		// Call its destroy function.
		component.destroy();
	}

	/** Sets the ids for the element and its children, excluding components. */
	private setIds(element: Element): void {
		// Don't process child components.
		if (element.classList.contains('Component')) {
			return;
		}
		// Set the id to element mapping.
		if (element.id !== undefined && element.id !== '') {
			this._idsToElements.set(element.id, element);
		}
		// Check the children of this element.
		for (const child of element.children) {
			this.setIds(child);
		}
	}

	/** Unsets the ids for the node and its children, excluding components.. */
	private unsetIds(element: Element): void {
		if (element.classList.contains('Component')) {
			return; // Don't process child components.
		}
		if (element.id !== undefined && element.id !== '') {
			this._idsToElements.delete(element.id);
		}
		for (const child of element.children) {
			this.unsetIds(child);
		}
	}

	/** Goes through all of the tags, and for any that match a component in the registry, sets it with
	 * the matching component. Goes through all of the children also. */
	private setComponents(element: Element): Node[] {
		const registryEntry = Component._registry.get(element.tagName.toLowerCase());
		// The element is a component ready to be instantiated.
		if (registryEntry !== undefined) {
			// Create the params.
			const params = new Component.Params();

			// Set the id.
			params.id = element.id;

			// Get the attributes.
			for (const attribute of element.attributes) {
				const attributeName = attribute.name.toLowerCase();
				let attributeValue = attribute.value;
				let value: unknown = attributeValue;
				if (attributeValue.startsWith('{$') && attributeValue.endsWith('$}')) {
					attributeValue = attributeValue.substring(2, attributeValue.length - 2);
					const valueAsNumber = parseFloat(attributeValue);
					if (!isNaN(valueAsNumber)) {
						value = valueAsNumber;
					}
					else if (attributeValue === 'false') {
						value = false;
					}
					else if (attributeValue === 'true') {
						value = true;
					}
					if (isIn(this, attributeValue)) {
						value = this[attributeValue];
						if (value instanceof Function) {
							value = value.bind(this);
						}
					}
					else {
						throw new Error(`Could not find value for attribute ${attribute.name}=${attribute.value} for element with id ${element.id}.`);
					}
				}
				else if (attributeValue.startsWith('{J') && attributeValue.endsWith('J}')) {
					attributeValue = attributeValue.substring(2, attributeValue.length - 2);
					try {
						value = JSON.parse(attributeValue);
					}
					catch (error) {
						throw new Error(`Could not parse JSON attribute ${attribute.name}=${attribute.value} for element with id ${element.id}: ${error.message}`);
					}
				}
				params.attributes.set(attributeName, value);
			}
			// Get the grandchildren and clear them.
			for (const child of element.childNodes) {
				params.children.push(child);
				element.removeChild(child);
			}
			element.innerHTML = '';
			// Create the new component and insert it right before the element.
			const newComponent = this.insertComponent(registryEntry.ComponentType, element.parentNode!, element, params);
			element.parentNode!.removeChild(element);
			// Return the new component's roots.
			// Used to determine if the new component's roots are now this component's roots.
			return newComponent._roots;
		}
		else {
			for (const child of element.children) {
				this.setComponents(child);
			}
			return [];
		}
	}

	/** Unsets all of the components that are in the node. Used before setting new HTML. */
	private unsetComponents(element: Element): void {
		for (const component of this._components) {
			for (const root of component._roots) {
				if (element.contains(root)) {
					this.deleteComponent(component);
				}
			}
		}
	}

	/** Sets the event handlers for all children of elem. Searches for all attributes starting with
	 * 'on' and processes them. */
	private setEventHandlersFromElemAttributes(element: Element): void {
		const attributeNamesToRemove = [];
		for (const attribute of element.attributes) {
			if (attribute.name.startsWith('on')) {
				// Get the event type without the 'on'.
				const event = attribute.name.substring(2).toLowerCase();
				// Get the attribute value.
				let attributeValue = attribute.value;
				if (attributeValue.startsWith('{$') && attributeValue.endsWith('$}')) {
					attributeValue = attributeValue.substring(2, attributeValue.length - 2);
					// Get the callback.
					if (isIn(this, attributeValue)) {
						const handler = this[attributeValue];
						if (handler === undefined || !(handler instanceof Function)) {
							throw new Error(`Could not find ${event} handler ${attributeValue} in ${this.constructor.name} for element with id ${element.id}`);
						}
						// Get the callback bound to this.
						const boundHandler = handler.bind(this);
						// Remove the attribute so there's no conflict.
						attributeNamesToRemove.push(attribute.name);
						// Add the event listener.
						element.addEventListener(event, boundHandler);
					}
				}
			}
		}
		// Remove the attributes that were handlers to remove any conflicts.
		for (const attributeName of attributeNamesToRemove) {
			element.removeAttribute(attributeName);
		}
		// Go through the children and so on.
		for (const child of element.children) {
			this.setEventHandlersFromElemAttributes(child);
		}
	}

	/** Gets the inputs from a form along with their values. Each key/value pair is an input's name and
	 * corresponding value. */
	static getFormInputs(elem: Element): {[key: string]: string | boolean} {
		const result: {[key: string]: string | boolean} = {};
		for (const child of elem.children) {
			if (child instanceof HTMLInputElement
				|| child instanceof HTMLSelectElement
				|| child instanceof HTMLTextAreaElement) {
				const name = child.getAttribute('name');
				if (name !== null) {
					if (child instanceof HTMLInputElement && child.getAttribute('type') === 'checkbox') {
						result[name] = child.checked;
					}
					else {
						result[name] = child.value;
					}
				}
			}
			Object.assign(result, this.getFormInputs(child));
		}
		return result;
	}

	/** Registers a component. */
	static register(): void {
		if (this._registry.has(this.name.toLowerCase())) {
			throw new Error('A component named "' + this.name + '" is already registered.');
		}

		// Create the registry entry.
		const entry = new RegistryEntry(this);

		// Include it as one of its ancestors.
		entry.ancestors.push(entry);

		// Populate the ancestors.
		let ancestor: typeof Component = this;
		while (true) {
			if (ancestor === Component) {
				break;
			}
			ancestor = Object.getPrototypeOf(ancestor);
			const ancestorEntry = Component._registry.get(ancestor.name.toLowerCase());
			if (ancestorEntry !== undefined) {
				entry.ancestors.push(ancestorEntry);
			}
		}

		// Set the registry entry.
		this._registry.set(this.name.toLowerCase(), entry);
	}

	/** The id of the component. */
	private _id = '';

	/** The root elements. */
	private _roots: Node[];

	/** The set of child components. */
	private _components: Set<Component> = new Set();

	/** The mapping of ids to elements. */
	private _idsToElements: Map<string, Element> = new Map();

	/** The mapping of ids to child components. */
	private _idsToComponents: Map<string, Component> = new Map();

	/** The registry entry. */
	private _registryEntry: RegistryEntry;

	/** The registered components, mapped from string to Component type. */
	private static _registry: Map<string, RegistryEntry> = new Map();

	/** The HTML that goes with the component. */
	public static html = '';

	/** The CSS that goes with the component. */
	public static css = '';
}

export namespace Component {
	/** The params of an element that will become a component. */
	export class Params {
		/** The id of the component, if it has one. */
		public id = '';

		/** The attributes passed as if it were <Component attrib=''...>. All of the keys are lower case. */
		public attributes: Map<string, unknown> = new Map();

		/** The children of the node as if it were <Component><child1/>...</Component>. */
		public children: Node[] = [];
	}
}

/** The registry entry that describes a component type. */
class RegistryEntry {
	/** The component type. */
	public ComponentType: typeof Component;

	/** The HTML for the ComponentType. */
	public html: string;

	/** The CSS for the ComponentType. */
	public css: string;

	/** The ancestor registry entries, including ComponentType and Component. */
	public ancestors: RegistryEntry[] = [];

	/** The style element. */
	public styleElem: HTMLStyleElement | null = null;

	/** The number of components using this style. Includes ComponentType and all its descendants. */
	public styleElemUseCount = 0;

	constructor(ComponentType: typeof Component) {
		this.ComponentType = ComponentType;
		if (Object.prototype.hasOwnProperty.call(ComponentType, 'html') === true) {
			this.html = ComponentType.html.replace(/>[\t\n]+</g, '><').trim();
		}
		else {
			this.html = '';
		}
		if (Object.prototype.hasOwnProperty.call(ComponentType, 'css') === true) {
			this.css = ComponentType.css.trim();
		}
		else {
			this.css = '';
		}
	}
}

Component.register();
