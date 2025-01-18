// Generic tokenizer base class
export class Tokenizer {
  constructor(rules) {
    this.rules = rules;
  }
  
  tokenize(input) {
    let tokens = [];
    let current = 0;
    
    while (current < input.length) {
      let matched = false;
      
      // Skip whitespace by default unless a rule specifically handles it
      if (/\s/.test(input[current]) && !this.rules.some(r => r.match.test(input[current]))) {
        current++;
        continue;
      }
      
      // Try each rule
      for (const rule of this.rules) {
        const char = input[current];
        
        // Test if rule matches
        if (rule.match.test(char)) {
          let value = '';
          
          // Keep matching if it's a multi-char rule
          while (current < input.length && rule.match.test(input[current])) {
            value += input[current];
            current++;
          }
          
          // Apply any token transformations
          const token = rule.createToken(value);
          if (token) {  // Only add token if rule returned one
            tokens.push(token);
          }
          
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        throw new Error(`Unknown character at position ${current}: ${input[current]}`);
      }
    }
    
    return tokens;
  }
}

// Helper class to define token rules
export class TokenRule {
  constructor(match, type, createToken = null) {
    this.match = match;  // RegExp to match
    this.type = type;    // Token type
    this.createToken = createToken || ((value) => ({ type, value }));
  }
}