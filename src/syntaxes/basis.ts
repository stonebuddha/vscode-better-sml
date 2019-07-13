// tslint:disable object-literal-sort-keys

import * as schema from "./schema";

export function ref(f: (...args: any[]) => schema.Rule): string {
	return `#${f.name}`;
}

export function include(f: (...args: any[]) => schema.Rule): { include: string } {
	return { include: ref(f) };
}

export const alt = (...rest: string[]) => rest.join("|");
export const capture = (arg: string) => `(${arg})`;
export const complement = (...rest: string[]) => `[^${rest.join("")}]`;
export const group = (arg: string) => `(?:${arg})`;
export const lookBehind = (arg: string) => `(?<=${arg})`;
export const negativeLookBehind = (arg: string) => `(?<!${arg})`;
export function lastWords(...rest: string[]): string {
	const result: string[] = [];
	for (const token of rest) { result.push(`[^[:word:]]${token}`, `^${token}`); }
	return group(seq(lookBehind(group(alt(...result))), negativeLookAhead(set(Class.word))));
}
export const many = (arg: string) => `${arg}*`;
export const manyOne = (arg: string) => `${arg}+`;
export const opt = (arg: string) => `${arg}?`;
export const words = (arg: string) => `\\b${arg}\\b`;
export const lookAhead = (arg: string) => `(?=${arg})`;
export const negativeLookAhead = (arg: string) => `(?!${arg})`;
export const seq = (...rest: string[]) => rest.join("");
export const set = (...rest: string[]) => `[${rest.join("")}]`;

export const Class = {
	alnum: "[:alnum:]",
	alpha: "[:alpha:]",
	ascii: "[:ascii:]",
	blank: "[:blank:]",
	cntrl: "[:cntrl:]",
	digit: "[:digit:]",
	graph: "[:graph:]",
	lower: "[:lower:]",
	print: "[:print:]",
	punct: "[:punct:]",
	space: "[:space:]",
	upper: "[:upper:]",
	word: "[:word:]",
	xdigit: "[:xdigit:]",
};

export const Token = {
	LPAREN: "\\(",
	RPAREN: "\\)",
	ASTERISK: "\\*",
	STRUCTURE: "structure",
	SIGNATURE: "signature",
	VAL: "val",
	REC: "rec",
	STRUCT: "struct",
	SIG: "sig",
	END: "end",
	AND: "and",
	TILDE: "~",
	DOT: "\\.",
	HASH: "#",
	DQUATATION_MARK: '"',
	SEMICOLON: ";",
	IN: "in",
	FUN: "fun",
	TYPE: "type",
	DATATYPE: "datatype",
	ABSTYPE: "abstype",
	EXCEPTION: "exception",
	LOCAL: "local",
	OPEN: "open",
	NONFIX: "nonfix",
	INFIX: "infix",
	INFIXR: "infixr",
	APOSTROPHE: "'",
	COMMA: ",",
	WILD: "_",
	LBRACKET: "\\[",
	RBRACKET: "\\]",
	LBRACE: "\\{",
	RBRACK: "\\}",
	EQUALOP: "=",
	REVERSE_SOLIDUS: "\\\\",
	AS: "as",
	COLON: ":",
};

export class Scope {
	public static ITEM_AND(): string {
		return `${this.STYLE_OPERATOR()} ${this.STYLE_UNDERLINE()}`;
	}

	public static ITEM_CLASS(): string {
		return `entity.name.class constant.numeric ${this.STYLE_UNDERLINE()}`;
	}

	public static ITEM_EXTERNAL(): string {
		return `entity.name.class constant.numeric ${this.STYLE_UNDERLINE()}`;
	}

	public static ITEM_INCLUDE(): string {
		return this.STYLE_OPERATOR();
	}

	public static ITEM_LET(): string {
		return `${this.STYLE_CONTROL()} ${this.STYLE_UNDERLINE()}`;
	}

	public static ITEM_METHOD(): string {
		return `${this.STYLE_BINDER()} ${this.STYLE_UNDERLINE()}`;
	}

	public static ITEM_MODULE(): string {
		return `markup.inserted constant.language support.constant.property-value entity.name.filename ${this.STYLE_UNDERLINE()}`;
	}

	public static ITEM_OPEN(): string {
		return this.STYLE_OPERATOR();
	}

	public static ITEM_TYPE(): string {
		return `${this.STYLE_KEYWORD()} ${this.STYLE_UNDERLINE()}`;
	}

	public static ITEM_VAL(): string {
		return `support.type ${this.STYLE_UNDERLINE()}`;
	}

	public static KEYWORD_AS(): string {
		return this.STYLE_OPERATOR();
	}

	public static KEYWORD_REC(): string {
		return this.STYLE_OPERATOR();
	}

	public static KEYWORD_WHEN(): string {
		return this.STYLE_OPERATOR();
	}

	public static LITERAL_OBJECT(): string {
		return `${this.STYLE_DELIMITER()} ${this.STYLE_ITALICS()}`;
	}

	public static LITERAL_SIGNATURE(): string {
		return `${this.STYLE_DELIMITER()} ${this.STYLE_ITALICS()}`;
	}

