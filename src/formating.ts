import * as vscode from 'vscode';
import * as tree_sitter from 'web-tree-sitter';

export function format(root: tree_sitter.SyntaxNode, options: vscode.FormattingOptions): string {
	let indent_sym = options.insertSpaces ? " ".repeat(options.tabSize) : "\t";
	let res: string[] = [];

	function output(depth: number, last_row: number, node: tree_sitter.SyntaxNode) {
		if (last_row !== node.startPosition.row) {
			if (last_row >= 0) {
				res.push("\n");
			}
			res.push(indent_sym.repeat(depth));
		} else {
			res.push(" ");
		}
		res.push(node.text);
	}

	function visit(depth: number, last_row: number, node: tree_sitter.SyntaxNode) {
		if (node.type === 'ERROR' || node.type === 'source_file') {
			for (let child of node.children) {
				visit(depth, last_row, child);
				last_row = child.endPosition.row;
			}
		} else {
			if (node.childCount === 0) {
				output(depth, last_row, node);
			} else {
				if (node.isNamed) {
					for (let child of node.children) {
						visit(depth + 1, last_row, child);
						last_row = child.endPosition.row;
					}
				} else {
					for (let child of node.children) {
						visit(depth, last_row, child);
						last_row = child.endPosition.row;
					}
				}
			}
		}
	}

	visit(-1, -1, root);

	return res.join("");
}