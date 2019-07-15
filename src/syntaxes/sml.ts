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
					match: words(capture(alt(Token.VAL, Token.FUN))),
					name: Scope.ITEM_VAL(),
				},
				{
					match: words(capture(alt(Token.TYPE, Token.DATATYPE, Token.ABSTYPE, Token.EQTYPE, Token.EXCEPTION, Token.NONFIX, Token.INFIX, Token.INFIXR, Token.SHARING))),
					name: `keyword ${Scope.STYLE_UNDERLINE()}`,
				},
				{
					match: words(Token.OPEN),
					name: Scope.ITEM_OPEN(),
				},
				{
					match: words(Token.IN),
					name: Scope.ITEM_LET(),
				},
				{
					match: words(Token.REC),
					name: Scope.KEYWORD_REC(),
				},
				{
					match: words(capture(alt(Token.WITHTYPE, Token.WHERE, Token.WITH))),
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
					match: words(capture(alt(Token.HANDLE, Token.RAISE, Token.WHILE, Token.DO))),
					name: Scope.STYLE_CONTROL(),
				},
				{
					match: words(Token.FN),
					name: Scope.TERM_FUN(),
				},
				{
					match: words(Token.OF),
					name: Scope.STYLE_DELIMITER(),
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
					name: Scope.OPERATOR_TYPE(),
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
				{
					match: this.ops(Token.ASTERISK),
					name: Scope.STYLE_OPERATOR(),
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
						set(Token.REVERSE_SOLIDUS, Token.DQUOTE, ...["a", "b", "f", "n", "r", "t", "v"]),
						seq("^", set("@-_")),
						seq(set(Class.digit), set(Class.digit), set(Class.digit)),
						seq("u", set(Class.xdigit), set(Class.xdigit), set(Class.xdigit), set(Class.xdigit)),
					),
				),
			),
		};
	}

	// Matches

	public matches(): schema.Rule {
		return {
			patterns: [
				{
					begin: words(Token.STRUCT),
					end: words(Token.END),
					captures: {
						0: { name: Scope.LITERAL_STRUCTURE() },
					},
					patterns: [include(this.toplevel)],
				},
				{
					begin: words(Token.SIG),
					end: words(Token.END),
					captures: {
						0: { name: Scope.LITERAL_SIGNATURE() },
					},
					patterns: [include(this.toplevel)],
				},
				{
					begin: words(Token.LET),
					end: words(Token.END),
					captures: {
						0: { name: Scope.ITEM_LET() },
					},
					patterns: [include(this.toplevel)],
				},
				{
					begin: words(Token.LOCAL),
					end: words(Token.END),
					captures: {
						0: { name: Scope.ITEM_LET() },
					},
					patterns: [include(this.toplevel)],
				},
				{
					begin: words(Token.CASE),
					end: words(Token.OF),
					captures: {
						0: { name: Scope.STYLE_CONTROL() },
					},
					patterns: [include(this.toplevel)],
				},
			],
		};
	}

	// Render

	public toplevel(): schema.Rule {
		return {
			patterns: [
				include(this.comment),
				include(this.literal),
				include(this.matches),
				include(this.keywords),
				include(this.symbols),
			],
		};
	}

	public render(): schema.IGrammar {
		return {
			name: `Standard ML`,
			scopeName: "source.sml",
			fileTypes: [".sml", ".sig", ".fun"],
			patterns: [include(this.toplevel)],
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

				matches: this.matches(),

				toplevel: this.toplevel(),
			},
		};
	}
}

export default new StandardML().render();