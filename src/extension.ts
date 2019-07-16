import * as vscode from 'vscode';
import * as tree_sitter from 'web-tree-sitter';
import * as path from 'path';
import * as coloring from './coloring';
import * as scoping from './scoping';

const decorationCache = new Map<scoping.Scope, vscode.TextEditorDecorationType>();

function decoration(scope: scoping.Scope): vscode.TextEditorDecorationType | undefined {
	if (decorationCache.has(scope)) {
		return decorationCache.get(scope);
	} else {
		const rule = scoping.find(scope);
		if (rule) {
			const decoration = createDecoration(rule);
			decorationCache.set(scope, decoration);
			return decoration;
		} else {
			return undefined;
		}
	}
}

function createDecoration(rule: scoping.Rule): vscode.TextEditorDecorationType {
	let options: vscode.DecorationRenderOptions = {};
	options.rangeBehavior = vscode.DecorationRangeBehavior.OpenOpen;
	if (rule.foreground) {
		options.color = rule.foreground;
	}
	if (rule.background) {
		options.backgroundColor = rule.background;
	}
	if (rule.fontStyle) {
		let parts: string[] = rule.fontStyle.split(' ');
		parts.forEach((part) => {
			switch (part) {
				case 'italic':
					options.fontStyle = 'italic';
					break;
				case 'bold':
					options.fontWeight = 'bold';
					break;
				case 'underline':
					options.textDecoration = 'underline';
					break;
				default:
					break;
			}
		});
	}
	return vscode.window.createTextEditorDecorationType(options);
}

async function loadStyles() {
	await scoping.load();
	for (const style of decorationCache.values()) {
		style.dispose();
	}
	decorationCache.clear();
}

const initTreeSitter = tree_sitter.init();

export function activate(context: vscode.ExtensionContext) {
	const trees: { [uri: string]: tree_sitter.Tree } = {};
	const smlLang: { module: string, color: coloring.colorFun, parser?: tree_sitter } = { module: 'tree-sitter-sml', color: coloring.colorSML, parser: undefined };

	async function open(editor: vscode.TextEditor) {
		if (editor.document.languageId !== 'sml') {
			return;
		}

		if (!smlLang.parser) {
			const wasm = path.relative(process.cwd(), path.join(context.extensionPath, "parsers", "sml.wasm"));
			const lang = await tree_sitter.Language.load(wasm);
			const parser = new tree_sitter();
			parser.setLanguage(lang);
			smlLang.parser = parser;
		}

		const tree = smlLang.parser.parse(editor.document.getText());
		trees[editor.document.uri.toString()] = tree;
		colorUri(editor.document.uri);
	}

	function edit(edit: vscode.TextDocumentChangeEvent) {
		if (edit.document.languageId !== 'sml' || !smlLang.parser) {
			return;
		}

		if (edit.contentChanges.length !== 0) {
			const old_tree = trees[edit.document.uri.toString()];
			for (const change of edit.contentChanges) {
				const startIndex = change.rangeOffset;
				const oldEndIndex = change.rangeOffset + change.rangeLength;
				const newEndIndex = change.rangeOffset + change.text.length;
				const startPos = edit.document.positionAt(startIndex);
				const oldEndPos = edit.document.positionAt(oldEndIndex);
				const newEndPos = edit.document.positionAt(newEndIndex);
				const startPosition = asPoint(startPos);
				const oldEndPosition = asPoint(oldEndPos);
				const newEndPosition = asPoint(newEndPos);
				const delta = { startIndex, oldEndIndex, newEndIndex, startPosition, oldEndPosition, newEndPosition };
				old_tree.edit(delta);
			}
			const new_tree = smlLang.parser.parse(edit.document.getText(), old_tree);
			trees[edit.document.uri.toString()] = new_tree;
		}

		colorUri(edit.document.uri);
	}

	function close(doc: vscode.TextDocument) {
		delete trees[doc.uri.toString()];
	}

	function colorUri(uri: vscode.Uri) {
		for (const editor of vscode.window.visibleTextEditors) {
			if (editor.document.uri === uri) {
				colorEditor(editor);
			}
		}
	}

	const warnedScopes = new Set<string>();

	function colorEditor(editor: vscode.TextEditor) {
		const tree = trees[editor.document.uri.toString()];
		if (!tree) {
			return;
		}
		const scopes = smlLang.color(tree.rootNode, visibleLines(editor));
		const nodes = new Map<scoping.Scope, tree_sitter.SyntaxNode[]>();
		for (const [root, scope] of scopes) {
			if (!nodes.has(scope)) {
				nodes.set(scope, []);
			}
			nodes.get(scope)!.push(root);
		}
		for (const scope of nodes.keys()) {
			const dec = decoration(scope);
			if (dec) {
				const ranges = nodes.get(scope)!.map(range);
				editor.setDecorations(dec, ranges);
			}
		}
		for (const scope of decorationCache.keys()) {
			if (!nodes.has(scope)) {
				const dec = decorationCache.get(scope)!;
				editor.setDecorations(dec, []);
			}
		}
	}

	async function colorAllOpen() {
		for (const editor of vscode.window.visibleTextEditors) {
			await open(editor);
		}
	}

	async function onChangeConfiguration(event: vscode.ConfigurationChangeEvent) {
		let colorizationNeedsReload = event.affectsConfiguration('workbench.colorTheme') || event.affectsConfiguration('editor.tokenColorCustomizations');
		if (colorizationNeedsReload) {
			await loadStyles();
			colorAllOpen();
		}
	}

	function visibleLines(editor: vscode.TextEditor) {
		return editor.visibleRanges.map(range => {
			const start = range.start.line;
			const end = range.end.line;
			return { start, end };
		});
	}

	function range(root: tree_sitter.SyntaxNode): vscode.Range {
		return new vscode.Range(root.startPosition.row, root.startPosition.column, root.endPosition.row, root.endPosition.column);
	}

	function asPoint(pos: vscode.Position): tree_sitter.Point {
		return { row: pos.line, column: pos.character };
	}

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(onChangeConfiguration));
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(edit));
	context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(close));
	context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(colorAllOpen));
	context.subscriptions.push(vscode.window.onDidChangeTextEditorVisibleRanges(change => colorEditor(change.textEditor)));

	async function activateLazily() {
		await loadStyles();
		await initTreeSitter;
		colorAllOpen();
	}
	activateLazily();
}

export function deactivate() { }