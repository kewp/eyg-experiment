import { TokenRule } from '../../lib/tokenizer.ts';

// Token types
export const TokenTypes = {
    NUMBER: 'number',
    PLUS: 'plus',
    IDENTIFIER: 'identifier',
    EQUALS: 'equals',
    LET: 'let',
    NEWLINE: 'newline'
} as const;

export type TokenType = typeof TokenTypes[keyof typeof TokenTypes];

// Token rules for MyEYG language
export const rules: TokenRule[] = [
    // Whitespace and newlines
    new TokenRule(/[ \t\n\r]+/, null, () => null),  // Explicitly return null to skip token

    // Numbers
    new TokenRule(/[0-9]+/, TokenTypes.NUMBER),

    // Identifiers and keywords
    new TokenRule(/[a-zA-Z_][a-zA-Z0-9_]*/, TokenTypes.IDENTIFIER, (value: string) => {
        // Special handling for keywords
        if (value === 'let') {
            return { type: TokenTypes.LET, value };
        }
        return { type: TokenTypes.IDENTIFIER, value };
    }),

    // Operators
    new TokenRule(/\+/, TokenTypes.PLUS),
    new TokenRule(/=/, TokenTypes.EQUALS),
];
