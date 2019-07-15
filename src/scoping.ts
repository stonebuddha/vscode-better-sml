import * as vscode from 'vscode';

export interface Rule {
	foreground: string | undefined;
	background: string | undefined;
	fontStyle: string | undefined;
}

export enum Scope {
	KEYWORD_MISC,
	KEYWORD_MODULE,
	KEYWORD_STRUCT,
	KEYWORD_TYPE,
	KEYWORD_VAL,
	KEYWORD_FN,
	KEYWORD_CTRL,
	KEYWORD_AND,

	NAME_MODULE,
	NAME_FUNCTION,
	NAME_TYPE,
	NAME_PARAM,
	NAME_CONSTR,
	NAME_TYVAR,
	NAME_WILD,

	PUNCT_EQUALS,
	PUNCT_TYPEOP,
	PUNCT_DOT,
	PUNCT_MISC,

	LITERAL_STRING,
	LITERAL_NUMBER,

	COMMENT,
}

const colors = new Map<Scope, Rule>();

export function find(scope: Scope): Rule | undefined {
	return colors.get(scope);
}

export async function load() {
	colors.clear();
	const themeName = vscode.workspace.getConfiguration('workbench').get('colorTheme');
	if (typeof themeName !== 'string') {
		console.warn('workbench.colorTheme is', themeName);
	} else {
		switch (themeName) {
			case 'Tomorrow Night Operator Mono':
				let defaultRule: Rule = {
					foreground: undefined,
					background: undefined,
					fontStyle: undefined,
				};

				// Keywords
				colors.set(Scope.KEYWORD_MISC, { ...defaultRule, foreground: '#CC6666' });
				colors.set(Scope.KEYWORD_MODULE, { ...defaultRule, foreground: '#DE935F', fontStyle: 'underline' });
				colors.set(Scope.KEYWORD_STRUCT, { ...defaultRule, fontStyle: 'italic' });
				colors.set(Scope.KEYWORD_TYPE, { ...defaultRule, foreground: '#B294BB', fontStyle: 'underline' });
				colors.set(Scope.KEYWORD_VAL, { ...defaultRule, foreground: '#F0C674', fontStyle: 'underline' });
				colors.set(Scope.KEYWORD_FN, { ...defaultRule, foreground: '#B294BB' });
				colors.set(Scope.KEYWORD_CTRL, { ...defaultRule, foreground: '#B294BB', fontStyle: 'italic' });
				colors.set(Scope.KEYWORD_AND, { ...defaultRule, foreground: '#CC6666', fontStyle: 'underline' });

				// Names
				colors.set(Scope.NAME_MODULE, { ...defaultRule, foreground: '#DE935F' });
				colors.set(Scope.NAME_FUNCTION, { ...defaultRule, foreground: '#81A2BE', fontStyle: 'bold italic' });
				colors.set(Scope.NAME_TYPE, { ...defaultRule, foreground: '#81A2BE', fontStyle: 'bold' });
				colors.set(Scope.NAME_PARAM, { ...defaultRule, foreground: '#DE935F', fontStyle: 'italic' });
				colors.set(Scope.NAME_CONSTR, { ...defaultRule, foreground: '#CC6666', fontStyle: 'bold' });
				colors.set(Scope.NAME_TYVAR, { ...defaultRule, foreground: '#B294BB', fontStyle: 'italic' });
				colors.set(Scope.NAME_WILD, { ...defaultRule, foreground: '#CED2CF' });

				// Punctuations
				colors.set(Scope.PUNCT_EQUALS, { ...defaultRule, foreground: '#F0C674', fontStyle: 'bold' });
				colors.set(Scope.PUNCT_TYPEOP, { ...defaultRule, foreground: '#CC6666', fontStyle: 'bold' });
				colors.set(Scope.PUNCT_DOT, { ...defaultRule, foreground: '#B294BB', fontStyle: 'bold' });
				colors.set(Scope.PUNCT_MISC, { ...defaultRule, foreground: '#CC6666' });

				// Literals
				colors.set(Scope.LITERAL_STRING, { ...defaultRule, foreground: '#B5BD68' });
				colors.set(Scope.LITERAL_NUMBER, { ...defaultRule, foreground: '#DE935F' });

				// Comments
				colors.set(Scope.COMMENT, { ...defaultRule, foreground: '#CED2CF', fontStyle: 'italic' });

				break;
			default:
				console.warn('workbench.colorTheme', themeName, 'not supported yet');
		}
	}
}