import { Token as TokenType } from './tokenizer.ts';

// Types for grammar components
export type Pattern = Rule | Sequence | Alternative | Optional | Many | TokenPattern | string;

export interface ASTNode {
  "0": string;
  [key: string]: any;
}

export type Action = (result: any) => ASTNode;

export interface Actions {
  [key: string]: Action;
}

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error('Assertion failed: ' + message);
    }
}

// Basic building blocks for defining grammars
export class Rule {
    name: string;
    pattern: Pattern;

    constructor(name: string, pattern: Pattern) {
        assert(typeof name === 'string', 'Rule name must be a string');
        assert(pattern !== undefined, 'Rule pattern cannot be undefined');
        this.name = name;
        this.pattern = pattern;
    }
}

export class Sequence {
    patterns: Pattern[];

    constructor(...patterns: Pattern[]) {
        assert(patterns.length > 0, 'Sequence must have at least one pattern');
        patterns.forEach((p, i) => assert(p !== undefined, `Pattern ${i} in sequence cannot be undefined`));
        this.patterns = patterns;
    }
}

export class Alternative {
    patterns: Pattern[];

    constructor(...patterns: Pattern[]) {
        assert(patterns.length > 0, 'Alternative must have at least one pattern');
        patterns.forEach((p, i) => assert(p !== undefined, `Pattern ${i} in alternative cannot be undefined`));
        this.patterns = patterns;
    }
}

export class Optional {
    pattern: Pattern;

    constructor(pattern: Pattern) {
        assert(pattern !== undefined, 'Optional pattern cannot be undefined');
        this.pattern = pattern;
    }
}

export class Many {
    pattern: Pattern;

    constructor(pattern: Pattern) {
        assert(pattern !== undefined, 'Many pattern cannot be undefined');
        this.pattern = pattern;
    }
}

export class TokenPattern {
    type: string;

    constructor(type: string) {
        assert(typeof type === 'string', 'Token type must be a string');
        this.type = type;
    }
}

// Grammar class that uses these building blocks
export class Grammar {
    private rules: Map<string, Pattern>;
    private actions: Actions;
    private debug: boolean;

    constructor(rules: Rule[], actions: Actions, debug: boolean = false) {
        assert(Array.isArray(rules), 'Rules must be an array');
        assert(typeof actions === 'object', 'Actions must be an object');

        // Validate rules and actions match
        const ruleNames = new Set(rules.map(r => r.name));
        Object.keys(actions).forEach(name => {
            assert(ruleNames.has(name), `Action defined for non-existent rule: ${name}`);
        });

        this.rules = new Map(rules.map(rule => [rule.name, rule.pattern]));
        this.actions = actions;
        this.debug = debug;
    }

    parse(tokens: TokenType[], startRule: string = 'program'): ASTNode {
        assert(Array.isArray(tokens), 'Tokens must be an array');
        tokens.forEach((token, i) => {
            if (typeof token !== 'object') throw new Error(`Token ${i} must be an object`);
            if (!('type' in token)) throw new Error(`Token ${i} must have a type`);
            if (!('value' in token)) throw new Error(`Token ${i} must have a value`);
        });

        let current = 0;

        const log = (...args: any[]): void => {
            if (this.debug) console.log(...args);
        };

        const validateResult = (result: any, context: string): any => {
            if (result === null) return null;
            if (Array.isArray(result)) {
                result.forEach((r, i) => validateResult(r, `${context}[${i}]`));
                return result;
            }
            if (typeof result === 'object') {
                if (!('type' in result || '0' in result)) {
                    throw new Error(`Invalid result in ${context}: ${JSON.stringify(result)}`);
                }
                return result;
            }
            throw new Error(`Unexpected result type in ${context}: ${typeof result}`);
        };

        const parsePattern = (pattern: Pattern, context: string): any => {
            log(`Parsing pattern ${pattern?.constructor?.name} in context ${context} at position ${current}`);

            if (current >= tokens.length) {
              log(`End of input at ${context}`);
              return null;
            }

            if (pattern instanceof TokenPattern) {
                if (typeof pattern.type !== 'string') throw new Error('Token type must be string');
                if (!tokens[current]) throw new Error(`No more tokens at position ${current}`);
                if (tokens[current].type === pattern.type) {
                    const token = tokens[current++];
                    log(`✓ Matched ${token.type}: ${token.value}`);
                    return token;
                }
                return null;
            }

            if (pattern instanceof Sequence) {
                log(`Starting sequence in ${context}`);
                const results: any[] = [];
                const startPos = current;

                for (const p of pattern.patterns) {
                    const result = parsePattern(p, `${context}/sequence`);
                    if (result === null) {
                        log(`Sequence failed at ${context}, resetting to ${startPos}`);
                        current = startPos;
                        return null;
                    }
                    results.push(result);
                }

                return validateResult(results, `sequence/${context}`);
            }

            if (pattern instanceof Alternative) {
                const startPos = current;

                for (const p of pattern.patterns) {
                    const result = parsePattern(p, `${context}/alternative`);
                    if (result !== null) {
                        return validateResult(result, `alternative/${context}`);
                    }
                    current = startPos;
                }

                return null;
            }

            if (pattern instanceof Optional) {
                return parsePattern(pattern.pattern, `${context}/optional`) || null;
            }

            if (pattern instanceof Many) {
                const results: any[] = [];
                while (current < tokens.length) {
                    const result = parsePattern(pattern.pattern, `${context}/many`);
                    if (result === null) break;
                    results.push(result);
                }
                return results;
            }

            if (typeof pattern === 'string') {
                // Reference to another rule
                return parseRule(pattern, `${context}/rule`);
            }

            throw new Error(`Unknown pattern type: ${pattern}`);
        };

        const parseRule = (ruleName: string, context: string): any => {
            assert(this.rules.has(ruleName), `Unknown rule: ${ruleName}`);
            log(`\nParsing rule ${ruleName} at position ${current}`);

            const pattern = this.rules.get(ruleName);
            const result = parsePattern(pattern!, ruleName);

            if (result !== null) {
                const action = this.actions[ruleName];
                if (action) {
                    const actionResult = action(result);
                    if (actionResult === null) {
                        throw new Error(`Action ${ruleName} returned null for ${JSON.stringify(result)}`);
                    }
                    log(`Action result for ${ruleName}:`, actionResult);
                    return validateResult(actionResult, `action/${ruleName}`);
                }
                return result;
            }
            return null;
        };

        const finalResult = parseRule(startRule, 'start');

        // Final validation
        if (finalResult === null) {
            throw new Error('Failed to parse input');
        }

        if (current < tokens.length) {
            throw new Error(`Not all tokens consumed. Remaining: ${JSON.stringify(tokens.slice(current))}`);
        }

        // Validate AST structure
        if (!('0' in finalResult)) {
            throw new Error('Final result must be a valid AST node');
        }
        return finalResult;
    }
}
