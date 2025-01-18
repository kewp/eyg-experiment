// Node types and their validators/constructors
export const nodeTypes = {
    // Integer node
    'i': (props) => ({
      "0": "i",
      "v": props.value
    }),
    
    // Variable reference node
    'v': (props) => ({
      "0": "v",
      "l": props.name
    }),
    
    // Application node
    'a': (props) => ({
      "0": "a",
      "f": props.func,
      "a": props.arg
    }),
    
    // Builtin function node
    'b': (props) => ({
      "0": "b",
      "l": props.name
    }),
    
    // Let binding node
    'l': (props) => ({
      "0": "l",
      "l": props.name,
      "v": props.value,
      "t": props.then
    })
  };
  
  // Add validators to each node type
  nodeTypes.i.validate = (node, context) => {
    if (typeof node.v !== 'number') {
      throw new Error(`Integer node must have number value in ${context}`);
    }
  };
  
  nodeTypes.v.validate = (node, context) => {
    if (typeof node.l !== 'string') {
      throw new Error(`Variable node must have string name in ${context}`);
    }
  };
  
  nodeTypes.a.validate = (node, context) => {
    if (!node.f || !node.a) {
      throw new Error(`Apply node must have func and arg in ${context}`);
    }
  };
  
  nodeTypes.b.validate = (node, context) => {
    if (typeof node.l !== 'string') {
      throw new Error(`Builtin node must have string name in ${context}`);
    }
  };
  
  nodeTypes.l.validate = (node, context) => {
    if (!node.l || !node.v || !node.t) {
      throw new Error(`Let node must have name, value, and then in ${context}`);
    }
  };