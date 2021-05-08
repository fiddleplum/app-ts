import { App } from './app';
import { RandomString } from './random_string';

/**
 * A base component from which other components can extend.
 * Each subclass can have an `html` and a `css` property to add content and style to the components.
 * Only the most derived subclass's `html` property will be used.
 * If the body tag is the root node in the html, it will be used as the body of the document.
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

		// Set the id of the component.
		if (params.id !== '') {
			this._id = params.id;
		}

		// Set the parent of the component.
		this._parent = params.parent;

		// Create the template and add the html content as the root node. It uses the most descendant ancestor with html.
		let registryEntryWithHTML = registryEntry;
		while (registryEntryWithHTML.ancestors.length > 1 && registryEntryWithHTML.html === '') {
			registryEntryWithHTML = registryEntryWithHTML.ancestors[1];
		}
		// Check if the component is an app.
		const componentIsApp = this instanceof App;
		const templateElem = document.createElement('template');
		templateElem.innerHTML = registryEntryWithHTML.html;
		if (componentIsApp) {
			document.body.innerHTML = '';
			const rootChildren = [...templateElem.content.childNodes];
			for (const child of rootChildren) {
				document.body.appendChild(child);
			}
			this._root = document.body;
		}
		else {
			if (templateElem.content.childNodes.length !== 1) {
				throw new Error(`In ${this}, there must exactly be one root in the HTML.`);
			}
			const root = templateElem.content.childNodes[0];
			if (!(root instanceof Element)) {
				throw new Error(`In ${this}, the root node must be an Element type.`);
			}
			this._root = root;
		}

		// Set the elements that are child components and the event handlers.
		this.setComponentsAndEventHandlers(this._root, this);

		// Add the classes to the root element.
		for (const ancestorEntries of registryEntry.ancestors) {
			this._root.classList.add(ancestorEntries.ComponentType.name);
		}

		// Add any classes given in the params.
		for (const className of params.classes) {
			this._root.classList.add(className);
		}

		// Set the style elements for the component and its ancestors.
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

		// Add the window focus release if it hasn't already been added. Used for drag-and-drop and buttons releases.
		if (!Component._windowFocusReleaseAdded) {
			window.addEventListener('mouseup', (event) => {
				this._unsetFocusReleaseCallback(event);
			});
			window.addEventListener('touchend', (event) => {
				this._unsetFocusReleaseCallback(event);
			});
			Component._windowFocusReleaseAdded = true;
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
		if (this._id !== '') {
			return componentName + ' id:' + this._id;
		}
		else {
			return componentName;
		}
	}

	/** Gets the id of the component, if it was given one. */
	get id(): string {
		return this._id;
	}

	/** Gets the parent of the component. */
	get parent(): Component | undefined {
		return this._parent;
	}

	/** Returns the root element. */
	protected get root(): Element {
		return this._root;
	}

	/** Gets an element by a query. */
	protected query<Type extends Element>(query: string, Type: { new (...args: any[]): Type }): Type {
		const element = this._root.querySelector(query);
		if (element === null) {
			throw new ReferenceError(`The element with query "${query}" could not be found.`);
		}
		if (!(element instanceof Type)) {
			throw new ReferenceError(`The element with query "${query}" is not of type ${Type.name}`);
		}
		return element;
	}

	/** Gets elements by a query. */
	protected queryAll<Type extends Element>(query: string, Type: { new (...args: any[]): Type }): NodeListOf<Type> {
		const elements = this._root.querySelectorAll(query);
		for (const element of elements) {
			if (!(element instanceof Type)) {
				throw new ReferenceError(`An element with queryAll "${query}" is not of type ${Type.name}`);
			}
		}
		return elements as NodeListOf<Type>;
	}

	/** Returns true if this has an component with the id. */
	protected hasComponent(id: string): boolean {
		return this._idsToComponents.has(id);
	}

	/** Gets the component with the id. Throws a ReferenceError if not found. */
	protected component<Type extends Component>(id: string, type: { new (params: Component.Params): Type }): Type {
		const component = this._idsToComponents.get(id);
		if (component === undefined) {
			throw new ReferenceError(`The component with id "${id}" could not be found.`);
		}
		if (!(component instanceof type)) {
			throw new ReferenceError(`The component with id "${id}" is not of type ${type.name}`);
		}
		return component;
	}

	/** Sets the inner html for an element. Cleans up tabs and newlines in the HTML.
	 * Cleans up old id, handlers, and components and adds new id, handlers, and components. */
	protected setHtml(element: Element, html: string, context: Component = this): void {
		for (const child of element.children) {
			this.removeNode(child);
		}
		element.innerHTML = '';
		this.insertHtml(element, null, html, context);
	}

	/** Inserts html at the end of the parent or before a child node. */
	protected insertHtml(parent: Element, before: Node | null, html: string, context: Component = this): void {
		html = html.replace(/>[\t\n]+</g, '><');
		const templateElem = document.createElement('template');
		templateElem.innerHTML = html;
		while (templateElem.content.childNodes.length > 0) {
			this.insertNode(parent, before, templateElem.content.childNodes[0], context);
		}
	}

	/** Inserts a node at the end of the parent or before a child node. */
	protected insertNode(parent: Element, before: Node | null, node: Node, context: Component = this): void {
		parent.insertBefore(node, before);
		if (node instanceof Element) {
			this.setComponentsAndEventHandlers(node, context);
		}
	}

	/** Removes a node. */
	protected removeNode(node: Node): void {
		// Unset all of the components that are in the node. */
		for (const component of this._components) {
			if (node.contains(component._root)) {
				this.removeComponent(component);
			}
		}

		// Remove the node from its parent.
		if (node.parentNode !== null) {
			node.parentNode.removeChild(node);
		}
	}

	/** Sets a new component of type *ComponentType* as a child of *parentNode* right before
	 * the child *beforeChild* using the *params*. */
	protected insertComponent<T extends Component>(ComponentType: new (params: Component.Params) => T, parentNode: Node, beforeChild: Node | null, params: Component.Params): T {
		// Create the component.
		const newComponent = new ComponentType(params);
		// Insert the new component root in the right spot of this component.
		parentNode.insertBefore(newComponent._root, beforeChild);
		// Add it to the list of components.
		this._components.add(newComponent);
		// Set the id, if there is one.
		if (params.id !== '') {
			this._idsToComponents.set(params.id, newComponent);
		}
		return newComponent;
	}

	/** Removes the component. Does nothing if it isn't found. */
	protected removeComponent(component: Component): void {
		if (!this._components.has(component)) {
			return;
		}
		// Remove the component from the lists.
		if (component._id !== '') {
			this._idsToComponents.delete(component._id);
		}
		this._components.delete(component);

		// Remove the component's root node.
		component._root.parentNode?.removeChild(component._root);

		// Call its destroy function.
		component.destroy();
	}

	/** Registers an event and uses the params to set a matching event handler. */
	protected registerEvent(eventName: string, params: Component.Params): void {
		const eventHandler = params.eventHandlers.get(eventName);
		if (eventHandler !== undefined) {
			this._eventHandlers.set(eventName, eventHandler);
		}
	}

	/** Triggers an event, calling the appropriate event handler, with optional args. */
	protected triggerEvent(eventName: string, ...args: any[]): void {
		const eventHandler = this._eventHandlers.get(eventName);
		if (eventHandler !== undefined) {
			eventHandler(this, ...args);
		}
	}

	/** Goes through all of the tags, and for any that match a component in the registry, sets it with
	 *  the matching component. Goes through all of the children also. */
	private setComponentsAndEventHandlers(element: Element, context: Component): void {
		const registryEntry = Component._registry.get(element.tagName.toLowerCase());
		// The element is a component ready to be instantiated. It can't be the root or a reserved tag.
		if (element !== this._root && element instanceof HTMLUnknownElement && registryEntry !== undefined) {
			// Create the params.
			const params = new Component.Params();

			// Set the parent.
			params.parent = this;

			// Set the id.
			params.id = element.id;

			// Add any classes that are from the element itself.
			for (const className of element.classList) {
				params.classes.push(className);
			}

			// Extract the event handlers from the attributes.
			const eventHandlers = this.extractEventHandlers(element, context);
			for (const entry of eventHandlers) {
				params.eventHandlers.set(entry[0], entry[1]);
			}

			// Go through any remaining attributes and add them to the params.
			for (const attribute of element.attributes) {
				const attributeName = attribute.name.toLowerCase();
				const attributeValue = attribute.value;
				if (attributeName !== 'id') {
					params.attributes.set(attribute.name.toLowerCase(), attributeValue);
				}
			}

			// Get the children and clear them.
			for (const child of element.childNodes) {
				params.children.push(child);
			}
			element.innerHTML = '';

			// Create the new component and insert it right before the element, removing the element.
			this.insertComponent(registryEntry.ComponentType, element.parentNode!, element, params);
			element.parentNode!.removeChild(element);
		}
		else {
			// Extract the event handlers from the attributes and add the event listeners.
			const eventHandlers = this.extractEventHandlers(element, context);
			for (const entry of eventHandlers) {
				// Add the event listener.
				element.addEventListener(entry[0], entry[1]);
			}

			// Make the id of the element unique.
			this.makeIdsUnique(element);

			// Go through the child elements.
			for (const child of element.children) {
				this.setComponentsAndEventHandlers(child, context);
			}
		}
	}

	/** Extracts the event handlers of the element as a mapping of strings to this-bound functions. */
	private extractEventHandlers(element: Element, context: Component): Map<string, (componentOrEvent: Component | Event) => void> {
		const eventHandlers: Map<string, (componentOrEvent: Component | Event) => void> = new Map();
		const attributesToRemove: string[] = [];
		// Get the attributes and event handlers.
		for (const attribute of element.attributes) {
			const attributeName = attribute.name.toLowerCase();
			if (attributeName.startsWith('on')) {
				let attributeValue: string = attribute.value;
				let attributeParam: string | undefined;
				// Get the string parameter, if it exists.
				if (attributeValue.includes('|')) {
					const index = attributeValue.indexOf('|');
					attributeParam = attributeValue.substring(index + 1);
					attributeValue = attributeValue.substring(0, index);
				}
				if (attributeValue in context) {
					const value = (context as Record<string, unknown>)[attributeValue];
					if (value instanceof Function) {
						let functionCall;
						if (attributeParam !== undefined) {
							functionCall = value.bind(context, attributeParam);
						}
						else {
							functionCall = value.bind(context);
						}
						eventHandlers.set(attributeName.substring(2), functionCall);
						attributesToRemove.push(attribute.name);
					}
					else {
						throw new Error(`In ${context}, the value "${attributeValue}" of the event handler ${attributeName} of component element ${element.id} is not a function of ${context.constructor.name}.`);
					}
				}
				else {
					throw new Error(`In ${context}, the value "${attributeValue}" of the event handler "${attributeName}" of component element ${element.id} is not in ${context.constructor.name}.`);
				}
			}
		}
		// Remove the attributes that were processed.
		for (const attributeName of attributesToRemove) {
			element.removeAttribute(attributeName);
		}
		// Return the processed event handlers.
		return eventHandlers;
	}

	/** Makes any id of the element unique, along with any connecting pairs. */
	private makeIdsUnique(element: Element): void {
		// If it has an id, make it unique.
		if (element.id !== '') {
			const id = element.id;
			const uniqueSuffix = `-${RandomString.generate(16)}`;
			element.id += uniqueSuffix;
			const attributes = ['for', 'aria-labelledby', 'aria-describedby'];
			for (const attribute of attributes) {
				const elems = this._root.querySelectorAll(`[${attribute}="${id}"]`);
				for (const elem of elems) {
					elem.setAttribute(attribute, id + uniqueSuffix);
				}
			}
		}
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

	/** Sets the focus release callback for when the mouse releases or touch ends. */
	setFocusReleaseCallback(callback: ((x: number, y: number) => void)): void {
		if (Component._focusReleaseCallback !== undefined) {
			throw new Error('Another component already has the focus.');
		}
		// Make everything unselectable.
		document.body.classList.add('no-select');
		// Set the callback.
		Component._focusReleaseCallback = callback;
	}

	/** Unsets the focus release callback. Called by window onmouseup and ontouchend event handlers. */
	private _unsetFocusReleaseCallback(event: MouseEvent | TouchEvent): void {
		let x: number, y: number;
		if (event instanceof MouseEvent) {
			x = event.clientX;
			y = event.clientY;
		}
		else if (event.touches.length > 0) {
			x = event.touches[0].clientX;
			y = event.touches[0].clientY;
		}
		else {
			x = NaN;
			y = NaN;
		}
		if (Component._focusReleaseCallback !== undefined) {
			// Call the callback.
			Component._focusReleaseCallback(x, y);
			// Remove the callback reference so it doesn't get called again.
			Component._focusReleaseCallback = undefined;
			// Make everything selectable.
			document.body.classList.remove('no-select');
		}
	}

	/** The id given by the parent component. */
	private _id: string = '';

	/** The parent component. */
	private _parent: Component | undefined;

	/** The root element. */
	private _root: Element;

	/** The set of child components. */
	private _components: Set<Component> = new Set();

	/** The mapping of ids to child components. */
	private _idsToComponents: Map<string, Component> = new Map();

	/** The event handlers. */
	private _eventHandlers: Map<string, (component: Component, ...args: any) => void> = new Map();

	/** The registry entry. */
	private _registryEntry: RegistryEntry;

	/** The registered components, mapped from string to Component type. */
	private static _registry: Map<string, RegistryEntry> = new Map();

	/** True if the window focus release has been added. */
	private static _windowFocusReleaseAdded: boolean = false;

	/** The current focus release callback. */
	private static _focusReleaseCallback: ((x: number, y: number) => void) | undefined;

	/** The HTML that goes with the component. */
	public static html = '';

	/** The CSS that goes with the component. */
	public static css = '';
}

Component.css = /*css*/`
	* {
		box-sizing: border-box;
	}

	.vertical-align {
		display: flex;
		justify-content: center;
		flex-direction: column;
	}

	.no-select {
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}
	`;

export namespace Component {
	/** The params of an element that will become a component. */
	export class Params {
		/** The parent component. */
		public parent: Component | undefined;

		/** The id of the component, if it has one. */
		public id = '';

		/** The classes of the component, if it has any. */
		public classes: string[] = [];

		/** The attributes passed as if it were <Component attrib=''...>. All of the keys are lower case. */
		public attributes: Map<string, string> = new Map();

		/** The event handlers passed as if it were <Component onevent=''...>. All of the keys are lower case, without the 'on' part. The component param is the one that called the event handler. */
		public eventHandlers: Map<string, (component: Component, ...args: any) => void> = new Map();

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

	/** The ancestor registry entries, including ComponentType at 0 and Component as the last. */
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
