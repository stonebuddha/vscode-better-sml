// tslint:disable object-literal-sort-keys trailing-comma

import * as basis from "./basis";
import * as schema from "./schema";

const {
	Class,
	Scope,
	Token,
	alt,
	capture,
	complement,
	group,
	include,
	lastWords,
	lookAhead,
	lookBehind,
	many,
	manyOne,
	negativeLookAhead,
	negativeLookBehind,
	opt,
	ref,
	seq,
	set,
	words,
} = basis;

export class StandardML implements basis.ILanguage {
	constructor() {
		return this;
	}

	// Comments

	public comment(): schema.Rule {
		return {
			patterns: [
				include(this.commentBlock),
				include(this.commentDoc),
			],
		};
	}

	public commentBlock(): schema.Rule {
		return {
			begin: seq(Token.LPAREN, Token.ASTERISK, negativeLookAhead(seq(Token.ASTERISK, complement(Token.RPAREN)))),
			end: seq(Token.ASTERISK, Token.RPAREN),
			name: Scope.META_COMMENT(),
			contentName: Scope.STYLE_ITALICS(),
			patterns: [include(this.commentBlock), include(this.commentDoc)],
		};
	}

	public commentDoc(): schema.Rule {
		return {
			begin: seq(Token.LPAREN, Token.ASTERISK, Token.ASTERISK),
			end: seq(Token.ASTERISK, Token.RPAREN),
			name: Scope.META_COMMENT(),
			contentName: Scope.STYLE_ITALICS(),
			patterns: [{ match: Token.ASTERISK }, include(this.comment)]
		};
	}

	// Simple keywords

	public keywords(): schema.Rule {
		return {
			patterns: [
				{
					match: words(capture(alt(Token.STRUCTURE, Token.SIGNATURE, Token.FUNCTOR, Token.FUNSIG))),
					name: Scope.ITEM_MODULE(),
				},
				{
					match: words(Token.STRUCT),
					name: Scope.LITERAL_STRUCTURE(),
				},
				{
					match: words(Token.SIG),
					name: Scope.LITERAL_SIGNATURE(),
				},
				{
					match: words(capture(alt(Token.VAL, Token.FUN))),
					name: Scope.ITEM_VAL(),
				},
				{
					match: words(capture(alt(Token.TYPE, Token.DATATYPE, Token.ABSTYPE, Token.EQTYPE, Token.EXCEPTION, Token.NONFIX, Token.INFIX, Token.INFIXR, Token.WITH))),
					name: `keyword ${Scope.STYLE_UNDERLINE()}`,
				},
				{
					match: words(Token.OPEN),
					name: Scope.ITEM_OPEN(),
				},
				{
					match: words(capture(alt(Token.LOCAL, Token.IN, Token.LET))),
					name: Scope.ITEM_LET(),
				},
				{
					match: words(Token.REC),
					name: Scope.KEYWORD_REC(),
				},
				{
					match: words(capture(alt(Token.WITHTYPE, Token.WHERE, Token.SHARING))),
					name: Scope.SIGNATURE_WITH(),
				},
				{
					match: words(Token.AND),
					name: Scope.ITEM_AND(),
				},
				{
					match: words(Token.INCLUDE),
					name: Scope.ITEM_INCLUDE(),
				},
				{
					match: words(capture(alt(Token.AS, Token.ANDALSO, Token.ORELSE))),
					name: Scope.STYLE_OPERATOR(),
				},
				{
					match: words(capture(alt(Token.IF, Token.THEN, Token.ELSE))),
					name: Scope.TERM_IF(),
				},
				{
					match: words(capture(alt(Token.CASE, Token.HANDLE, Token.RAISE, Token.WHILE, Token.DO))),
					name: Scope.STYLE_CONTROL(),
				},
				{
					match: words(Token.FN),
					name: Scope.TERM_FUN(),
				},
				{
					match: seq("\\b", Token.OP, lookAhead(group(alt("\\b", set(...this.operatorTokens()))))),
					name: Scope.STYLE_OPERATOR(),
				},
			],
		};
	}

