import { Component } from '../component';
import { AbstractButton } from './abstract_button';

export class ShotButton extends AbstractButton {
	constructor(params: Component.Params) {
		super(params);

		// Get the user press callback.
		const shotTimeValue = params.attributes.get('shottime');
		if (shotTimeValue !== undefined) {
			this._shotTime = Number.parseFloat(shotTimeValue);
			if (isNaN(this._shotTime)) {
				throw new Error('shottime is not a number-parsable string.');
			}
		}
	}

	/** The event callback for when the mousedown or touchstart happens. */
	protected _mouseTouchDown(): void {
		// Set the callback for when mouseup or touchend happens. It does nothing right now.
		this.setFocusReleaseCallback(() => {
		});
		const root = this.element('root', HTMLDivElement);
		if (root.classList.contains('pressed')) {
			// It's already pressed so do nothing until it releases.
			return;
		}
		// Add the pressed class.
		root.classList.add('pressed');
		// Call the user press callback.
		this._pressEventHandler(this);
		setTimeout(() => {
			// Remove the pressed class.
			this.element('root', HTMLDivElement).classList.remove('pressed');
			// Call the user release callback.
			this._releaseEventHandler(this);
		}, this._shotTime * 1000);
	}

	/** The shot time in seconds. */
	private _shotTime: number = 1;
}

ShotButton.register();
