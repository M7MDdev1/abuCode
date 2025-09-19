/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../../nls.js';
import * as DOM from '../../../../base/browser/dom.js';

import { ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IActionViewItemOptions } from '../../../../base/browser/ui/actionbar/actionViewItems.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';

export class BlankViewPane extends ViewPane {

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);
		const _register = this._register.bind(this);
		const disposables = new DisposableStore();
		_register(disposables);

		// مساحة فاضية + Placeholder نصي بسيط
		container.style.display = 'flex';
		container.style.alignItems = 'center';
		container.style.justifyContent = 'center';
		container.style.height = '100%';

		const placeholder = DOM.$('div');
		placeholder.textContent = localize('blankView.placeholder', 'Blank Page — put your UI here');
		placeholder.style.opacity = '0.6';
		container.appendChild(placeholder);
	}

	protected override layoutBody(height: number, width: number): void {
		// لو احتجت تتعامل مع الحجم لاحقًا
	}

	protected getActionViewItemOptions(): IActionViewItemOptions | undefined {
		return { icon: true };
	}
}
