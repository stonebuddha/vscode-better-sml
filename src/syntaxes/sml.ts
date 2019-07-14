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

	// Render

	public render(): schema.IGrammar {
		return {
			name: `Standard ML`,
			scopeName: "source.sml",
			fileTypes: [".sml", ".sig"],
			patterns: [include(this.comment)],
			repository: {
				comment: this.comment(),
				commentBlock: this.commentBlock(),
				commentDoc: this.commentDoc(),
			},
		};
	}
}

export default new StandardML().render();