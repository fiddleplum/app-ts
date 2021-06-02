import { Component } from '../component';

export class TextBox extends Component {
	constructor(params: Component.Params) {
		super(params);

		this._textArea = this.query('textarea', HTMLTextAreaElement)!;

		// Get the name attribute.
		const name = params.attributes.get('name');
		if (name !== undefined) {
			this._textArea.name = name;
		}

		// Get the multiLine attribute.
		const multiLine = params.attributes.get('multi-line');
		if (multiLine !== undefined && multiLine !== 'false') {
			this._multiLine = true;
			this.root.classList.add('multi-line');
		}

		// Get the autoResize attribute.
		const autoResize = params.attributes.get('auto-resize');
		if (autoResize !== undefined && autoResize !== 'false') {
			this._autoResize = true;
			this.root.classList.add('auto-resize');
		}

		// Add the children as input to the text area.
		let text = '';
		for (const child of params.children) {
			text += child.textContent ?? '';
		}
		this.setText(text);

		// Register the events.
		this.registerEvent('textchanged', params); // (..., oldText, newText)
		this.registerEvent('keydown', params); // (..., key)
		this.registerEvent('focuschanged', params); // (..., focused)
	}

	/** Gets the text. */
	getText(): string {
		return this._currentText;
	}

	/** Sets the text. */
	setText(text: string): void {
		this._textArea.value = text;
		if (this._autoResize) {
			(this.root as HTMLElement).dataset['replicatedValue'] = text;
		}
		this._currentText = text;
	}

	/** Gets the selection. */
	getSelection(): [number, number] {
		return [this._textArea.selectionStart, this._textArea.selectionEnd];
	}

	/** Sets the selection. The end is exclusive. */
	setSelection(start: number, end: number | undefined): void {
		this._textArea.selectionStart = start;
		this._textArea.selectionEnd = (end !== undefined && end > start) ? end : start;
	}

	/** Keydown event handler. */
	_onKeyDown(event: KeyboardEvent): void {
		// If the key is valid,
		if (event.key !== 'Unidentified' && event.key !== 'Dead') {
			// Trigger the keydown event.
			this.triggerEvent('keydown', event.key);
		}
	}

	/** Input event handler. */
	_onInput(): void {
		// Because Android keyboard doesn't send a proper enter keydown event,
		//   This removes the \n, sends a keydown Enter event, and re-adds the enter if it is multiLine.
		const prevSelectionStart = this._textArea.selectionStart - 1;
		if (this._textArea.value[prevSelectionStart] === '\n') {
			// Clean out the enter key as if it hasn't happened yet.
			this._textArea.value = this._textArea.value.slice(0, prevSelectionStart) + this._textArea.value.slice(prevSelectionStart + 1);
			this._textArea.selectionStart = this._textArea.selectionEnd = prevSelectionStart;
			// Trigger an enter keydown event.
			this.triggerEvent('keydown', 'Enter');
			// If multiLine, re-add the \n.
			if (this._multiLine) {
				this._textArea.value = this._textArea.value.slice(0, prevSelectionStart) + '\n' + this._textArea.value.slice(prevSelectionStart);
				this._textArea.selectionStart = this._textArea.selectionEnd = prevSelectionStart + 1;
			}
			else {
				return;
			}
		}
		// Record the new text.
		const newText = this._textArea.value;
		// If the text has indeed changed,
		if (this._currentText !== newText) {
			// Record the old text.
			const oldText = this._currentText;
			// If auto-resize, change the replicated-value attribute.
			if (this._autoResize) {
				(this.root as HTMLElement).dataset['replicatedValue'] = newText;
			}
			// Set the new text.
			this._currentText = newText;
			// Trigger the textchanged event.
			this.triggerEvent('textchanged', oldText, newText);
		}
	}

	/** Focus event handler. */
	_onFocus(): void {
		// Trigger the focuschanged event.
		this.triggerEvent('focuschanged', true);
	}

	/** Blur event handler. */
	_onBlur(): void {
		// Trigger the focuschanged event.
		this.triggerEvent('focuschanged', false);
	}

	/** The text area element. */
	private _textArea: HTMLTextAreaElement;

	/** The current text. */
	private _currentText: string = '';

	/** Flag whether or not it is multiLine. */
	private _multiLine: boolean = false;

	/** Flag whether or not it auto resizes. */
	private _autoResize: boolean = false;
}

TextBox.html = /* html */`
	<span>
		<textarea rows=1 onkeydown="_onKeyDown" oninput="_onInput" onfocus="_onFocus" onblur="_onBlur"></textarea>
	</span>
	`;

TextBox.css = /* css */`
	.TextBox.auto-resize {
		display: inline-grid;
	}
	.TextBox.auto-resize::after {
		grid-area: 1 / 1 / 2 / 2;
		content: attr(data-replicated-value) " ";
		white-space: pre-wrap;
		visibility: hidden;
		padding: 0;
		line-height: inherit;
		font-family: inherit;
		font-size: inherit;
	}
	.TextBox > textarea {
		border: 0;
		outline: 0;
		padding: 0;
		background: none;
		line-height: inherit;
		font-family: inherit;
		font-size: inherit;
	}
	.TextBox.auto-resize > textarea {
		grid-area: 1 / 1 / 2 / 2;
		margin: 0;
		width: 100%;
		resize: none;
		overflow: hidden;
	}
	`;

TextBox.register();
