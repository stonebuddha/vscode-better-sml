import * as parser from 'web-tree-sitter';
import * as basis from "./syntaxes/basis";

const { Scope } = basis;

export type colorFun = (root: parser.SyntaxNode, visibleRanges: { start: number, end: number }[]) => [parser.SyntaxNode, string][];

export function colorSML(root: parser.SyntaxNode, visibleRanges: { start: number, end: number }[]) {
	const colors: [parser.SyntaxNode, string][] = [];

	function setScope(node: parser.SyntaxNode, scopeStr: string) {
		scopeStr.split(' ').map(scope => {
			colors.push([node, scope]);
		});
	}

	function visit(node: parser.SyntaxNode) {
		if (!isVisible(node, visibleRanges)) {
			return;
		} else {
			if (node.type === 'ident') {
				if (['strb', 'strspec', 'fctspec', 'valspec'].includes(node.parent!.type)) {
					setScope(node, Scope.NAME_FUNCTION());
				} else if (['sigb', 'var_sign', 'access_pat', 'access_exp'].includes(node.parent!.type)) {
					setScope(node, Scope.TERM_NUMBER());
				} else if (['dtrepl', 'tyspec', 'tb', 'db'].includes(node.parent!.type)) {
					setScope(node, Scope.TYPE_CONSTRUCTOR());
				} else if (['exnspec', 'constr', 'eb'].includes(node.parent!.type)) {
					setScope(node, Scope.TERM_CONSTRUCTOR());
				} else if (['selector', 'plabel'].includes(node.parent!.type)) {
					setScope(node, `${Scope.NAME_FIELD()} ${Scope.STYLE_ITALICS()}`);
				} else if (['var_pat'].includes(node.parent!.type)) {
					if (['clause'].includes(node.parent!.parent!.type) && !node.parent!.previousSibling) {
						setScope(node, Scope.NAME_FUNCTION());
					} else if (node.text.charAt(0) >= 'A' && node.text.charAt(0) <= 'Z') {
						setScope(node, Scope.TERM_CONSTRUCTOR()); // FIXME: adhoc highlighter for constructors
					} else {
						setScope(node, `${Scope.NAME_FIELD()} ${Scope.STYLE_ITALICS()}`);
					}
				} else if (node.parent!.type === 'qident') {
					if (['var_struct', 'strspec'].includes(node.parent!.parent!.type)) {
						setScope(node, Scope.TERM_NUMBER());
					} else if (['app_struct'].includes(node.parent!.parent!.type)) {
						if (!node.nextSibling) {
							setScope(node, Scope.NAME_FUNCTION());
						} else {
							setScope(node, Scope.TERM_NUMBER());
						}
					} else if (['access_pat'].includes(node.parent!.parent!.type)) {
						if (!node.nextSibling) {
							if (node.text.charAt(0) >= 'A' && node.text.charAt(0) <= 'Z') {
								setScope(node, Scope.TERM_CONSTRUCTOR()); // FIXME: adhoc highlighter for constructors
							} else {
								setScope(node, `${Scope.NAME_FIELD()} ${Scope.STYLE_ITALICS()}`);
							}
						} else {
							setScope(node, Scope.NAME_MODULE());
						}
					} else if (['con_ty'].includes(node.parent!.parent!.type)) {
						if (!node.nextSibling) {
							setScope(node, Scope.TYPE_CONSTRUCTOR());
						} else {
							setScope(node, Scope.NAME_MODULE());
						}
					} else if (['access_exp'].includes(node.parent!.parent!.type)) {
						if (node.nextSibling) {
							setScope(node, Scope.NAME_MODULE());
						}
					}
				}
			} else if (node.type === 'int_constant' || node.type === 'word_constant' || node.type === 'float_constant') {
				setScope(node, Scope.TERM_NUMBER());
			} else if (node.type === 'tuple_unit_exp' || node.type === 'unit_tuple_pat') {
				setScope(node, Scope.TERM_CONSTRUCTOR());
			} else if (node.type === 'symbolic') {
				setScope(node, Scope.STYLE_OPERATOR());
			} else if (node.type === 'tyvar') {
				setScope(node, Scope.VARIABLE_TYPE());
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