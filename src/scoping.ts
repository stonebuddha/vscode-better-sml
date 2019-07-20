import * as vscode from 'vscode';

export interface Rule {
	foreground: string | undefined;
	background: string | undefined;
	fontStyle: string | undefined;
}

export enum Scope {
	KEYWORD_MODULE, // structure/signature/functor/funsig
	KEYWORD_STRUCT, // struct,end/sig,end
	KEYWORD_TYPE, // type/datatype/eqtype/abstype/exception
	KEYWORD_VAL, // val/fun
	KEYWORD_FN, // fn
	KEYWORD_CTRL, // if,then,else/case,of/handle/raise/while,do
	KEYWORD_AND, // and/where/withtype/with/sharing
	KEYWORD_LET, // let,in,end/local,in,end
	KEYWORD_MISC, // include/open/overload/infix/infixr/nonfix/rec/as/op/andalso/orelse

	NAME_MODULE,
	NAME_FUNCTION,
	NAME_TYPE,
	NAME_PAT,
	NAME_FIELD,
	NAME_CONSTR,
	NAME_TYVAR,
	NAME_WILD,

	PUNCT_EQUALS,
	PUNCT_DOT,
	PUNCT_COMMA,
	PUNCT_COLON,
	PUNCT_BAR,
	PUNCT_TYPEOP,
	PUNCT_MISC,

	LITERAL_STRING,
	LITERAL_NUMBER,

	COMMENT,
}

let colors = new Map<Scope, Rule>();

export function find(scope: Scope): Rule | undefined {
	return colors.get(scope);
}

function setColors(cfg: {
	comment: string,
	red: string,
	orange: string,
	yellow: string,
	green: string,
	aqua: string,
	blue: string,
	purple: string,
}) {
	let defaultRule: Rule = {
		foreground: undefined,
		background: undefined,
		fontStyle: undefined,
	};

	// Keywords
	colors.set(Scope.KEYWORD_MODULE, { ...defaultRule, foreground: cfg.orange, fontStyle: 'underline' });
	colors.set(Scope.KEYWORD_STRUCT, { ...defaultRule, fontStyle: 'bold italic' });
	colors.set(Scope.KEYWORD_TYPE, { ...defaultRule, foreground: cfg.blue, fontStyle: 'underline' });
	colors.set(Scope.KEYWORD_VAL, { ...defaultRule, foreground: cfg.purple, fontStyle: 'underline' });
	colors.set(Scope.KEYWORD_FN, { ...defaultRule, foreground: cfg.purple });
	colors.set(Scope.KEYWORD_CTRL, { ...defaultRule, foreground: cfg.purple, fontStyle: 'bold italic' });
	colors.set(Scope.KEYWORD_AND, { ...defaultRule, foreground: cfg.red, fontStyle: 'underline' });
	colors.set(Scope.KEYWORD_LET, { ...defaultRule, foreground: cfg.yellow, fontStyle: 'underline' });
	colors.set(Scope.KEYWORD_MISC, { ...defaultRule, foreground: cfg.red });

	// Names
	colors.set(Scope.NAME_MODULE, { ...defaultRule, foreground: cfg.orange });
	colors.set(Scope.NAME_FUNCTION, { ...defaultRule, foreground: cfg.blue, fontStyle: 'bold italic' });
	colors.set(Scope.NAME_TYPE, { ...defaultRule, foreground: cfg.blue, fontStyle: 'bold' });
	colors.set(Scope.NAME_PAT, { ...defaultRule, foreground: cfg.orange, fontStyle: 'italic' });
	colors.set(Scope.NAME_FIELD, { ...defaultRule, foreground: cfg.red, fontStyle: 'bold' });
	colors.set(Scope.NAME_CONSTR, { ...defaultRule, foreground: cfg.red, fontStyle: 'bold' });
	colors.set(Scope.NAME_TYVAR, { ...defaultRule, foreground: cfg.purple, fontStyle: 'italic' });
	colors.set(Scope.NAME_WILD, { ...defaultRule, foreground: cfg.comment });

	// Punctuations
	colors.set(Scope.PUNCT_EQUALS, { ...defaultRule, foreground: cfg.yellow, fontStyle: 'bold' });
	colors.set(Scope.PUNCT_DOT, { ...defaultRule, foreground: cfg.comment, fontStyle: 'bold' });
	colors.set(Scope.PUNCT_COMMA, { ...defaultRule, foreground: cfg.red, fontStyle: 'bold' });
	colors.set(Scope.PUNCT_COLON, { ...defaultRule, foreground: cfg.red, fontStyle: 'bold' });
	colors.set(Scope.PUNCT_BAR, { ...defaultRule, foreground: cfg.yellow, fontStyle: 'bold' });
	colors.set(Scope.PUNCT_TYPEOP, { ...defaultRule, foreground: cfg.red, fontStyle: 'bold' });
	colors.set(Scope.PUNCT_MISC, { ...defaultRule, foreground: cfg.red });

	// Literals
	colors.set(Scope.LITERAL_STRING, { ...defaultRule, foreground: cfg.green });
	colors.set(Scope.LITERAL_NUMBER, { ...defaultRule, foreground: cfg.orange });

	// Comments
	colors.set(Scope.COMMENT, { ...defaultRule, foreground: cfg.comment, fontStyle: 'italic' });
}

