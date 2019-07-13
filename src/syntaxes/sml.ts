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

	// Constants

	public constant(): schema.Rule {
		return {
			patterns: [
				{
					match: alt(this.constantWord(), this.constantHexInt(), this.constantFloatOrInt()),
					name: Scope.TERM_NUMBER(),
				},
				{
					match: this.constantChar(),
					name: Scope.TERM_CHARACTER(),
				},
				include(this.constantString),
			],
		};
	}

	public constantHexInt(): string {
		return seq(opt(Token.TILDE), `0x`, this.constantHex());
	}

	public constantWord(): string {
		return alt(
			seq(`0wx`, this.constantHex()),
			seq(`0w`, this.constantNum()),
		);
	}

	public constantFloatOrInt(): string {
		return seq(opt(Token.TILDE), this.constantNum(), opt(group(seq(Token.DOT, this.constantNum(), opt(group(seq(`e`, opt(Token.TILDE), this.constantNum())))))));
	}

	public constantChar(): string {
		return seq(Token.HASH, Token.DQUATATION_MARK, group(alt(this.escape(), set(Class.ascii))), Token.DQUATATION_MARK);
	}

	public constantString(): schema.Rule {
		return {
			patterns: [
				{
					begin: Token.DQUATATION_MARK,
					end: Token.DQUATATION_MARK,
					name: Scope.TERM_STRING(),
					patterns: [
						{
							match: this.escape(),
						},
					],
				},
			],
		};
	}

	public escape(): string {
		return seq(
			Token.REVERSE_SOLIDUS,
			group(
				alt(
					set(Token.REVERSE_SOLIDUS, Token.DQUATATION_MARK, ...["n", "t", "b", "r"]),
					seq(set(Class.digit), set(Class.digit), set(Class.digit)),
					seq("x", set(Class.xdigit), set(Class.xdigit)),
					seq("o", set("0-3"), set("0-7"), set("0-7")),
				),
			),
		);
	}

	public constantNum(): string {
		return manyOne(set(Class.digit));
	}

	public constantHex(): string {
		return manyOne(set(Class.xdigit));
	}

	// Identifiers

	public boundary(): string {
		return `\\b`;
	}

	public ident(): string {
		return seq(set(Class.alpha), many(set(Class.word, `'`)));
	}

	public symbols(): string[] {
		return ["!", "%", "&", "$", "#", "+", "\\-", "/", ":", "<", "=", ">", "?", "@", "\\\\", "~", "`", "\\^", "|", "*"];
	}

	public symbolic(): string {
		return manyOne(set(...this.symbols()));
	}

	public tyvar(): string {
		return manyOne(set(Class.word, `'`));
	}

	public ops(arg: string): string {
		return seq(
			negativeLookBehind(set(...this.symbols())),
			arg,
			negativeLookAhead(set(...this.symbols())),
		);
	}

	public lastOps(...rest: string[]): string {
		const result: string[] = [];
		for (const token of rest) {
			result.push(`[^${seq(...this.symbols())}]${token}`, `^${token}`);
		}
		return group(seq(lookBehind(group(alt(...result))), negativeLookAhead(set(...this.symbols()))));
	}

	// Patterns

	public pat(): schema.Rule {
		return {
			patterns: [
				include(this.constant),
				include(this.patParen),
				include(this.patIdentifier),
			]
		};
	}

	public patStartTokens(): string[] {
		return [Token.LPAREN, Token.LBRACKET, Token.LBRACE, set(Class.word), set(...this.symbols()), Token.DQUATATION_MARK];
	}

	public patIdentifier(): schema.Rule {
		return {
			patterns: [
				{
					match: alt(seq(this.boundary(), this.ident())),
					name: Scope.VARIABLE_PATTERN(),
				},
				{
					match: Token.WILD,
					name: Scope.META_COMMENT(),
				},
				{
					match: this.symbolic(),
					name: Scope.OPERATOR_TYPE(),
				},
			],
		};
	}

	public patParen(): schema.Rule {
		return {
			begin: seq(Token.LPAREN, negativeLookAhead(Token.RPAREN)),
			end: Token.RPAREN,
			captures: {
				0: { name: Scope.STYLE_DELIMITER() },
			},
			patterns: [
				include(this.comment),
				include(this.pat),
			],
		};
	}

	// Expressions

	public exp(): schema.Rule {
		return {
			patterns: [
				include(this.constant),
			],
		};
	}

	// Declarations

	public dec(): schema.Rule {
		return {
			patterns: [
				include(this.decVal),
			],
		};
	}

	public decStartTokens(): string[] {
		return [Token.VAL, Token.FUN, Token.TYPE, Token.DATATYPE, Token.ABSTYPE, Token.EXCEPTION, Token.STRUCTURE, Token.LOCAL, Token.OPEN, Token.NONFIX, Token.INFIX, Token.INFIXR];
	}

	public decEnd(): string {
		return alt(
			Token.SEMICOLON,
			lookAhead(
				alt(
					Token.RPAREN,
					words(group(alt(Token.IN, Token.END, ...this.decStartTokens()))),
				),
			),
		);
	}

	public decWillEnd(): string {
		return lookAhead(
			alt(
				Token.SEMICOLON,
				Token.RPAREN,
				words(group(alt(Token.IN, Token.END, ...this.decStartTokens()))),
			),
		);
	}

	public decVal(): schema.Rule {
		return {
			begin: words(Token.VAL),
			end: this.decEnd(),
			beginCaptures: {
				0: { name: Scope.ITEM_VAL() },
			},
			endCaptures: {
				0: { name: Scope.STYLE_DELIMITER() },
			},
			patterns: [
				include(this.comment),
				{
					match: seq(capture(Token.APOSTROPHE), capture(this.tyvar())),
					captures: {
						1: { name: Scope.PUNCTUATION_APOSTROPHE() },
						2: { name: Scope.VARIABLE_TYPE() },
					},
				},
				{
					begin: seq(Token.LPAREN, lookAhead(seq(many(set(Class.space)), Token.APOSTROPHE))),
					end: Token.RPAREN,
					captures: {
						0: { name: Scope.STYLE_DELIMITER() },
					},
					patterns: [
						include(this.comment),
						{
							match: seq(capture(Token.APOSTROPHE), capture(this.tyvar())),
							captures: {
								1: { name: Scope.PUNCTUATION_APOSTROPHE() },
								2: { name: Scope.VARIABLE_TYPE() },
							},
						},
						{
							match: Token.COMMA,
							name: Scope.STYLE_OPERATOR(),
						}
					],
				},
				{
					match: words(Token.REC),
					name: Scope.KEYWORD_REC(),
				},
				{
					begin: lookAhead(alt(...this.patStartTokens())),
					end: this.decWillEnd(),
					patterns: [
						include(this.comment),
						include(this.bindVal),
					],
				},
			],
		};
	}

	// Bindings

	public bindVal(): schema.Rule {
		return {
			patterns: [
				{
					begin: alt(lastWords(Token.AND), lookAhead(alt(...this.patStartTokens()))),
					end: this.ops(Token.EQUALOP),
					endCaptures: {
						0: { name: Scope.PUNCTUATION_EQUALS() },
					},
					patterns: [
						include(this.comment),
						include(this.pat),
					],
				},
				{
					begin: this.lastOps(Token.EQUALOP),
					end: alt(words(Token.AND), this.decWillEnd()),
					endCaptures: {
						0: { name: Scope.ITEM_AND() },
					},
					patterns: [
						include(this.comment),
						include(this.exp),
					],
				},
			],
		};
	}

	// Render

	public render(): schema.IGrammar {
		return {
			name: `Standard ML`,
			scopeName: "source.sml",
			fileTypes: [".sml", ".sig"],
			patterns: [include(this.comment), include(this.dec)],
			repository: {
				comment: this.comment(),
				commentBlock: this.commentBlock(),
				commentDoc: this.commentDoc(),

				constant: this.constant(),
				constantString: this.constantString(),

				pat: this.pat(),
				patIdentifier: this.patIdentifier(),

				exp: this.exp(),

				dec: this.dec(),
				decVal: this.decVal(),

				bindVal: this.bindVal(),
			},
		};
	}
}

export default new StandardML().render();