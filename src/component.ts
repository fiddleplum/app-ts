import isIn from './is_in';

/**
 * A base component from which other components can extend.
 * Each subclass can have an `html` and a `style` property to add style to the components.
 * Only the most derived subclass's `html` property will be used.
 */
class Component {
	/** The parent's reference to the component. */
	private ref: string;

	/** The root elements. */
	private rootNodes: Node[] = [];

	/** The set of child components. */
	private components: Set<Component> = new Set();

	/** The mapping of references to elements. */
	private elementRefs: Map<string, Element> = new Map();

	/** The mapping of references to child components. */
	private componentRefs: Map<string, Component> = new Map();

	/** The registry entry. */
	private registryEntry: Component.RegistryEntry;

	/** The registered components, mapped from string to Component type. */
	private static registry: Map<string, Component.RegistryEntry> = new Map();

	/** The HTML that goes with the component. */
	public static html = '';

	/** The CSS that goes with the component. */
	public static css = '';

	constructor(params: Component.Params) {
		// Make sure the component is registered.
		const registryEntry = Component.registry.get(this.constructor.name.toLowerCase());
		if (registryEntry === undefined) {
			throw new Error('The component "' + this.constructor.name + '" has not been registered.');
		}
		this.registryEntry = registryEntry;

		// Set the reference that the parent has for this component.
		this.ref = params.ref;

		// Set the HTML of the root element.
		if (registryEntry.html !== '') {
			// Create the template and add the html content as the root node.
			const templateElem = document.createElement('template');
			templateElem.innerHTML = registryEntry.html;
			this.rootNodes = [...templateElem.content.cloneNode(true).childNodes];

			// Set the event handlers and child components.
			for (const node of this.rootNodes) {
				if (node instanceof Element) {
					// Set the child components.
					this.setComponents(node);

					// Set the references.
					this.setRefs(node);

					// Set the event handlers.
					this.setEventHandlersFromElemAttributes(node);

					// Add the classes to the root element.
					for (const ancestorEntries of registryEntry.ancestors) {
						node.classList.add(ancestorEntries.ComponentType.name);
					}
				}
			}
		}

		// Set the style element.
		let lastStyleElem = null;
		for (let i = 0; i < registryEntry.ancestors.length; i++) {
			const ancestorEntry = registryEntry.ancestors[i];

			// Create the ancestor's style element if it doesn't already exist, and increment the use count.
			if (ancestorEntry.css !== '') {
				if (ancestorEntry.styleCount === 0) {
					ancestorEntry.styleElem = document.createElement('style');
					ancestorEntry.styleElem.id = ancestorEntry.ComponentType.name;
					ancestorEntry.styleElem.innerHTML = ancestorEntry.css;
					document.head.insertBefore(ancestorEntry.styleElem, lastStyleElem);
				}
				ancestorEntry.styleCount += 1;
				lastStyleElem = ancestorEntry.styleElem;
			}
		}

		// If there is a ref element called content, this is where the content goes.
		const contentElement = this.elementRefs.get('content');
		if (contentElement !== undefined) {
			this.__setHtml(contentElement, '');
			for (const child of params.children) {
				contentElement.appendChild(child);
			}
			this.setRefs(contentElement);
			this.setComponents(contentElement);
		}
	}

	/**
	 * Destroys this when it is no longer needed. Call to clean up the object.
	 */
	__destroy(): void {
		// Destroy all child components.
		for (const component of this.components) {
			component.__destroy();
		}

		// Remove the style elements of the component and its ancestors.
		for (let i = 0; i < this.registryEntry.ancestors.length; i++) {
			// Decrement the use count of the ancestor's style element and remove it if the use count is zero.
			const ancestorEntry = this.registryEntry.ancestors[i];
			if (ancestorEntry.styleElem !== null) {
				ancestorEntry.styleCount -= 1;
				if (ancestorEntry.styleCount === 0) {
					document.head.removeChild(ancestorEntry.styleElem);
					ancestorEntry.styleElem = null;
				}
			}
		}
	}

	/** Returns true if this has the element with the reference. */
	__hasElement(ref: string): boolean {
		return this.elementRefs.has(ref);
	}

	/** Gets the element with the reference. Throws a ReferenceError if not found. */
	__element(ref: string): Element {
		const element = this.elementRefs.get(ref);
		if (element === undefined) {
			throw new ReferenceError();
		}
		return element;
	}

	/** Returns true if this has the component with the reference. */
	__hasComponent(ref: string): boolean {
		return this.componentRefs.has(ref);
	}

	/** Gets the component with the reference or null if not found. */
	__component(ref: string): Component {
		const component = this.componentRefs.get(ref);
		if (component === undefined) {
			throw new ReferenceError();
		}
		return component;
	}

	/** Sets the inner html for an referenced element. Cleans up tabs and newlines.
	 * Cleans up old handlers and components and adds new handlers and components. */
	__setHtml(element: Element, html: string): void {
		html = html.replace(/[\t\n]+/g, '');
		for (const child of element.children) {
			this.unsetRefs(child);
			this.unsetComponents(child);
		}
		element.innerHTML = html;
		for (const child of element.children) {
			if (child instanceof HTMLElement) {
				this.setComponents(child);
				this.setRefs(child);
				this.setEventHandlersFromElemAttributes(child);
			}
		}
	}

	/** Sets a new component of type *ComponentType* as a child of *parentNode* right before
	 * the child *beforeChild* using the *params*. */
	__insertComponent<T extends Component>(ComponentType: new (params: Component.Params) => T, parentNode: Node, beforeChild: Node | null, params: Component.Params): T {
		// Create the component.
		const newComponent = new ComponentType(params);

		// Add it to the list of components.
		this.components.add(newComponent);

		// Connect the root nodes to the parentNode.
		newComponent.__connectRootNodes(parentNode, beforeChild);

		// Set the reference, if there is one.
		if (params.ref !== '') {
			this.componentRefs.set(params.ref, newComponent);
		}
		return newComponent;
	}

