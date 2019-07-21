import * as vscode from 'vscode';
import * as tree_sitter from 'web-tree-sitter';
import * as path from 'path';
import * as coloring from './coloring';
import * as scoping from './scoping';
import * as formatting from './formatting';

let initTreeSitter = tree_sitter.init();
let decorationCache = new Map<scoping.Scope, vscode.TextEditorDecorationType>();

function decoration(scope: scoping.Scope): vscode.TextEditorDecorationType | undefined {
	if (decorationCache.has(scope)) {
		return decorationCache.get(scope);
	} else {
		let rule = scoping.find(scope);
		if (rule) {
			let decoration = createDecoration(rule);
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
	for (let style of decorationCache.values()) {
		style.dispose();
	}
	decorationCache.clear();
}

export function activate(context: vscode.ExtensionContext) {
	let trees: { [uri: string]: tree_sitter.Tree } = {};
	let smlLang: { module: string, color: coloring.colorFun, parser?: tree_sitter } = { module: 'tree-sitter-sml', color: coloring.colorSML, parser: undefined };

	async function open(editor: vscode.TextEditor) {
		if (editor.document.languageId !== 'sml') {
			return;
		}

		if (!smlLang.parser) {
			let wasm = path.relative(process.cwd(), path.join(context.extensionPath, "parsers", "sml.wasm"));
			let lang = await tree_sitter.Language.load(wasm);
			let parser = new tree_sitter();
			parser.setLanguage(lang);
			smlLang.parser = parser;
		}

		let tree = smlLang.parser.parse(editor.document.getText());
		trees[editor.document.uri.toString()] = tree;
		colorUri(editor.document.uri);
	}

	function edit(edit: vscode.TextDocumentChangeEvent) {
		if (edit.document.languageId !== 'sml' || !smlLang.parser) {
			return;
		}

		if (edit.contentChanges.length !== 0) {
			let old_tree = trees[edit.document.uri.toString()];
			for (let change of edit.contentChanges) {
				let startIndex = change.rangeOffset;
				let oldEndIndex = change.rangeOffset + change.rangeLength;
				let newEndIndex = change.rangeOffset + change.text.length;
				let startPos = edit.document.positionAt(startIndex);
				let oldEndPos = edit.document.positionAt(oldEndIndex);
				let newEndPos = edit.document.positionAt(newEndIndex);
				let startPosition = asPoint(startPos);
				let oldEndPosition = asPoint(oldEndPos);
				let newEndPosition = asPoint(newEndPos);
				let delta = { startIndex, oldEndIndex, newEndIndex, startPosition, oldEndPosition, newEndPosition };
				old_tree.edit(delta);
			}
			let new_tree = smlLang.parser.parse(edit.document.getText(), old_tree);
			trees[edit.document.uri.toString()] = new_tree;
		}

		colorUri(edit.document.uri);
	}

	function close(doc: vscode.TextDocument) {
		delete trees[doc.uri.toString()];
	}

	function colorUri(uri: vscode.Uri) {
		for (let editor of vscode.window.visibleTextEditors) {
			if (editor.document.uri === uri) {
				colorEditor(editor);
			}
		}
	}

	function colorEditor(editor: vscode.TextEditor) {
		let tree = trees[editor.document.uri.toString()];
		if (!tree) {
			return;
		}
		let [scopes, errors] = smlLang.color(tree.rootNode, visibleLines(editor));
		let nodes = new Map<scoping.Scope, tree_sitter.SyntaxNode[]>();
		for (let [root, scope] of scopes) {
			if (!nodes.has(scope)) {
				nodes.set(scope, []);
			}
			nodes.get(scope)!.push(root);
		}
		for (let scope of nodes.keys()) {
			let dec = decoration(scope);
			if (dec) {
				let ranges = nodes.get(scope)!.map(range);
				editor.setDecorations(dec, ranges);
			}
		}
		for (let scope of decorationCache.keys()) {
			if (!nodes.has(scope)) {
				let dec = decorationCache.get(scope)!;
				editor.setDecorations(dec, []);
			}
		}
		diagonosticCollection.clear();
		let diags: vscode.Diagnostic[] = [];
		for (let root of errors) {
			diags.push(new vscode.Diagnostic(range(root), 'Syntax error.'));
		}
		diagonosticCollection.set(editor.document.uri, diags);
	}

	async function colorAllOpen() {
		for (let editor of vscode.window.visibleTextEditors) {
			await open(editor);
		}
	}

	async function onChangeConfiguration(event: vscode.ConfigurationChangeEvent) {
		let colorizationNeedsReload = event.affectsConfiguration('workbench.colorTheme');
		if (colorizationNeedsReload) {
			await loadStyles();
			colorAllOpen();
		}
	}

	function visibleLines(editor: vscode.TextEditor) {
		return editor.visibleRanges.map(range => {
			let start = range.start.line;
			let end = range.end.line;
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

	let diagonosticCollection = vscode.languages.createDiagnosticCollection('sml');
	context.subscriptions.push(diagonosticCollection);

	vscode.languages.registerDocumentFormattingEditProvider({ language: 'sml', scheme: 'file' }, {
		provideDocumentFormattingEdits(doc, opt, _tok) {
			let root = trees[doc.uri.toString()].rootNode;
			if (root.hasError()) {
				return [];
			} else {
				return formatting.format(root, opt);
			}
		}
	});

	vscode.languages.registerHoverProvider({ language: 'sml', scheme: 'file' }, {
		provideHover(doc, pos, _tok) {
			let ran = doc.getWordRangeAtPosition(pos, /'[A-Za-z0-9_']+|[A-Za-z][A-Za-z0-9_']*|[!%&$#+\-/:<=>?@\\~`^|*]+|~?[0-9]+\.[0-9]+([Ee]~?[0-9]+)?|~?[0-9]+|~?0x[0-9A-Fa-f]+|0w[0-9]+|0wx[0-9A-Fa-f]+/);
			if (ran) {
				return new vscode.Hover(doc.getText(ran));
			}
		}
	});

	async function activateLazily() {
		await initTreeSitter;
		await loadStyles();
		colorAllOpen();
	}
	activateLazily();
}

export function deactivate() { }