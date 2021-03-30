interface ElementWithStyle extends Element {
	style: CSSStyleDeclaration;
}

/** A module for showing and hiding elements on a page. Since it uses dynamic styles, you must use the inline style "display: none", and not classes. */
export class ShowHide {
	/** Shows an element in an animated way over the duration. The element must be a block display style. */
	static async show(element: ElementWithStyle, durationInSeconds = 0.125): Promise<void> {
		const fps = 30.0;
		if (element.style.display === 'none') {
			element.style.opacity = '0';
			element.style.display = '';
			element.setAttribute('showing', '1');
			return new Promise((resolve) => {
				const timer = setInterval((elem: ElementWithStyle) => {
					let u = Number.parseFloat(elem.style.opacity);
					u += 1.0 / (durationInSeconds * fps);
					u = Math.min(u, 1.0);
					elem.style.opacity = '' + u;
					if (u >= 1.0) {
						clearInterval(timer);
						elem.removeAttribute('showing');
						resolve();
					}
				}, 1000.0 / fps, element);
			});
		}
		else {
			return Promise.resolve();
		}
	}

	/** Hides an element in an animated way over the duration. The element must be a block display style. */
	static async hide(element: ElementWithStyle, durationInSeconds = 0.125): Promise<void> {
		const fps = 30.0;
		if (element.style.display !== 'none') {
			element.style.opacity = '1';
			element.setAttribute('hiding', '1');
			return new Promise((resolve) => {
				const timer = setInterval((elem: HTMLElement) => {
					let u = Number.parseFloat(elem.style.opacity);
					u -= 1.0 / (durationInSeconds * fps);
					u = Math.max(u, 0.0);
					elem.style.opacity = '' + u;
					if (u <= 0.0) {
						elem.style.display = 'none';
						clearInterval(timer);
						elem.removeAttribute('hiding');
						resolve();
					}
				}, 1000.0 / fps, element);
			});
		}
		else {
			return Promise.resolve();
		}
	}

	/** Toggles an element in an animated way over the duration. The element must be a block display style. */
	static async toggle(element: ElementWithStyle, durationInSeconds = 0.125): Promise<void> {
		if (this.isShown(element)) {
			return this.hide(element, durationInSeconds);
		}
		else {
			return this.show(element, durationInSeconds);
		}
	}

	/** Returns true if this is shown or showing. */
	static isShown(element: ElementWithStyle): boolean {
		return element.style.display !== 'none';
	}

	/** Returns true if this is hidden or hiding. */
	static isHidden(element: ElementWithStyle): boolean {
		return !this.isShown(element);
	}
}
