import { Component } from '../component';

export abstract class AbstractButton extends Component {
	constructor(params: Component.Params) {
		super(params);

		// Get the user press callback.
		const pressEventHandler = params.eventHandlers.get('press');
		if (pressEventHandler !== undefined) {
			this._pressEventHandler = pressEventHandler;
		}

		// Get the user release callback.
		const releaseEventHandler = params.eventHandlers.get('release');
		if (releaseEventHandler !== undefined) {
			this._releaseEventHandler = releaseEventHandler;
		}

		// Get the user hover callback.
		const hoverEventHandler = params.eventHandlers.get('hover');
		if (hoverEventHandler !== undefined) {
			this._hoverEventHandler = hoverEventHandler;
		}

		// Add the children to the button.
		for (const child of params.children) {
			this.root.appendChild(child);
		}
	}

	/** The event callback for when the mousemove happens. */
	private _mouseMove(event: MouseEvent): void {
		this.root.classList.add('hovered');
		const rect = this.root.getBoundingClientRect();
		this._hoverEventHandler(this, event.clientX - rect.left, event.clientY - rect.top);
	}

	/** The event callback for when the mouseout happens. */
	private _mouseOut(): void {
		this.root.classList.remove('hovered');
		this._hoverEventHandler(this, Number.NaN, Number.NaN);
	}

	/** Returns true if the coordinates are over the button. */
	protected _isOver(x: number, y: number): boolean {
		const rect = this.root.getBoundingClientRect();
		return rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom;
	}

	/** The event callback for when the mousedown or touchstart happens. */
	protected abstract _mouseTouchDown(): void;

	/** The user press callback. */
	protected _pressEventHandler: (button: AbstractButton) => void = () => {};

	/** The user release callback. */
	protected _releaseEventHandler: (button: AbstractButton) => void = () => {};

	/** The user hover callback. */
	protected _hoverEventHandler: (button: AbstractButton, x: number, y: number) => void = () => {};
}

AbstractButton.html = /* html */`<div onmousedown="_mouseTouchDown" ontouchstart="_mouseTouchDown" onmousemove="_mouseMove" onmouseout="_mouseOut"></div>`;

AbstractButton.css = /* css */`
	.AbstractButton {
		cursor: pointer;
	}
	`;

AbstractButton.register();