	public static LITERAL_STRUCTURE(): string {
		return `${this.STYLE_DELIMITER()} ${this.STYLE_ITALICS()}`;
	}

	public static META_COMMENT(): string {
		return "comment constant.regexp meta.separator.markdown";
	}

	public static MODULE_FUNCTOR(): string {
		return "variable.other.class.js variable.interpolation keyword.operator keyword.control message.error";
	}

	public static MODULE_SIG(): string {
		return this.STYLE_DELIMITER();
	}

	public static MODULE_STRUCT(): string {
		return this.STYLE_DELIMITER();
	}

	public static NAME_FIELD(): string {
		return `markup.inserted constant.language support.constant.property-value entity.name.filename`;
	}

	public static NAME_FUNCTION(): string {
		return `entity.name.function ${this.STYLE_BOLD()} ${this.STYLE_ITALICS()}`;
	}

	public static NAME_METHOD(): string {
		return "entity.name.function";
	}

	public static NAME_MODULE(): string {
		return "entity.name.class constant.numeric";
	}

	public static PUNCTUATION_QUOTE(): string {
		return `markup.punctuation.quote.beginning ${this.STYLE_BOLD()} ${this.STYLE_ITALICS()}`;
	}

	public static SIGNATURE_WITH(): string {
		return `${this.STYLE_OPERATOR()} ${this.STYLE_UNDERLINE()}`;
	}

	public static NAME_TYPE(): string {
		return `entity.name.function ${this.STYLE_BOLD()} ${this.STYLE_ITALICS()}`;
	}

	public static OPERATOR_TYPE(): string {
		return `${this.STYLE_OPERATOR()} ${this.STYLE_BOLD()}`;
	}

	public static PUNCTUATION_APOSTROPHE(): string {
		return `${this.VARIABLE_PATTERN()} ${this.STYLE_BOLD()} ${this.STYLE_ITALICS()}`;
	}

	public static PUNCTUATION_COLON(): string {
		return `${this.STYLE_OPERATOR()} ${this.STYLE_BOLD()}`;
	}

	public static PUNCTUATION_COMMA(): string {
		return `string.regexp ${this.STYLE_BOLD()}`;
	}

	public static PUNCTUATION_DOT(): string {
		return `${this.STYLE_KEYWORD()} ${this.STYLE_BOLD()}`;
	}

	public static PUNCTUATION_EQUALS(): string {
		return `support.type ${this.STYLE_BOLD()}`;
	}

	public static PUNCTUATION_PERCENT_SIGN(): string {
		return `${this.STYLE_OPERATOR()} ${this.STYLE_BOLD()}`;
	}

	public static STYLE_BINDER(): string {
		return "storage.type";
	}

	public static STYLE_BOLD(): string {
		return "strong";
	}

	public static STYLE_CONTROL(): string {
		return "keyword.control";
	}

	public static STYLE_DELIMITER(): string {
		return "punctuation.definition.tag";
	}

	public static STYLE_ITALICS(): string {
		return "emphasis";
	}

	public static STYLE_KEYWORD(): string {
		return "keyword";
	}

	public static STYLE_OPERATOR(): string {
		return "variable.other.class.js message.error variable.interpolation string.regexp";
	}

	public static STYLE_PUNCTUATION(): string {
		return "string.regexp";
	}

	public static STYLE_UNDERLINE(): string {
		return "markup.underline";
	}

	public static TERM_BUILTIN(): string {
		return this.STYLE_OPERATOR();
	}

	public static TERM_CHARACTER(): string {
		return "markup.punctuation.quote.beginning";
	}

	public static TERM_CONSTRUCTOR(): string {
		return `constant.language constant.numeric entity.other.attribute-name.id.css ${this.STYLE_BOLD()}`;
	}

	public static TERM_FUN(): string {
		return this.STYLE_BINDER();
	}

	public static TERM_FUNCTION(): string {
		return this.STYLE_BINDER();
	}

	public static TERM_IF(): string {
		return this.STYLE_CONTROL();
	}

	public static TERM_IN(): string {
		return `${this.STYLE_BINDER()} ${this.STYLE_UNDERLINE()}`;
	}

	public static TERM_LET(): string {
		return `${this.STYLE_BINDER()} ${this.STYLE_UNDERLINE()}`;
	}

	public static TERM_MODULE(): string {
		return "markup.inserted constant.language support.constant.property-value entity.name.filename";
	}

	public static TERM_NUMBER(): string {
		return "constant.numeric";
	}

	public static TERM_STRING(): string {
		return "string beginning.punctuation.definition.quote.markdown";
	}

	public static TYPE_CONSTRUCTOR(): string {
		return `entity.name.function ${this.STYLE_BOLD()}`;
	}

	public static VARIABLE_PATTERN(): string {
		return `string.other.link variable.language variable.parameter ${this.STYLE_ITALICS()}`;
	}

	public static VARIABLE_TYPE(): string {
		return `${this.STYLE_CONTROL()} ${this.STYLE_ITALICS()}`;
	}

	public static VERTICAL_LINE(): string {
		return `support.type ${this.STYLE_BOLD()}`;
	}
}

export interface IGrammar {
}

export interface IRender {
	render(): schema.IGrammar;
}

export interface ILanguage extends IGrammar, IRender { }