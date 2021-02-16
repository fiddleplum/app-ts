import { Component } from '../component';

export abstract class AbstractButton extends Component {
	constructor(params: Component.Params) {
		super(params);

		// Get the user press callback.
		if (params.attributes.has('onpress')) {
			const value = params.attributes.get('onpress');
			if (typeof value !== 'function') {
				throw new Error('onpress must be a function.');
			}
			this._onPressCallback = value as () => void;
		}

		// Get the user release callback.
		if (params.attributes.has('onrelease')) {
			const value = params.attributes.get('onrelease');
			if (typeof value !== 'function') {
				throw new Error('onrelease must be a function.');
			}
			this._onReleaseCallback = value as () => void;
		}

		// Get the user hover callback.
		if (params.attributes.has('onhover')) {
			const value = params.attributes.get('onhover');
			if (typeof value !== 'function') {
				throw new Error('onhover must be a function.');
			}
			this._onHoverCallback = value as () => void;
		}
	}

	/** The event callback for when the mousemove happens. */
	private _mouseMove(event: MouseEvent): void {
		const root = this.element('root', HTMLDivElement);
		root.classList.add('hovered');
		const rect = root.getBoundingClientRect();
		this._onHoverCallback(event.clientX - rect.left, event.clientY - rect.top);
	}

	/** The event callback for when the mouseout happens. */
	private _mouseOut(): void {
		const root = this.element('root', HTMLDivElement);
		root.classList.remove('hovered');
		this._onHoverCallback(Number.NaN, Number.NaN);
	}

	/** Returns true if the coordinates are over the button. */
	protected _isOver(x: number, y: number): boolean {
		const root = this.element('root', HTMLDivElement);
		const rect = root.getBoundingClientRect();
		return rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom;
	}

	/** The event callback for when the mousedown or touchstart happens. */
	protected abstract _mouseTouchDown(): void;

	/** The user press callback. */
	protected _onPressCallback: () => void = () => {};

	/** The user release callback. */
	protected _onReleaseCallback: () => void = () => {};

	/** The user hover callback. */
	protected _onHoverCallback: (x: number, y: number) => void = () => {};
}

AbstractButton.html = /* html */`<div id="root" onmousedown="{$_mouseTouchDown$}" ontouchstart="{$_mouseTouchDown$}" onmousemove="{$_mouseMove$}" onmouseout="{$_mouseOut$}"></div>`;

AbstractButton.register();
