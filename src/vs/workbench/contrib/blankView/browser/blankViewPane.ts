/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../../nls.js';
import * as DOM from '../../../../base/browser/dom.js';

import { ViewPane, IViewPaneOptions } from '../../../browser/parts/views/viewPane.js';
import { IActionViewItemOptions } from '../../../../base/browser/ui/actionbar/actionViewItems.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';

// خدمات لازمة لِـ ViewPane (حقن تبعي)
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
// هذا اختياري (بعض الفروع قد تختلف مساره):
import { IAccessibleViewInformationService } from '../../../services/accessibility/common/accessibleViewInformationService.js';
export class BlankViewPane extends ViewPane {
	constructor(
		options: IViewPaneOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@IHoverService hoverService: IHoverService,
		@IAccessibleViewInformationService accessibleViewInformationService?: IAccessibleViewInformationService
	) {
		super(
			{
				...options,
				titleMenuId: undefined,
				expanded: true,
			},
			keybindingService,
			contextMenuService,
			configurationService,
			contextKeyService,
			viewDescriptorService,
			instantiationService,
			openerService,
			themeService,
			hoverService,
			accessibleViewInformationService
		);
	}
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
