# 🚀 Building a MonacoInput View Pane in VS Code: Complete Tutorial

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture Understanding](#architecture-understanding)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Advanced Features](#advanced-features)
6. [Testing & Debugging](#testing--debugging)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This tutorial will guide you through creating a **MonacoInput** feature in VS Code - a custom view pane that provides a Monaco editor with Python execution capabilities. By the end of this tutorial, you'll have:

- ✅ A custom view pane in the auxiliary sidebar
- ✅ Monaco editor with Python syntax highlighting
- ✅ Python code execution via terminal integration
- ✅ Custom toolbar with run, clear, and save buttons
- ✅ Proper VS Code theming and styling
- ✅ Full integration with VS Code's service architecture

### What You'll Build

```
┌─ Auxiliary Sidebar ─────────────────┐
│ 📝 Monaco Input                     │
├─────────────────────────────────────┤
│ [🐍 Run Python] [🗑️ Clear] [💾 Save] │
├─────────────────────────────────────┤
│ # Type your Python code here       │
│ print("Hello from Python!")        │
│                                     │
│ [Monaco Editor with Python syntax] │
│                                     │
└─────────────────────────────────────┘
```

---

## Prerequisites

### Technical Requirements

- 📚 **TypeScript**: Advanced knowledge required
- 🏗️ **VS Code Architecture**: Understanding of services, dependency injection
- 🎨 **CSS**: For custom styling
- 🐍 **Python**: Basic knowledge for testing
- 🛠️ **Node.js**: For building and development

### VS Code Development Setup

```bash
# Clone VS Code source
git clone https://github.com/microsoft/vscode.git
cd vscode

# Install dependencies
npm install

# Start development build
npm run watch
```

### Required VS Code Concepts

- **Services & Dependency Injection**: How VS Code's service architecture works
- **View Panes**: Understanding `ViewPane` and `ViewPaneContainer`
- **Contributions**: How to register new UI components
- **Monaco Editor**: The core editor component
- **Commands & Actions**: VS Code's command system

---

## Architecture Understanding

### VS Code's Service Architecture

VS Code uses a **dependency injection** system where services are injected into constructors:

```typescript
constructor(
    @IKeybindingService keybindingService: IKeybindingService,
    @IContextMenuService contextMenuService: IContextMenuService,
    // ... more services
) {
    // Services are automatically injected
}
```

### View System Hierarchy

```
Registry
├── ViewContainersRegistry
│   └── ViewContainer (Auxiliary Bar)
└── ViewsRegistry
    └── ViewPane (MonacoInput)
        ├── Toolbar
        ├── Monaco Editor
        └── Actions
```

### Key Components We'll Build

1. **MonacoInputViewPane**: Main view pane class
2. **Contribution File**: Registers the view with VS Code
3. **CSS Styling**: Custom styles for our component
4. **Actions**: Clear and Save functionality

---

## Step-by-Step Implementation

### Step 1: Project Structure Setup

Create the following directory structure:

```
src/vs/workbench/contrib/monacoInput/
├── browser/
│   ├── monacoInputView.ts          # Main view pane
│   ├── monacoInput.contribution.ts # Registration
│   └── media/
│       └── monacoInput.css         # Styles
```

### Step 2: Create the Main View Pane

**File: `monacoInputView.ts`**

```typescript
import * as dom from "../../../../base/browser/dom.js";
import { CodeEditorWidget } from "../../../../editor/browser/widget/codeEditor/codeEditorWidget.js";
import { ICodeEditor } from "../../../../editor/browser/editorBrowser.js";
import { IEditorOptions } from "../../../../editor/common/config/editorOptions.js";
import { ITextModel } from "../../../../editor/common/model.js";
import { ILanguageService } from "../../../../editor/common/languages/language.js";
import { IModelService } from "../../../../editor/common/services/model.js";
import * as nls from "../../../../nls.js";
import { IKeybindingService } from "../../../../platform/keybinding/common/keybinding.js";
import { IContextMenuService } from "../../../../platform/contextview/browser/contextView.js";
import { IConfigurationService } from "../../../../platform/configuration/common/configuration.js";
import { IContextKeyService } from "../../../../platform/contextkey/common/contextkey.js";
import { IInstantiationService } from "../../../../platform/instantiation/common/instantiation.js";
import { IOpenerService } from "../../../../platform/opener/common/opener.js";
import { IThemeService } from "../../../../platform/theme/common/themeService.js";
import {
	IViewPaneOptions,
	ViewPane,
} from "../../../browser/parts/views/viewPane.js";
import { IViewDescriptorService } from "../../../common/views.js";
import { IHoverService } from "../../../../platform/hover/browser/hover.js";
import { URI } from "../../../../base/common/uri.js";
import { ICommandService } from "../../../../platform/commands/common/commands.js";

export class MonacoInputViewPane extends ViewPane {
	static readonly ID = "workbench.views.monacoInput";
	static readonly TITLE = nls.localize("monacoInput", "Monaco Input");

	private _editor: ICodeEditor | undefined;
	private _editorContainer: HTMLElement | undefined;
	private _textModel: ITextModel | undefined;

	constructor(
		options: IViewPaneOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService
		protected override readonly contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService
		protected override readonly instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@IHoverService hoverService: IHoverService,
		@IModelService private readonly modelService: IModelService,
		@ILanguageService private readonly languageService: ILanguageService,
		@ICommandService private readonly commandService: ICommandService
	) {
		super(
			options,
			keybindingService,
			contextMenuService,
			configurationService,
			contextKeyService,
			viewDescriptorService,
			instantiationService,
			openerService,
			themeService,
			hoverService
		);
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);

		// Create toolbar with run button
		const toolbar = dom.$(".monaco-input-toolbar");
		const runButton = dom.$("button.monaco-button.primary", {
			type: "button",
			title: "Run Python Code",
		});
		runButton.textContent = "🐍 Run Python";
		toolbar.appendChild(runButton);

		// Create editor container
		this._editorContainer = dom.$(".monaco-input-container");

		container.appendChild(toolbar);
		container.appendChild(this._editorContainer);

		this.createEditor();

		// Run button click handler
		this._register(
			dom.addDisposableListener(runButton, "click", () => {
				this.runPython();
			})
		);
	}

	private createEditor(): void {
		if (!this._editorContainer) {
			return;
		}

		// Create Python text model
		this._textModel = this.modelService.createModel(
			'# Type your Python code here\nprint("Hello from Python!")\n',
			this.languageService.createById("python"),
			URI.from({ scheme: "inmemory", path: "/monaco-python.py" })
		);

		// Configure editor options
		const editorOptions: IEditorOptions = {
			minimap: { enabled: false },
			lineNumbers: "on",
			wordWrap: "on",
			fontSize: 14,
			scrollBeyondLastLine: false,
			automaticLayout: true,
		};

		// Create Monaco editor instance
		this._editor = this.instantiationService.createInstance(
			CodeEditorWidget,
			this._editorContainer,
			editorOptions,
			{ isSimpleWidget: false, contributions: [] }
		);

		this._editor.setModel(this._textModel);
		this._register(this._editor);
		this._register(this._textModel);
	}

	private runPython(): void {
		const code = this._editor?.getValue() || "";
		if (!code.trim()) {
			return;
		}

		// Create a unique temp file name
		const tempFileName = `vscode_monaco_${Date.now()}.py`;
		const tempFilePath = `/tmp/${tempFileName}`;

		// Create terminal and execute the script
		this.commandService.executeCommand("workbench.action.terminal.new");

		// Execute Python code cleanly
		setTimeout(() => {
			const cleanCommand = `clear; cat > ${tempFilePath} << 'EOF' 2>/dev/null\n${code}\nEOF\necho "🐍 Running Python..."\npython3 ${tempFilePath} 2>&1\nrm ${tempFilePath} 2>/dev/null`;

			this.commandService.executeCommand(
				"workbench.action.terminal.sendSequence",
				{
					text: cleanCommand + "\n",
				}
			);
		}, 150);
	}

	// Public API methods
	public getValue(): string {
		return this._editor?.getValue() || "";
	}

	public setValue(value: string): void {
		this._editor?.setValue(value);
	}

	public clearContent(): void {
		this._editor?.setValue(
			'# Type your Python code here\nprint("Hello from Python!")\n'
		);
		this._editor?.focus();
	}

	override focus(): void {
		super.focus();
		this._editor?.focus();
	}

	override setVisible(visible: boolean): void {
		super.setVisible(visible);
		if (visible) {
			this._editor?.layout();
		}
	}
}
```

### Step 3: Create the Contribution File

**File: `monacoInput.contribution.ts`**

```typescript
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import "./media/monacoInput.css";
import * as nls from "../../../../nls.js";
import { Registry } from "../../../../platform/registry/common/platform.js";
import {
	Extensions as ViewExtensions,
	IViewsRegistry,
} from "../../../common/views.js";
import { MonacoInputViewPane } from "./monacoInputView.js";
import { SyncDescriptor } from "../../../../platform/instantiation/common/descriptors.js";
import { ViewPaneContainer } from "../../../browser/parts/views/viewPaneContainer.js";
import {
	Extensions as ViewContainerExtensions,
	IViewContainersRegistry,
	ViewContainerLocation,
} from "../../../common/views.js";
import { Codicon } from "../../../../base/common/codicons.js";
import {
	Action2,
	MenuId,
	registerAction2,
} from "../../../../platform/actions/common/actions.js";
import { ContextKeyExpr } from "../../../../platform/contextkey/common/contextkey.js";
import { ServicesAccessor } from "../../../../platform/instantiation/common/instantiation.js";
import { IViewsService } from "../../../services/views/common/viewsService.js";

// Register the view container for auxiliary bar
const VIEW_CONTAINER_ID = "workbench.view.monacoInputContainer";

const viewsRegistry = Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry);
const viewContainerRegistry = Registry.as<IViewContainersRegistry>(
	ViewContainerExtensions.ViewContainersRegistry
);

// Register view container in auxiliary bar (secondary sidebar)
const viewContainer = viewContainerRegistry.registerViewContainer(
	{
		id: VIEW_CONTAINER_ID,
		title: {
			value: nls.localize("monacoInputContainer", "Monaco Input"),
			original: "Monaco Input",
		},
		ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [
			VIEW_CONTAINER_ID,
			{ mergeViewWithContainerWhenSingleView: true },
		]),
		hideIfEmpty: true,
		icon: Codicon.edit,
		order: 5,
	},
	ViewContainerLocation.AuxiliaryBar
);

// Register the view in the container
viewsRegistry.registerViews(
	[
		{
			id: MonacoInputViewPane.ID,
			name: { value: MonacoInputViewPane.TITLE, original: "Monaco Input" },
			ctorDescriptor: new SyncDescriptor(MonacoInputViewPane),
			canToggleVisibility: true,
			canMoveView: true,
			containerIcon: Codicon.edit,
			order: 100,
			when: undefined,
		},
	],
	viewContainer
);

// Register Clear Action
registerAction2(
	class ClearMonacoInputAction extends Action2 {
		constructor() {
			super({
				id: "monacoInput.clear",
				title: {
					value: nls.localize("monacoInput.clear", "Clear Input"),
					original: "Clear Input",
				},
				icon: Codicon.clearAll,
				menu: {
					id: MenuId.ViewTitle,
					when: ContextKeyExpr.equals("view", MonacoInputViewPane.ID),
					group: "navigation",
					order: 1,
				},
			});
		}

		async run(accessor: ServicesAccessor): Promise<void> {
			const viewsService = accessor.get(IViewsService);
			const view = viewsService.getActiveViewWithId(
				MonacoInputViewPane.ID
			) as MonacoInputViewPane | null;

			if (view) {
				view.clearContent();
			}
		}
	}
);

// Register Save Action
registerAction2(
	class SaveMonacoInputAction extends Action2 {
		constructor() {
			super({
				id: "monacoInput.save",
				title: {
					value: nls.localize("monacoInput.save", "Save Content"),
					original: "Save Content",
				},
				icon: Codicon.save,
				menu: {
					id: MenuId.ViewTitle,
					when: ContextKeyExpr.equals("view", MonacoInputViewPane.ID),
					group: "navigation",
					order: 2,
				},
			});
		}

		async run(accessor: ServicesAccessor): Promise<void> {
			const viewsService = accessor.get(IViewsService);
			const view = viewsService.getActiveViewWithId(
				MonacoInputViewPane.ID
			) as MonacoInputViewPane | null;

			if (view) {
				const content = view.getValue();
				// Implement save logic here
				console.log("Saving content:", content);
			}
		}
	}
);
```

### Step 4: Create CSS Styling

**File: `media/monacoInput.css`**

```css
.monaco-input-toolbar {
	padding: 8px;
	border-bottom: 1px solid var(--vscode-input-border);
	background: var(--vscode-editor-background);
}

.monaco-input-toolbar .monaco-button {
	background: var(--vscode-button-background);
	color: var(--vscode-button-foreground);
	border: 1px solid var(--vscode-button-border, transparent);
	padding: 6px 12px;
	border-radius: 3px;
	font-size: 13px;
	cursor: pointer;
	transition: background-color 0.2s ease;
}

.monaco-input-toolbar .monaco-button:hover {
	background: var(--vscode-button-hoverBackground);
}

.monaco-input-toolbar .monaco-button.primary {
	background: var(--vscode-button-background);
	color: var(--vscode-button-foreground);
}

.monaco-input-toolbar .monaco-button.primary:hover {
	background: var(--vscode-button-hoverBackground);
}

.monaco-input-container {
	flex: 1;
	min-height: 300px;
	border: 1px solid var(--vscode-input-border);
	border-radius: 4px;
	margin: 8px;
	overflow: hidden;
}

/* Custom scrollbar for editor */
.monaco-input-container .monaco-scrollable-element > .scrollbar {
	background: var(--vscode-scrollbar-shadow);
}

.monaco-input-container .monaco-scrollable-element > .scrollbar > .slider {
	background: var(--vscode-scrollbarSlider-background);
}

.monaco-input-container
	.monaco-scrollable-element
	> .scrollbar
	> .slider:hover {
	background: var(--vscode-scrollbarSlider-hoverBackground);
}

.monaco-input-container
	.monaco-scrollable-element
	> .scrollbar
	> .slider.active {
	background: var(--vscode-scrollbarSlider-activeBackground);
}
```

---

## Advanced Features

### 1. Enhanced Python Execution

Add support for different Python environments:

```typescript
private async runPython(): Promise<void> {
    const code = this._editor?.getValue() || '';
    if (!code.trim()) {
        return;
    }

    // Detect Python interpreter
    const pythonCommands = ['python3', 'python', 'py'];
    let pythonCmd = 'python3';

    for (const cmd of pythonCommands) {
        try {
            // Check if command exists
            const result = await this.commandService.executeCommand('workbench.action.terminal.sendSequence', {
                text: `which ${cmd} && echo "found" || echo "not found"\n`
            });
            // You would need to implement proper detection logic here
            break;
        } catch {
            continue;
        }
    }

    // Enhanced execution with better error handling
    const tempFileName = `vscode_monaco_${Date.now()}.py`;
    const tempFilePath = `/tmp/${tempFileName}`;

    this.commandService.executeCommand('workbench.action.terminal.new');

    setTimeout(() => {
        const enhancedCommand = `
clear
echo "🐍 Preparing Python execution..."
cat > ${tempFilePath} << 'EOF'
${code}
EOF

echo "🚀 Running Python code..."
echo "─────────────────────────"
${pythonCmd} ${tempFilePath} 2>&1
exit_code=$?
echo "─────────────────────────"
if [ $exit_code -eq 0 ]; then
    echo "✅ Execution completed successfully"
else
    echo "❌ Execution failed with exit code: $exit_code"
fi
rm ${tempFilePath} 2>/dev/null
        `.trim();

        this.commandService.executeCommand('workbench.action.terminal.sendSequence', {
            text: enhancedCommand + '\n'
        });
    }, 150);
}
```

### 2. Code Templates and Snippets

Add a template system:

```typescript
private readonly codeTemplates = {
    'hello': '# Hello World\nprint("Hello, World!")\n',
    'web': '# Simple web request\nimport requests\nresponse = requests.get("https://api.github.com")\nprint(response.status_code)\n',
    'data': '# Data analysis\nimport pandas as pd\nimport numpy as np\n\n# Create sample data\ndf = pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})\nprint(df.head())\n',
    'ml': '# Machine Learning\nfrom sklearn.datasets import load_iris\nfrom sklearn.model_selection import train_test_split\n\niris = load_iris()\nX_train, X_test, y_train, y_test = train_test_split(iris.data, iris.target)\nprint(f"Training set size: {len(X_train)}")\n'
};

private createTemplateDropdown(): void {
    const toolbar = this.element.querySelector('.monaco-input-toolbar');
    if (!toolbar) return;

    const dropdown = dom.$('select.template-dropdown');
    dropdown.innerHTML = '<option value="">Select Template...</option>';

    Object.keys(this.codeTemplates).forEach(key => {
        const option = dom.$('option', { value: key });
        option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
        dropdown.appendChild(option);
    });

    this._register(dom.addDisposableListener(dropdown, 'change', (e) => {
        const template = (e.target as HTMLSelectElement).value;
        if (template && this.codeTemplates[template]) {
            this._editor?.setValue(this.codeTemplates[template]);
            this._editor?.focus();
            (e.target as HTMLSelectElement).value = '';
        }
    }));

    toolbar.appendChild(dropdown);
}
```

### 3. Syntax Error Detection

Add real-time syntax validation:

```typescript
import { IMarkerService } from '../../../../platform/markers/common/markers.js';

private validatePythonSyntax(): void {
    const code = this._editor?.getValue() || '';

    // Simple Python syntax validation
    const lines = code.split('\n');
    const markers: any[] = [];

    lines.forEach((line, index) => {
        // Check for common syntax errors
        if (line.trim().endsWith(':')) {
            const nextLine = lines[index + 1];
            if (nextLine && !nextLine.startsWith('    ') && nextLine.trim() !== '') {
                markers.push({
                    severity: 8, // Error
                    startLineNumber: index + 2,
                    startColumn: 1,
                    endLineNumber: index + 2,
                    endColumn: nextLine.length + 1,
                    message: 'Expected an indented block'
                });
            }
        }

        // Check for mismatched parentheses
        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            markers.push({
                severity: 4, // Warning
                startLineNumber: index + 1,
                startColumn: 1,
                endLineNumber: index + 1,
                endColumn: line.length + 1,
                message: 'Mismatched parentheses'
            });
        }
    });

    // Set markers on the model
    if (this._textModel) {
        this.markerService.changeOne('python-syntax', this._textModel.uri, markers);
    }
}
```

### 4. Output Capture and Display

Create a split view with output panel:

```typescript
private createSplitView(): void {
    // Create split container
    const splitContainer = dom.$('.monaco-input-split');

    // Editor section
    const editorSection = dom.$('.monaco-input-editor-section');
    this._editorContainer = dom.$('.monaco-input-container');
    editorSection.appendChild(this._editorContainer);

    // Output section
    const outputSection = dom.$('.monaco-input-output-section');
    const outputHeader = dom.$('.output-header');
    outputHeader.textContent = '📤 Output';
    const outputContainer = dom.$('.output-container');

    outputSection.appendChild(outputHeader);
    outputSection.appendChild(outputContainer);

    splitContainer.appendChild(editorSection);
    splitContainer.appendChild(outputSection);

    this.element.appendChild(splitContainer);
}
```

---

## Testing & Debugging

### 1. Unit Testing

Create test files for your view pane:

```typescript
// test/monacoInputView.test.ts
import { MonacoInputViewPane } from "../browser/monacoInputView.js";
import { TestInstantiationService } from "../../test/browser/workbenchTestServices.js";

suite("MonacoInputViewPane", () => {
	let instantiationService: TestInstantiationService;
	let viewPane: MonacoInputViewPane;

	setup(() => {
		instantiationService = new TestInstantiationService();
		viewPane = instantiationService.createInstance(MonacoInputViewPane, {});
	});

	test("should create editor with Python model", () => {
		// Test editor creation
		assert.ok(viewPane);
	});

	test("should execute Python code", async () => {
		// Test Python execution
		viewPane.setValue('print("test")');
		const value = viewPane.getValue();
		assert.strictEqual(value, 'print("test")');
	});
});
```

### 2. Development Workflow

```bash
# Start VS Code in development mode
npm run watch

# Open new VS Code window with your extension
code --extensionDevelopmentPath=. --new-window

# Enable auxiliary bar and check for Monaco Input
```

### 3. Debugging Tips

1. **Use Browser DevTools**: Open Help > Toggle Developer Tools
2. **Console Logging**: Add strategic console.log statements
3. **Breakpoints**: Set breakpoints in TypeScript files
4. **Service Dependencies**: Verify all required services are available

---

## Best Practices

### 1. Service Architecture

- **Always use dependency injection** for services
- **Register disposables** to prevent memory leaks
- **Use proper typing** for all VS Code interfaces

### 2. Performance Optimization

```typescript
// Lazy loading of editor
private _editorPromise: Promise<ICodeEditor> | undefined;

private async getEditor(): Promise<ICodeEditor> {
    if (!this._editorPromise) {
        this._editorPromise = this.createEditorAsync();
    }
    return this._editorPromise;
}

private async createEditorAsync(): Promise<ICodeEditor> {
    // Async editor creation
    return new Promise((resolve) => {
        setTimeout(() => {
            this.createEditor();
            resolve(this._editor!);
        }, 0);
    });
}
```

### 3. Error Handling

```typescript
private async runPython(): Promise<void> {
    try {
        const code = this._editor?.getValue() || '';
        if (!code.trim()) {
            this.showInfo('No code to execute');
            return;
        }

        await this.executePythonCode(code);
    } catch (error) {
        this.showError(`Execution failed: ${error.message}`);
    }
}

private showError(message: string): void {
    this.commandService.executeCommand('workbench.action.showErrorMessage', message);
}

private showInfo(message: string): void {
    this.commandService.executeCommand('workbench.action.showInformationMessage', message);
}
```

### 4. Accessibility

```typescript
// Add proper ARIA labels
private createEditor(): void {
    if (!this._editorContainer) return;

    // Set accessibility properties
    this._editorContainer.setAttribute('role', 'textbox');
    this._editorContainer.setAttribute('aria-label', 'Python code editor');
    this._editorContainer.setAttribute('aria-multiline', 'true');

    // Create editor with accessibility options
    const editorOptions: IEditorOptions = {
        // ... other options
        accessibilitySupport: 'on',
        ariaLabel: 'Python code editor'
    };
}
```

---

## Troubleshooting

### Common Issues

#### 1. View Not Appearing

```typescript
// Check if view container is registered correctly
const viewContainer = viewContainerRegistry.getViewContainer(VIEW_CONTAINER_ID);
if (!viewContainer) {
	console.error("View container not registered");
}
```

#### 2. Editor Not Loading

```typescript
// Verify model service is available
if (!this.modelService) {
	console.error("Model service not available");
	return;
}

// Check if language service can create Python language
const pythonLanguage = this.languageService.createById("python");
if (!pythonLanguage) {
	console.error("Python language not available");
}
```

#### 3. Python Execution Fails

```bash
# Check Python availability
which python3
python3 --version

# Verify terminal access
echo $SHELL
```

#### 4. Styling Issues

```css
/* Debug container styles */
.monaco-input-container {
	border: 2px solid red !important; /* Temporary debug border */
	min-height: 300px;
	background: yellow !important; /* Temporary debug background */
}
```

### Debug Commands

```typescript
// Add debug commands for development
registerAction2(
	class DebugMonacoInputAction extends Action2 {
		constructor() {
			super({
				id: "monacoInput.debug",
				title: "Debug Monaco Input",
				category: "Developer",
			});
		}

		async run(accessor: ServicesAccessor): Promise<void> {
			const viewsService = accessor.get(IViewsService);
			const view = viewsService.getActiveViewWithId(MonacoInputViewPane.ID);

			console.log("Monaco Input Debug Info:", {
				view: !!view,
				editor: !!(view as any)?._editor,
				model: !!(view as any)?._textModel,
				container: !!(view as any)?._editorContainer,
			});
		}
	}
);
```

---

## Conclusion

Congratulations! 🎉 You've successfully built a fully-featured MonacoInput view pane for VS Code. This tutorial covered:

- ✅ **Core Architecture**: Understanding VS Code's service system
- ✅ **View Registration**: Proper integration with VS Code's UI
- ✅ **Monaco Integration**: Embedding the Monaco editor
- ✅ **Python Execution**: Terminal integration for code execution
- ✅ **Custom Actions**: Clear and save functionality
- ✅ **Styling**: VS Code-compliant theming
- ✅ **Advanced Features**: Templates, validation, and more
- ✅ **Testing**: Proper testing strategies
- ✅ **Best Practices**: Performance and accessibility

### Next Steps

1. **Extend Language Support**: Add support for JavaScript, TypeScript, etc.
2. **Add More Templates**: Create a rich template library
3. **Implement File Operations**: Save/load from filesystem
4. **Add Collaborative Features**: Real-time sharing capabilities
5. **Create Extension Package**: Package as a VS Code extension

### Resources

- 📚 [VS Code Extension API](https://code.visualstudio.com/api)
- 🏗️ [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- 🔧 [VS Code Source Code](https://github.com/microsoft/vscode)
- 🎨 [VS Code Design Guidelines](https://code.visualstudio.com/api/ux-guidelines/overview)

Happy coding! 🚀✨