export async function load() {
	colors.clear();
	let themeName = vscode.workspace.getConfiguration('workbench').get('colorTheme');
	if (typeof themeName !== 'string') {
		console.warn('workbench.colorTheme is', themeName);
	} else {
		switch (themeName) {
			case 'Tomorrow Night':
			case 'Tomorrow Night Operator Mono':
				setColors({
					comment: '#CED2CF',
					red: '#CC6666',
					orange: '#DE935F',
					yellow: '#F0C674',
					green: '#B5BD68',
					aqua: '#8ABEB7',
					blue: '#81A2BE',
					purple: '#B294BB',
				});
				break;
			case 'Tomorrow':
			case 'Tomorrow Operator Mono':
				setColors({
					comment: '#373B41',
					red: '#C82829',
					orange: '#F5871F',
					yellow: '#EAB700',
					green: '#718C00',
					aqua: '#3E999F',
					blue: '#4271AE',
					purple: '#8959A8',
				});
				break;
			case 'Tomorrow Night Eighties':
			case 'Tomorrow Night Eighties Operator Mono':
				setColors({
					comment: '#CDCDCD',
					red: '#F2777A',
					orange: '#F99157',
					yellow: '#FFCC66',
					green: '#99CC99',
					aqua: '#66CCCC',
					blue: '#6699CC',
					purple: '#CC99CC',
				});
				break;
			case 'Tomorrow Night Bright':
			case 'Tomorrow Night Bright Operator Mono':
				setColors({
					comment: '#CED2CF',
					red: '#D54E53',
					orange: '#E78C45',
					yellow: '#E7C547',
					green: '#B9CA4A',
					aqua: '#70C0B1',
					blue: '#7AA6DA',
					purple: '#C397D8',
				});
				break;
			case 'Tomorrow Night Blue':
				setColors({
					comment: '#7285B7',
					red: '#FF9DA4',
					orange: '#FFC58F',
					yellow: '#FFEEAD',
					green: '#D1F1A9',
					aqua: '#99FFFF',
					blue: '#BBDAFF',
					purple: '#EBBBFF',
				});
				break;
			case 'Solarized Dark':
				setColors({
					comment: '#EEE8D5',
					red: '#DC322F',
					orange: '#CB4B16',
					yellow: '#B58900',
					green: '#859900',
					aqua: '#2AA198',
					blue: '#268BD2',
					purple: '#6C71C4',
				});
				break;
			case 'Solarized Light':
				setColors({
					comment: '#073642',
					red: '#DC322F',
					orange: '#CB4B16',
					yellow: '#B58900',
					green: '#859900',
					aqua: '#2AA198',
					blue: '#268BD2',
					purple: '#6C71C4',
				});
				break;
			case 'Gruvbox Dark Hard':
			case 'Gruvbox Dark Medium':
			case 'Gruvbox Dark Soft':
			case 'Gruvbox Dark (Hard)':
			case 'Gruvbox Dark (Medium)':
			case 'Gruvbox Dark (Soft)':
				setColors({
					comment: '#EBDBB2',
					red: '#FB4934',
					orange: '#FE8019',
					yellow: '#FABD2F',
					green: '#B8BB26',
					aqua: '#8EC07C',
					blue: '#83A598',
					purple: '#D3869B',
				});
				break;
			case 'Gruvbox Light Hard':
			case 'Gruvbox Light Medium':
			case 'Gruvbox Light Soft':
			case 'Gruvbox Light (Hard)':
			case 'Gruvbox Light (Medium)':
			case 'Gruvbox Light (Soft)':
				setColors({
					comment: '#3C3836',
					red: '#9D0006',
					orange: '#AF3A03',
					yellow: '#B57614',
					green: '#79740E',
					aqua: '#427B58',
					blue: '#076678',
					purple: '#8F3F71',
				});
				break;
			case 'Oceanic Plus':
			case 'Oceanic Next':
			case 'Oceanic Next Italic':
			case 'Oceanic Next Italic - White':
				setColors({
					comment: '#CDD3DE',
					red: '#EC5F67',
					orange: '#F99157',
					yellow: '#FAC863',
					green: '#99C794',
					aqua: '#5FB3B3',
					blue: '#6699CC',
					purple: '#C594C5',
				});
				break;
			default:
				console.warn('workbench.colorTheme', themeName, 'not supported yet');
		}
	}
}