import * as vscode from 'vscode';
import * as tree_sitter from 'web-tree-sitter';

export function format(root: tree_sitter.SyntaxNode, options: vscode.FormattingOptions): string {
	let indent_sym = options.insertSpaces ? " ".repeat(options.tabSize) : "\t";
	let res: string[] = [];
	return res.join("");
}