	/** Deletes the referenced component. Does nothing if it isn't found. */
	__deleteComponent(component: Component): void {
		if (!this.components.has(component)) {
			return;
		}
		// Delete the component from the lists.
		if (component.ref !== '') {
			this.componentRefs.delete(component.ref);
		}
		this.components.delete(component);

		// Remove the component's root nodes.
		for (const node of component.rootNodes) {
			if (node.parentNode !== null) {
				node.parentNode.removeChild(node);
			}
		}

		// Call its destroy function.
		component.__destroy();
	}

	/** Connects the component's root nodes as children of *parentNode* right before
	 * the child *beforeChild*. */
	__connectRootNodes(parentNode: Node, beforeChild: Node | null): void {
		// Connect the component to its parent.
		for (const rootNode of this.rootNodes) {
			if (beforeChild !== null) {
				parentNode.insertBefore(rootNode, beforeChild);
			}
			else {
				parentNode.appendChild(rootNode);
			}
		}
	}

	/** Sets the refs for the element and its children. */
	private setRefs(element: Element): void {
		if (element.classList.contains('Component')) {
			return; // Don't process child components.
		}
		const attribute = element.attributes.getNamedItem('ref');
		if (attribute !== null) {
			if (this.elementRefs.has(attribute.value)) {
				throw new Error('The element ref "' + attribute.value + '" has already been used.');
			}
			this.elementRefs.set(attribute.value, element);
		}
		for (const child of element.children) {
			if (child instanceof HTMLElement) {
				this.setRefs(child);
			}
		}
	}

	/** Unsets the refs for the node and its children. */
	private unsetRefs(element: Element): void {
		if (element.classList.contains('Component')) {
			return; // Don't process child components.
		}
		const attribute = element.attributes.getNamedItem('ref');
		if (attribute !== null) {
			this.elementRefs.delete(attribute.value);
		}
		for (const child of element.children) {
			this.unsetRefs(child);
		}
	}

	/** Goes through all of the tags, and for any that match a component in the registry, sets it with
	 * the matching component. Goes through all of the children also. */
	private setComponents(element: Element): void {
		const registryEntry = Component.registry.get(element.tagName.toLowerCase());
		if (registryEntry !== undefined) {
			const params = new Component.Params();
			// Get the reference id.
			const refAttribute = element.attributes.getNamedItem('ref');

			if (refAttribute !== null) {
				params.ref = refAttribute.value;
			}
			// Get the attributes.
			for (const attribute of element.attributes) {
				let attributeValue = attribute.value;
				let value: unknown = attributeValue;
				if (attributeValue.startsWith('{{') && attributeValue.endsWith('}}')) {
					attributeValue = attributeValue.substring(2, attributeValue.length - 2);
					if (isIn(this, attributeValue)) {
						value = this[attributeValue];
						if (value instanceof Function) {
							value = value.bind(this);
						}
					}
				}
				params.attributes.set(attribute.name, value);
			}
			// Get the grandchildren.
			for (const child of element.childNodes) {
				params.children.push(child);
				element.removeChild(child);
			}
			if (element.parentNode !== null) {
				this.__insertComponent(registryEntry.ComponentType, element.parentNode, element, params);
				element.parentNode.removeChild(element);
			}
		}
		else {
			for (const child of element.children) {
				this.setComponents(child);
			}
		}
	}

	/** Unsets all of the components that are in the node. Used before setting new HTML. */
	private unsetComponents(node: Node): void {
		for (const component of this.components) {
			for (const rootNode of component.rootNodes) {
				if (node === rootNode || node.contains(rootNode)) {
					this.__deleteComponent(component);
					break;
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
				// Get the callback.
				if (isIn(this, attribute.value)) {
					const handler = this[attribute.value];
					if (handler === undefined || !(handler instanceof Function)) {
						throw new Error('Could not find ' + event + ' handler ' + attribute.value + ' for element with id ' + element.id);
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
		for (const attributeName of attributeNamesToRemove) {
			element.removeAttribute(attributeName);
		}
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
		if (this.registry.has(this.name.toLowerCase())) {
			throw new Error('A component named "' + this.name + '" is already registered.');
		}

		const entry = new Component.RegistryEntry(this);

		entry.ancestors.push(entry);

		// Populate the ancestors.
		let ancestor: typeof Component = this;
		while (true) {
			if (ancestor === Component) {
				break;
			}
			ancestor = Object.getPrototypeOf(ancestor);
			const ancestorEntry = Component.registry.get(ancestor.name.toLowerCase());
			if (ancestorEntry !== undefined) {
				entry.ancestors.push(ancestorEntry);
			}
		}

		// Set the registry entry.
		this.registry.set(this.name.toLowerCase(), entry);
	}
}

namespace Component {
	/** The params of an element that will become a component. */
	export class Params {
		/** The reference of the component, if it has one. */
		public ref = '';

		/** The attributes passed as if it were <Component attrib=''...>. */
		public attributes: Map<string, unknown> = new Map();

		/** The children of the node as if it were <Component><child1/>...</Component>. */
		public children: Node[] = [];
	}

	/** The registry entry that describes a component type. */
	export class RegistryEntry {
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
		public styleCount = 0;

		constructor(ComponentType: typeof Component) {
			this.ComponentType = ComponentType;
			this.html = ComponentType.html !== undefined ? ComponentType.html.replace(/[\t\n]+/g, '').trim() : '';
			this.css = ComponentType.css !== undefined ? ComponentType.css.trim() : '';
		}
	}
}

Component.register();

export default Component;
