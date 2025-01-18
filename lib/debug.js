export function debugNode(node, depth = 0) {
    const indent = '  '.repeat(depth);
    
    if (!node) {
      console.log(indent + 'null');
      return;
    }
    
    console.log(indent + `Node type: ${node['0']}`);
    
    switch (node['0']) {
      case 'i':
        console.log(indent + `Value: ${node.v}`);
        break;
      case 'v':
        console.log(indent + `Variable: ${node.l}`);
        break;
      case 'a':
        console.log(indent + 'Function:');
        debugNode(node.f, depth + 1);
        console.log(indent + 'Argument:');
        debugNode(node.a, depth + 1);
        break;
      case 'b':
        console.log(indent + `Builtin: ${node.l}`);
        break;
      case 'l':
        console.log(indent + `Let ${node.l} =`);
        console.log(indent + 'Value:');
        debugNode(node.v, depth + 1);
        console.log(indent + 'Then:');
        debugNode(node.t, depth + 1);
        break;
    }
  }
  
  export function debugState(state) {
    console.log('\nState:');
    console.log('Value mode:', state.value);
    console.log('Control:');
    debugNode(state.control);
    console.log('Stack size:', state.stack.size);
    if (state.stack.size > 0) {
      console.log('Stack top:', state.stack.first().constructor.name);
    }
    console.log('Environment:', state.env.toJS());
    console.log('---');
  }