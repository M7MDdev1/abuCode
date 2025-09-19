/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/monacoInput.css';
import * as nls from '../../../../nls.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { Extensions as ViewExtensions, IViewsRegistry } from '../../../common/views.js';
import { MonacoInputViewPane } from './monacoInputView.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { ViewPaneContainer } from '../../../browser/parts/views/viewPaneContainer.js';
import { Extensions as ViewContainerExtensions, IViewContainersRegistry, ViewContainerLocation } from '../../../common/views.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { Action2, MenuId, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { ContextKeyExpr } from '../../../../platform/contextkey/common/contextkey.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';

// Register the view container for auxiliary bar
const VIEW_CONTAINER_ID = 'workbench.view.monacoInputContainer';

const viewsRegistry = Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry);
const viewContainerRegistry = Registry.as<IViewContainersRegistry>(ViewContainerExtensions.ViewContainersRegistry);

// Register view container in auxiliary bar (secondary sidebar)
const viewContainer = viewContainerRegistry.registerViewContainer({
	id: VIEW_CONTAINER_ID,
	title: { value: nls.localize('monacoInputContainer', "Monaco Input"), original: 'Monaco Input' },
	ctorDescriptor: new SyncDescriptor(
		ViewPaneContainer,
		[VIEW_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true }]
	),
	hideIfEmpty: true,
	icon: Codicon.edit,
	order: 5
}, ViewContainerLocation.AuxiliaryBar);

// Register the view in the container
viewsRegistry.registerViews([{
	id: MonacoInputViewPane.ID,
	name: { value: MonacoInputViewPane.TITLE, original: 'Monaco Input' },
	ctorDescriptor: new SyncDescriptor(MonacoInputViewPane),
	canToggleVisibility: true,
	canMoveView: true,
	containerIcon: Codicon.edit,
	order: 100,
	when: undefined
}], viewContainer);

// Register button commands
registerAction2(class ClearMonacoInputAction extends Action2 {
	constructor() {
		super({
			id: 'monacoInput.clear',
			title: { value: nls.localize('monacoInput.clear', "Clear Input"), original: 'Clear Input' },
			icon: Codicon.clearAll,
			menu: {
				id: MenuId.ViewTitle,
				when: ContextKeyExpr.equals('view', MonacoInputViewPane.ID),
				group: 'navigation',
				order: 1
			}
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const viewsService = accessor.get(IViewsService);
		const view = viewsService.getActiveViewWithId(MonacoInputViewPane.ID) as MonacoInputViewPane | null;

		if (view) {
			view.clearContent();
		}
	}
});

registerAction2(class SaveMonacoInputAction extends Action2 {
	constructor() {
		super({
			id: 'monacoInput.save',
			title: { value: nls.localize('monacoInput.save', "Save Content"), original: 'Save Content' },
			icon: Codicon.save,
			menu: {
				id: MenuId.ViewTitle,
				when: ContextKeyExpr.equals('view', MonacoInputViewPane.ID),
				group: 'navigation',
				order: 2
			}
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const viewsService = accessor.get(IViewsService);
		const view = viewsService.getActiveViewWithId(MonacoInputViewPane.ID) as MonacoInputViewPane | null;

		if (view) {
			const content = view.getValue();
			// Here you would implement save logic
			console.log('Saving content:', content);
		}
	}
});
