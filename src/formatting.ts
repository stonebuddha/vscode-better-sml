import * as vscode from 'vscode';
import * as tree_sitter from 'web-tree-sitter';

export function format(root: tree_sitter.SyntaxNode, options: vscode.FormattingOptions): vscode.TextEdit[] {
	let indent_sym = options.insertSpaces ? " ".repeat(options.tabSize) : "\t";
	let res: vscode.TextEdit[] = [];

	function visit(root: tree_sitter.SyntaxNode, last_row: number, depth: number) {
		if (root.childCount === 0) {
			if (last_row !== root.startPosition.row) {
				let pos = root.startPosition;
				let ls = new vscode.Position(pos.row, 0);
				let le = new vscode.Position(pos.row, pos.column);
				let ran = new vscode.Range(ls, le);
				res.push(vscode.TextEdit.replace(ran, indent_sym.repeat(depth)));
			}
		} else {
			let type = root.type;

			function beforeToken() {
				switch (type) {
					case 'structure_dec':
					case 'structure_dec_strdec':
					case 'str_spec':
					case 'functor_dec_strdec':
					case 'signature_dec':
					case 'aug_sign':
					case 'functor_spec':
					case 'type_spec':
					case 'eqtype_spec':
					case 'val_spec':
					case 'exception_spec':
					case 'sharing_spec':
					case 'funsig_dec':
					case 'functor_dec':
					case 'val_ldec':
					case 'fun_ldec':
					case 'type_ldec':
					case 'exception_ldec':
						return ['and'];
					case 'base_struct':
						return ['struct', 'end'];
					case 'local_dec_strdec':
					case 'let_struct':
					case 'let_fct_exp':
					case 'local_dec':
					case 'let_exp':
					case 'local_dec_let':
						return ['in', 'end'];
					case 'base_sign':
						return ['sig', 'end'];
					case 'datatype_spec':
					case 'datatype_ldec':
						return ['and', 'withtype'];
					case 'fparam':
					case 'arg_fct':
					case 'paren_pat':
					case 'tuple_pat':
					case 'or_pat':
					case 'seq_exp':
					case 'tuple_sexp':
					case 'mark_ty':
					case 'paren_ty':
					case 'tyvar_seq':
						return [')'];
					case 'list_pat':
					case 'list_exp':
					case 'vector_pat':
					case 'vector_exp':
						return [']'];
					case 'rec_pat':
					case 'rec_exp':
					case 'rec_ty':
						return ['}'];
					case 'abstype_ldec':
						return ['and', 'withtype', 'with', 'end'];
					case 'case_exp':
						return ['of'];
					case 'while_exp':
						return ['do'];
					case 'if_exp':
						return ['then', 'else'];
					default:
						return [];
				}
			}

			function afterToken() {
				switch (type) {
					case 'structure_dec':
					case 'structure_dec_strdec':
					case 'str_spec':
						return ['structure', 'and'];
					case 'functor_dec_strdec':
					case 'functor_spec':
					case 'functor_dec':
						return ['functor', 'and'];
					case 'signature_dec':
						return ['signature', 'and'];
					case 'aug_sign':
						return ['where', 'and'];
					case 'base_struct':
						return ['struct'];
					case 'local_dec_strdec':
					case 'local_dec':
					case 'local_dec_let':
						return ['local', 'in'];
					case 'let_struct':
					case 'let_fct_exp':
					case 'let_exp':
						return ['let', 'in'];
					case 'base_sign':
						return ['sig'];
					case 'datatype_spec':
					case 'datatype_ldec':
						return ['datatype', 'withtype', 'and'];
					case 'type_spec':
					case 'type_ldec':
						return ['type', 'and'];
					case 'eqtype_spec':
						return ['eqtype', 'and'];
					case 'val_spec':
					case 'val_ldec':
						return ['val', 'and'];
					case 'exception_spec':
					case 'exception_ldec':
						return ['exception', 'and'];
					case 'sharing_spec':
						return ['sharing', 'and'];
					case 'include_spec':
						return ['include'];
					case 'funsig_dec':
						return ['funsig', 'and'];
					case 'fparam':
					case 'arg_fct':
					case 'paren_pat':
					case 'tuple_pat':
					case 'or_pat':
					case 'seq_exp':
					case 'tuple_exp':
					case 'mark_ty':
					case 'paren_ty':
					case 'tyvar_seq':
						return ['('];
					case 'list_pat':
					case 'list_exp':
					case 'vector_exp':
					case 'vector_pat':
						return ['['];
					case 'rec_path':
					case 'rec_exp':
					case 'rec_ty':
						return ['{'];
					case 'fun_ldec':
						return ['fun', 'and'];
					case 'abstype_ldec':
						return ['abstype', 'and', 'withtype', 'with'];
					case 'handle_exp':
						return ['handle'];
					case 'case_exp':
						return ['case', 'of'];
					case 'while_exp':
						return ['while', 'do'];
					case 'if_exp':
						return ['if', 'then', 'else'];
					case 'raise_exp':
						return ['raise'];
					case 'rule':
						return ['=>'];
					case 'clause':
						return ['='];
					default:
						return [];
				}
			}

			let befores = beforeToken();
			let afters = afterToken();

			let flag = true;

			for (let child of root.children) {
				if (befores.includes(child.type)) {
					depth -= 1;
				} else if (type === 'db' || (type === 'match' && root.parent!.type !== 'fn_exp')) {
					if (flag && child.type === '|') {
						flag = false;
						depth -= 1;
					}
				}

				if (child.type === 'struct' && root.parent!.type === 'let_struct') {
					depth += 1;
				}

				visit(child, last_row, depth);

				if (afters.includes(child.type)) {
					depth += 1;
				}

				last_row = child.endPosition.row;
			}

			switch (type) {
				case 'structure_dec':
				case 'structure_dec_strdec':
				case 'functor_dec_strdec':
				case 'signature_dec':
				case 'aug_sign':
				case 'str_spec':
				case 'functor_spec':
				case 'datatype_spec':
				case 'type_spec':
				case 'eqtype_spec':
				case 'val_spec':
				case 'exception_spec':
				case 'sharing_spec':
				case 'include_spec':
				case 'funsig_dec':
				case 'functor_dec':
				case 'val_ldec':
				case 'fun_ldec':
				case 'type_ldec':
				case 'datatype_ldec':
				case 'exception_ldec':
				case 'handle_exp':
				case 'case_exp':
				case 'while_exp':
				case 'if_exp':
				case 'raise_exp':
				case 'rule':
				case 'clause':
					depth -= 1;
					break;
				default:
					break;
			}
		}
	}

	visit(root, -1, 0);
	return res;
}