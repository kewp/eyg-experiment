function assert(condition, message) {
    if (!condition) {
        throw new Error('Assertion failed: ' + message);
    }
}

// Basic building blocks for defining grammars
export class Rule {
    constructor(name, pattern) {
        assert(typeof name === 'string', 'Rule name must be a string');
        assert(pattern !== undefined, 'Rule pattern cannot be undefined');
        this.name = name;
        this.pattern = pattern;
    }
}

export class Sequence {
    constructor(...patterns) {
        assert(patterns.length > 0, 'Sequence must have at least one pattern');
        patterns.forEach((p, i) => assert(p !== undefined, `Pattern ${i} in sequence cannot be undefined`));
        this.patterns = patterns;
    }
}

export class Alternative {
    constructor(...patterns) {
        assert(patterns.length > 0, 'Alternative must have at least one pattern');
        patterns.forEach((p, i) => assert(p !== undefined, `Pattern ${i} in alternative cannot be undefined`));
        this.patterns = patterns;
    }
}

export class Optional {
    constructor(pattern) {
        assert(pattern !== undefined, 'Optional pattern cannot be undefined');
        this.pattern = pattern;
    }
}

export class Many {
    constructor(pattern) {
        assert(pattern !== undefined, 'Many pattern cannot be undefined');
        this.pattern = pattern;
    }
}

export class Token {
    constructor(type) {
        assert(typeof type === 'string', 'Token type must be a string');
        this.type = type;
    }
}

// Grammar class that uses these building blocks
export class Grammar {
    constructor(rules, actions, debug = false) {
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

    parse(tokens, startRule = 'program') {
        assert(Array.isArray(tokens), 'Tokens must be an array');
        tokens.forEach((token, i) => {
            assert(typeof token === 'object', `Token ${i} must be an object`);
            assert('type' in token, `Token ${i} must have a type`);
            assert('value' in token, `Token ${i} must have a value`);
        });

        let current = 0;

        const log = (...args) => {
            if (this.debug) console.log(...args);
        };

        const validateResult = (result, context) => {
            if (result === null) return null;
            if (Array.isArray(result)) {
                result.forEach((r, i) => validateResult(r, `${context}[${i}]`));
                return result;
            }
            if (typeof result === 'object') {
                assert('type' in result || '0' in result,
                    `Invalid result in ${context}: ${JSON.stringify(result)}`);
                return result;
            }
            throw new Error(`Unexpected result type in ${context}: ${typeof result}`);
        };

        const parsePattern = (pattern, context) => {

            log(`Parsing pattern ${pattern?.constructor?.name} in context ${context} at position ${current}`);

            if (current >= tokens.length) {
              log(`End of input at ${context}`);
              return null;
            }

            if (pattern instanceof Token) {
                assert(typeof pattern.type === 'string', 'Token type must be string');
                assert(tokens[current], `No more tokens at position ${current}`);
                if (tokens[current].type === pattern.type) {
                    const token = tokens[current++];
                    log(`✓ Matched ${token.type}: ${token.value}`);
                    return token;
                }
                return null;
            }

            if (pattern instanceof Sequence) {
                  log(`Starting sequence in ${context}`);
                const results = [];
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
                //   log(`Starting alternative in ${context}`);
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
                //   log(`Starting optional in ${context}`);
                return parsePattern(pattern.pattern, `${context}/optional`) || null;
            }

            if (pattern instanceof Many) {
                //   log(`Starting many in ${context}`);
                const results = [];
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

        const parseRule = (ruleName, context) => {

            assert(this.rules.has(ruleName), `Unknown rule: ${ruleName}`);
            log(`\nParsing rule ${ruleName} at position ${current}`);

            const pattern = this.rules.get(ruleName);
            const result = parsePattern(pattern, ruleName);

            if (result !== null) {
                const action = this.actions[ruleName];
                if (action) {
                    const actionResult = action(result);
                    assert(actionResult !== null,
                        `Action ${ruleName} returned null for ${JSON.stringify(result)}`);
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
        assert('0' in finalResult, 'Final result must be a valid AST node');
        return finalResult;
    }
}