	// Simple operators

	public operatorTokens(): string[] {
		return ["!", "%", "&", "$", "#", "+", "\\-", "/", ":", "<", "=", ">", "?", "@", "\\\\", "~", "`", "^", "|", "*"];
	}

	public ops(arg: string): string {
		return seq(
			negativeLookBehind(set(...this.operatorTokens())),
			arg,
			negativeLookAhead(set(...this.operatorTokens())),
		);
	}

	public symbols(): schema.Rule {
		return {
			patterns: [
				{
					match: Token.SEMICOLON,
					name: Scope.STYLE_OPERATOR(),
				},
				{
					match: this.ops(Token.EQUALOP),
					name: Scope.PUNCTUATION_EQUALS(),
				},
				{
					match: words(Token.WILD),
					name: Scope.META_COMMENT(),
				},
				{
					match: this.ops(Token.BAR),
					name: Scope.VERTICAL_LINE(),
				},
				{
					match: alt(Token.LCURLY, Token.RCURLY),
					name: `${Scope.TERM_CONSTRUCTOR()} ${Scope.STYLE_BOLD()}`,
				},
				{
					match: alt(Token.LSQUARE, Token.RSQUARE, Token.HASHLSQUARE),
					name: Scope.TERM_CONSTRUCTOR(),
				},
				{
					match: this.ops(Token.ARROW),
					name: Scope.PUNCTUATION_EQUALS(),
				},
				{
					match: this.ops(Token.DARROW),
					name: Scope.VERTICAL_LINE(),
				},
				{
					match: Token.DOTDOTDOT,
					name: Scope.STYLE_OPERATOR(),
				},
				{
					match: Token.DOT,
					name: Scope.PUNCTUATION_DOT(),
				},
				{
					match: Token.COMMA,
					name: Scope.PUNCTUATION_COMMA(),
				},
				{
					match: alt(Token.LPAREN, Token.RPAREN),
					name: Scope.STYLE_DELIMITER(),
				},
				{
					match: this.ops(capture(alt(Token.COLONGT, Token.COLON))),
					name: Scope.PUNCTUATION_COLON(),
				},
			],
		};
	}

	// Literals

	public literal(): schema.Rule {
		return {
			patterns: [
				include(this.literalCharacter),
				include(this.literalString),
			],
		};
	}

	public literalCharacter(): schema.Rule {
		return {
			begin: seq(Token.HASHDQUOTE),
			end: Token.DQUOTE,
			name: Scope.TERM_CHARACTER(),
			patterns: [include(this.literalStringEscape)],
		};
	}

	public literalString(): schema.Rule {
		return {
			begin: Token.DQUOTE,
			end: Token.DQUOTE,
			name: Scope.TERM_STRING(),
			patterns: [include(this.literalStringEscape)],
		};
	}

	public literalStringEscape(): schema.Rule {
		return {
			match: seq(
				Token.REVERSE_SOLIDUS,
				group(
					alt(
						seq(Token.REVERSE_SOLIDUS, Token.DQUOTE, ...["n", "t", "b", "r"]),
						seq(set(Class.digit), set(Class.digit), set(Class.digit)),
						seq("x", set(Class.xdigit), set(Class.xdigit)),
						seq("o", set("0-3"), set("0-7"), set("0-7")),
					),
				),
			),
		};
	}

	// Render

	public render(): schema.IGrammar {
		return {
			name: `Standard ML`,
			scopeName: "source.sml",
			fileTypes: [".sml", ".sig"],
			patterns: [include(this.comment), include(this.literal), include(this.keywords), include(this.symbols)],
			repository: {
				comment: this.comment(),
				commentBlock: this.commentBlock(),
				commentDoc: this.commentDoc(),

				keywords: this.keywords(),

				symbols: this.symbols(),

				literal: this.literal(),
				literalCharacter: this.literalCharacter(),
				literalString: this.literalString(),
				literalStringEscape: this.literalStringEscape(),
			},
		};
	}
}

export default new StandardML().render();