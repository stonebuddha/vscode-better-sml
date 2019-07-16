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

function setColors(cfg: {
	keyword: string,
	module: string,
	control: string,
	binding: string,
	function: string,
	comment: string,
	string: string,
}) {
	let defaultRule: Rule = {
		foreground: undefined,
		background: undefined,
		fontStyle: undefined,
	};

	// Keywords
	colors.set(Scope.KEYWORD_MISC, { ...defaultRule, foreground: cfg.keyword });
	colors.set(Scope.KEYWORD_MODULE, { ...defaultRule, foreground: cfg.module, fontStyle: 'underline' });
	colors.set(Scope.KEYWORD_STRUCT, { ...defaultRule, fontStyle: 'italic' });
	colors.set(Scope.KEYWORD_TYPE, { ...defaultRule, foreground: cfg.control, fontStyle: 'underline' });
	colors.set(Scope.KEYWORD_VAL, { ...defaultRule, foreground: cfg.binding, fontStyle: 'underline' });
	colors.set(Scope.KEYWORD_FN, { ...defaultRule, foreground: cfg.control });
	colors.set(Scope.KEYWORD_CTRL, { ...defaultRule, foreground: cfg.control, fontStyle: 'italic' });
	colors.set(Scope.KEYWORD_AND, { ...defaultRule, foreground: cfg.keyword, fontStyle: 'underline' });

	// Names
	colors.set(Scope.NAME_MODULE, { ...defaultRule, foreground: cfg.module });
	colors.set(Scope.NAME_FUNCTION, { ...defaultRule, foreground: cfg.function, fontStyle: 'bold italic' });
	colors.set(Scope.NAME_TYPE, { ...defaultRule, foreground: cfg.function, fontStyle: 'bold' });
	colors.set(Scope.NAME_PARAM, { ...defaultRule, foreground: cfg.module, fontStyle: 'italic' });
	colors.set(Scope.NAME_CONSTR, { ...defaultRule, foreground: cfg.keyword, fontStyle: 'bold' });
	colors.set(Scope.NAME_TYVAR, { ...defaultRule, foreground: cfg.control, fontStyle: 'italic' });
	colors.set(Scope.NAME_WILD, { ...defaultRule, foreground: cfg.comment });

	// Punctuations
	colors.set(Scope.PUNCT_EQUALS, { ...defaultRule, foreground: cfg.binding, fontStyle: 'bold' });
	colors.set(Scope.PUNCT_TYPEOP, { ...defaultRule, foreground: cfg.keyword, fontStyle: 'bold' });
	colors.set(Scope.PUNCT_DOT, { ...defaultRule, foreground: cfg.control, fontStyle: 'bold' });
	colors.set(Scope.PUNCT_MISC, { ...defaultRule, foreground: cfg.keyword });

	// Literals
	colors.set(Scope.LITERAL_STRING, { ...defaultRule, foreground: cfg.string });
	colors.set(Scope.LITERAL_NUMBER, { ...defaultRule, foreground: cfg.module });

	// Comments
	colors.set(Scope.COMMENT, { ...defaultRule, foreground: cfg.comment, fontStyle: 'italic' });
}

export async function load() {
	colors.clear();
	const themeName = vscode.workspace.getConfiguration('workbench').get('colorTheme');
	if (typeof themeName !== 'string') {
		console.warn('workbench.colorTheme is', themeName);
	} else {
		switch (themeName) {
			case 'Tomorrow Night':
			case 'Tomorrow Night Operator Mono':
				setColors({
					keyword: '#CC6666',
					module: '#DE935F',
					control: '#B294BB',
					binding: '#F0C674',
					function: '#81A2BE',
					comment: '#CED2CF',
					string: '#B5BD68',
				});
				break;
			case 'Tomorrow':
			case 'Tomorrow Operator Mono':
				setColors({
					keyword: '#C82829',
					module: '#F5871F',
					control: '#8959A8',
					binding: '#C99E00',
					function: '#4271AE',
					comment: '#373B41',
					string: '#718C00',
				});
				break;
			case 'Tomorrow Night Eighties':
			case 'Tomorrow Night Eighties Operator Mono':
				setColors({
					keyword: '#99CC99',
					module: '#F99157',
					control: '#CC99CC',
					binding: '#FFCC66',
					function: '#6699CC',
					comment: '#CDCDCD',
					string: '#99CC99',
				});
				break;
			case 'Tomorrow Night Bright':
			case 'Tomorrow Night Bright Operator Mono':
				setColors({
					keyword: '#D54E53',
					module: '#E78C45',
					control: '#C397D8',
					binding: '#E7C547',
					function: '#7AA6DA',
					comment: '#CED2CF',
					string: '#B9CA4A',
				});
				break;
			default:
				console.warn('workbench.colorTheme', themeName, 'not supported yet');
		}
	}
}