// Generic parser base class
export class Parser {
  constructor(nodeTypes) {
    this.nodeTypes = nodeTypes;
  }
  
  parse(tokens) {
    this.tokens = tokens;
    this.current = 0;
    return this.parseNode();
  }
  
  // Helper methods
  peek() {
    return this.tokens[this.current];
  }
  
  next() {
    return this.tokens[this.current++];
  }
  
  isAtEnd() {
    return this.current >= this.tokens.length;
  }
  
  // Override these in specific language implementations
  parseNode() {
    throw new Error('parseNode must be implemented by subclass');
  }
  
  createNode(type, props) {
    if (!this.nodeTypes[type]) {
      throw new Error(`Unknown node type: ${type}`);
    }
    return this.nodeTypes[type](props);
  }
  
  // Validation
  validateNode(node, context) {
    if (!node || typeof node !== 'object') {
      throw new Error(`Invalid node in ${context}`);
    }
    
    if (!('0' in node)) {
      throw new Error(`Node missing type in ${context}`);
    }
    
    const validator = this.nodeTypes[node['0']]?.validate;
    if (validator) {
      validator(node, context);
    }
    
    return true;
  }
}