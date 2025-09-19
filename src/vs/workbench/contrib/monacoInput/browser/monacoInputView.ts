import * as dom from '../../../../base/browser/dom.js';
import { CodeEditorWidget } from '../../../../editor/browser/widget/codeEditor/codeEditorWidget.js';
import { ICodeEditor } from '../../../../editor/browser/editorBrowser.js';
import { IEditorOptions } from '../../../../editor/common/config/editorOptions.js';
import { ITextModel } from '../../../../editor/common/model.js';
import { ILanguageService } from '../../../../editor/common/languages/language.js';
import { IModelService } from '../../../../editor/common/services/model.js';
import * as nls from '../../../../nls.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IViewPaneOptions, ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { URI } from '../../../../base/common/uri.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';

export class MonacoInputViewPane extends ViewPane {
	static readonly ID = 'workbench.views.monacoInput';
	static readonly TITLE = nls.localize('monacoInput', "Monaco Input");

	private _editor: ICodeEditor | undefined;
	private _editorContainer: HTMLElement | undefined;
	private _textModel: ITextModel | undefined;

	constructor(
		options: IViewPaneOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService protected override readonly contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService protected override readonly instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@IHoverService hoverService: IHoverService,
		@IModelService private readonly modelService: IModelService,
		@ILanguageService private readonly languageService: ILanguageService,
		@ICommandService private readonly commandService: ICommandService,
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);

		// Create toolbar with run button
		const toolbar = dom.$('.monaco-input-toolbar');
		const runButton = dom.$('button.monaco-button.primary', {
			type: 'button',
			title: 'Run Python Code'
		});
		runButton.textContent = '🐍 Run Python';
		toolbar.appendChild(runButton);

		// Create editor container
		this._editorContainer = dom.$('.monaco-input-container');

		container.appendChild(toolbar);
		container.appendChild(this._editorContainer);

		this.createEditor();

		// Run button click handler
		this._register(dom.addDisposableListener(runButton, 'click', () => {
			this.runPython();
		}));
	}

	private createEditor(): void {
		if (!this._editorContainer) {
			return;
		}

		// Create Python text model
		this._textModel = this.modelService.createModel(
			'# Type your Python code here\nprint("Hello from Python!")\n',
			this.languageService.createById('python'),
			URI.from({ scheme: 'inmemory', path: '/monaco-python.py' })
		);

		// Simple editor options
		const editorOptions: IEditorOptions = {
			minimap: { enabled: false },
			lineNumbers: 'on',
			wordWrap: 'on',
			fontSize: 14,
			scrollBeyondLastLine: false,
			automaticLayout: true
		};

		// Create editor
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
		const code = this._editor?.getValue() || '';
		if (!code.trim()) {
			return;
		}

		// Create a unique temp file name
		const tempFileName = `vscode_monaco_${Date.now()}.py`;
		const tempFilePath = `/tmp/${tempFileName}`;

		// Create terminal and execute the script
		this.commandService.executeCommand('workbench.action.terminal.new');

		// Hide command completely, only show clean output
		setTimeout(() => {
			// Clear screen and execute silently
			const cleanCommand = `clear; cat > ${tempFilePath} << 'EOF' 2>/dev/null\n${code}\nEOF\necho "🐍 Running Python..."\npython3 ${tempFilePath} 2>&1\nrm ${tempFilePath} 2>/dev/null`;

			this.commandService.executeCommand('workbench.action.terminal.sendSequence', {
				text: cleanCommand + '\n'
			});
		}, 150);
	}


	public getValue(): string {
		return this._editor?.getValue() || '';
	}

	public setValue(value: string): void {
		this._editor?.setValue(value);
	}

	public clearContent(): void {
		this._editor?.setValue('# Type your Python code here\nprint("Hello from Python!")\n');
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
