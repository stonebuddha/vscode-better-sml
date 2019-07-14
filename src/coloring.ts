import * as parser from 'web-tree-sitter';
import * as basis from "./syntaxes/basis";

const { Scope } = basis;

export type colorFun = (root: parser.SyntaxNode, visibleRanges: { start: number, end: number }[]) => [parser.SyntaxNode, string][];

export function colorSML(root: parser.SyntaxNode, visibleRanges: { start: number, end: number }[]) {
	const colors: [parser.SyntaxNode, string][] = [];

	function visit(node: parser.SyntaxNode) {
		if (!isVisible(node, visibleRanges)) {
			return;
		} else {
			if (node.type === 'ident') {
				Scope.NAME_FUNCTION().split(' ').map(scope => {
					colors.push([node, scope]);
				});
			} else if (node.type === 'int_constant' || node.type === 'word_constant' || node.type === 'float_constant') {
				Scope.TERM_NUMBER().split(' ').map(scope => {
					colors.push([node, scope]);
				});
			} else if (node.type === 'tuple_unit_exp' || node.type === 'unit_tuple_pat') {
				Scope.TERM_CONSTRUCTOR().split(' ').map(scope => {
					colors.push([node, scope]);
				});
			}
			for (const child of node.children) {
				visit(child);
			}
		}
	}

	visit(root);

	return colors;
}

function isVisible(node: parser.SyntaxNode, visibleRanges: { start: number, end: number }[]) {
	for (const { start, end } of visibleRanges) {
		const overlap = node.startPosition.row <= end + 1 && start - 1 <= node.endPosition.row;
		if (overlap) {
			return true;
		}
	}
	return false;
}