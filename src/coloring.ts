import * as parser from 'web-tree-sitter';
import * as scoping from './scoping';

export type colorFun = (root: parser.SyntaxNode, visibleRanges: { start: number, end: number }[]) => [parser.SyntaxNode, scoping.Scope][];

export function colorSML(root: parser.SyntaxNode, visibleRanges: { start: number, end: number }[]) {
	const colors: [parser.SyntaxNode, scoping.Scope][] = [];

	function isUpper(id: string) {
		return id.charAt(0) >= 'A' && id.charAt(0) <= 'Z';
	}

	function visit(node: parser.SyntaxNode) {
		if (!isVisible(node, visibleRanges)) {
			return;
		} else {
			switch (node.type) {
				case 'structure':
				case 'signature':
				case 'functor':
				case 'funsig':
					colors.push([node, scoping.Scope.KEYWORD_MODULE]);
					break;
				case 'struct':
				case 'sig':
					colors.push([node, scoping.Scope.KEYWORD_STRUCT]);
					break;
				case 'datatype':
				case 'type':
				case 'eqtype':
				case 'abstype':
				case 'exception':
				case 'sharing':
					colors.push([node, scoping.Scope.KEYWORD_TYPE]);
					break;
				case 'val':
				case 'fun':
					colors.push([node, scoping.Scope.KEYWORD_VAL]);
					break;
				case 'let':
				case 'in':
				case 'local':
					colors.push([node, scoping.Scope.KEYWORD_TYPE]);
					break;
				case 'end':
					if (node.parent!.type === 'base_struct' || node.parent!.type === 'base_sign') {
						colors.push([node, scoping.Scope.KEYWORD_STRUCT]);
					} else {
						colors.push([node, scoping.Scope.KEYWORD_TYPE]);
					}
					break;
				case 'if':
				case 'then':
				case 'else':
				case 'case':
				case 'handle':
				case 'while':
				case 'do':
				case 'raise':
					colors.push([node, scoping.Scope.KEYWORD_CTRL]);
					break;
				case 'of':
					if (node.parent!.type === 'case_exp') {
						colors.push([node, scoping.Scope.KEYWORD_CTRL]);
					}
					break;
				case 'fn':
					colors.push([node, scoping.Scope.KEYWORD_FN]);
					break;
				case 'and':
				case 'where':
				case 'withtype':
				case 'with':
					colors.push([node, scoping.Scope.KEYWORD_AND]);
					break;
				case 'op':
				case 'include':
				case 'open':
				case 'rec':
				case 'overload':
				case 'infix':
				case 'infixr':
				case 'nonfix':
				case 'as':
				case 'orelse':
				case 'andalso':
					colors.push([node, scoping.Scope.KEYWORD_MISC]);
					break;

				case '_':
					colors.push([node, scoping.Scope.NAME_WILD]);
					break;
				case '.':
					colors.push([node, scoping.Scope.PUNCT_DOT]);
					break;
				case ':':
				case ':>':
				case '->':
					colors.push([node, scoping.Scope.PUNCT_TYPEOP]);
					break;
				case '=':
				case '=>':
				case '|':
					colors.push([node, scoping.Scope.PUNCT_EQUALS]);
					break;
				case '[':
				case ']':
				case '{':
				case '}':
					colors.push([node, scoping.Scope.PUNCT_EQUALS]);
					break;
				case ',':
					if (node.parent!.type === 'tyvar_seq' || node.parent!.type === 'rec_ty' || node.parent!.type === 'mark_ty' || node.parent!.type === 'tuple_pat' || node.parent!.type === 'plabels') {
						colors.push([node, scoping.Scope.PUNCT_TYPEOP]);
					} else {
						colors.push([node, scoping.Scope.PUNCT_MISC]);
					}
					break;
				case '*':
					if (node.parent!.type === 'tuple_ty') {
						colors.push([node, scoping.Scope.PUNCT_TYPEOP]);
					} else {
						colors.push([node, scoping.Scope.PUNCT_MISC]);
					}
					break;
				case '...':
				case ';':
				case 'symbolic':
					colors.push([node, scoping.Scope.PUNCT_MISC]);
					break;

				case 'tuple_unit_pat':
				case 'tuple_unit_exp':
					colors.push([node, scoping.Scope.PUNCT_EQUALS]);
					break;

				case 'int_constant':
				case 'word_constant':
				case 'float_constant':
					colors.push([node, scoping.Scope.LITERAL_NUMBER]);
					break;

				case 'tyvar':
					colors.push([node, scoping.Scope.NAME_TYVAR]);
					break;
				case 'ident':
					let parent = node.parent!;
					switch (parent.type) {
						case 'strb':
						case 'strspec':
						case 'fctspec':
						case 'valspec':
						case 'fctb':
						case 'overload_ldec':
							colors.push([node, scoping.Scope.NAME_FUNCTION]);
							break;
						case 'sigb':
						case 'var_sign':
						case 'include_spec':
						case 'fsigb':
						case 'var_fsig':
						case 'transparent_fsigconstraint_op':
						case 'opaque_fsigconstraint_op':
						case 'access_pat':
						case 'access_exp':
							colors.push([node, scoping.Scope.NAME_MODULE]);
							break;
						case 'dtrepl':
						case 'tyspec':
						case 'tb':
						case 'db':
							colors.push([node, scoping.Scope.NAME_TYPE]);
							break;
						case 'fparam':
						case 'plabel':
							colors.push([node, scoping.Scope.NAME_PARAM]);
							break;
						case 'selector':
							if (parent.parent!.type !== 'selector_exp') {
								colors.push([node, scoping.Scope.NAME_PARAM]);
							}
							break;
						case 'var_pat':
							if (isUpper(node.text)) {
								colors.push([node, scoping.Scope.NAME_CONSTR]);
							} else if (parent.parent!.type === 'clause' && !parent.previousSibling) {
								colors.push([node, scoping.Scope.NAME_FUNCTION]);
							} else if (parent.parent!.type === 'app_pat' && parent.parent!.childCount === 1 && parent.parent!.parent!.type === 'vb') {
								colors.push([node, scoping.Scope.NAME_FUNCTION]);
							} else {
								colors.push([node, scoping.Scope.NAME_PARAM]);
							}
							break;
						case 'var_exp':
							if (isUpper(node.text)) {
								colors.push([node, scoping.Scope.NAME_CONSTR]);
							}
							break;
						case 'exnspec':
						case 'constr':
						case 'eb':
							colors.push([node, scoping.Scope.NAME_CONSTR]);
							break;

						case 'qident':
							if (parent.nextSibling) {
								colors.push([node, scoping.Scope.NAME_MODULE]);
							} else {
								if (isUpper(node.text)) {
									colors.push([node, scoping.Scope.NAME_CONSTR]);
								} else {
									let gparent = parent.parent!;
									switch (gparent.type) {
										case 'var_struct':
										case 'strspec':
										case 'struct_whspec':
										case 'var_fct_exp':
										case 'open_ldec':
											colors.push([node, scoping.Scope.NAME_MODULE]);
											break;
										case 'app_struct':
										case 'share_spec':
										case 'type_whspec':
										case 'app_fct_exp':
										case 'con_ty':
											colors.push([node, scoping.Scope.NAME_TYPE]);
											break;
										case 'exn_def':
											colors.push([node, scoping.Scope.NAME_CONSTR]);
											break;
										case 'access_pat':
											colors.push([node, scoping.Scope.NAME_PARAM]);
											break;
									}
								}
							}
							break;
					}
					break;
			}
			// if (node.type === 'ident') {
			// 	if (['strb', 'strspec', 'fctspec', 'valspec'].includes(node.parent!.type)) {
			// 		setScope(node, Scope.NAME_FUNCTION());
			// 	} else if (['sigb', 'var_sign', 'access_pat', 'access_exp'].includes(node.parent!.type)) {
			// 		setScope(node, Scope.TERM_NUMBER());
			// 	} else if (['dtrepl', 'tyspec', 'tb', 'db'].includes(node.parent!.type)) {
			// 		setScope(node, Scope.TYPE_CONSTRUCTOR());
			// 	} else if (['exnspec', 'constr', 'eb'].includes(node.parent!.type)) {
			// 		setScope(node, Scope.TERM_CONSTRUCTOR());
			// 	} else if (['selector', 'plabel'].includes(node.parent!.type)) {
			// 		setScope(node, `${Scope.NAME_FIELD()} ${Scope.STYLE_ITALICS()}`);
			// 	} else if (['var_pat'].includes(node.parent!.type)) {
			// 		if (['clause'].includes(node.parent!.parent!.type) && !node.parent!.previousSibling) {
			// 			setScope(node, Scope.NAME_FUNCTION());
			// 		} else if (node.text.charAt(0) >= 'A' && node.text.charAt(0) <= 'Z') {
			// 			setScope(node, Scope.TERM_CONSTRUCTOR());
			// 		} else if (node.parent!.parent!.type === 'app_pat' && node.parent!.parent!.childCount === 1 && node.parent!.parent!.parent!.type === 'vb') {
			// 			setScope(node, Scope.NAME_FUNCTION());
			// 		} else {
			// 			setScope(node, `${Scope.NAME_FIELD()} ${Scope.STYLE_ITALICS()}`);
			// 		}
			// 	} else if (node.parent!.type === 'qident') {
			// 		if (['var_struct', 'strspec'].includes(node.parent!.parent!.type)) {
			// 			setScope(node, Scope.TERM_NUMBER());
			// 		} else if (['app_struct'].includes(node.parent!.parent!.type)) {
			// 			if (!node.nextSibling) {
			// 				setScope(node, Scope.NAME_FUNCTION());
			// 			} else {
			// 				setScope(node, Scope.TERM_NUMBER());
			// 			}
			// 		} else if (['access_pat'].includes(node.parent!.parent!.type)) {
			// 			if (!node.nextSibling) {
			// 				if (node.text.charAt(0) >= 'A' && node.text.charAt(0) <= 'Z') {
			// 					setScope(node, Scope.TERM_CONSTRUCTOR());
			// 				} else {
			// 					setScope(node, `${Scope.NAME_FIELD()} ${Scope.STYLE_ITALICS()}`);
			// 				}
			// 			} else {
			// 				setScope(node, Scope.NAME_MODULE());
			// 			}
			// 		} else if (['con_ty'].includes(node.parent!.parent!.type)) {
			// 			if (!node.nextSibling) {
			// 				setScope(node, Scope.TYPE_CONSTRUCTOR());
			// 			} else {
			// 				setScope(node, Scope.NAME_MODULE());
			// 			}
			// 		} else if (['access_exp'].includes(node.parent!.parent!.type)) {
			// 			if (node.nextSibling) {
			// 				setScope(node, Scope.NAME_MODULE());
			// 			}
			// 		}
			// 	}
			// } else if (node.type === 'int_constant' || node.type === 'word_constant' || node.type === 'float_constant') {
			// 	setScope(node, Scope.TERM_NUMBER());
			// } else if (node.type === 'tuple_unit_exp' || node.type === 'unit_tuple_pat') {
			// 	setScope(node, Scope.TERM_CONSTRUCTOR());
			// } else if (node.type === 'symbolic') {
			// 	setScope(node, Scope.STYLE_OPERATOR());
			// } else if (node.type === 'tyvar') {
			// 	setScope(node, Scope.VARIABLE_TYPE());
			// } else if (node.type === '*') {
			// 	if (node.parent!.type === 'tuple_ty') {
			// 		setScope(node, Scope.OPERATOR_TYPE());
			// 	}
			// } else if (node.type === '=') {
			// 	setScope(node, Scope.PUNCTUATION_EQUALS());
			// } else if (node.type === ',') {
			// 	if (node.parent!.type === 'tuple_pat') {
			// 		setScope(node, Scope.PUNCTUATION_COMMA());
			// 	}
			// }

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