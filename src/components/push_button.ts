import { AbstractButton } from './abstract_button';

export class PushButton extends AbstractButton {
	/** The event callback for when the mousedown or touchstart happens. */
	protected _mouseTouchDown(): void {
		// Add the pressed class.
		this.element('root', HTMLDivElement).classList.add('pressed');
		// Set the callback for when mouseup or touchend happens.
		this.setFocusReleaseCallback(() => {
			// Remove the pressed class.
			this.element('root', HTMLDivElement).classList.remove('pressed');
			// Call the user release callback.
			this._releaseEventHandler(this);
		});
		// Call the user press callback.
		this._pressEventHandler(this);
	}
}

PushButton.register();
