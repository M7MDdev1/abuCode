/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { localize, localize2 } from '../../../../nls.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { ViewPaneContainer as ViewContainer } from '../../../browser/parts/views/viewPaneContainer.js';
import { ViewContainerLocation, IViewDescriptor, IViewsRegistry, IViewContainersRegistry, Extensions as ViewExtensions } from '../../../common/views.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { BlankViewPane } from './blankViewPane.js';
// 1) أيقونة للتاب (تقدر تغيّرها لاحقًا)
const blankViewIcon = registerIcon('blankView-activity-icon', Codicon.coffee, localize('blankView.icon', 'Icon for Blank View'));

// 2) إنشاء View Container جديد يظهر في الـ Activity Bar
const viewContainersRegistry = Registry.as<IViewContainersRegistry>(ViewExtensions.ViewContainersRegistry);
const blankContainer = viewContainersRegistry.registerViewContainer({
	id: 'workbench.view.blank',
	title: localize2('blankView.title', 'Blank'),              // ILocalizedString
	ctorDescriptor: new SyncDescriptor(ViewContainer),         // يحتاج الكلاس الفعلي
	icon: ThemeIcon.fromId(blankViewIcon.id),
	order: 99,
	hideIfEmpty: false
}, ViewContainerLocation.Sidebar, { doNotRegisterOpenCommand: true });
// 3) تسجيل View واحدة داخل الكونتينر
const viewsRegistry = Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry);

const blankViewDescriptor: IViewDescriptor = {
	id: 'workbench.view.blank.empty',
	name: localize2('blankView.viewName', 'Blank Page'),       // ILocalizedString
	ctorDescriptor: new SyncDescriptor(BlankViewPane, []),
	canToggleVisibility: true,
	canMoveView: true,
	order: 1,
	containerIcon: ThemeIcon.fromId(blankViewIcon.id),
	// container: blankContainer,
	openCommandActionDescriptor: {
		id: 'workbench.view.blank.focus',
		title: localize2('blankView.open', 'Open Blank Page'),   // ILocalizedString
		mnemonicTitle: localize2('blankView.open.mn', 'Open &&Blank Page').value
	}
};
viewsRegistry.registerViews([blankViewDescriptor], blankContainer);
