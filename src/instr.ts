export enum Type {
  F = 'function',
  N = 'number',
  B = 'boolean',
  S = 'string',
  T = 'tuple',
  L = 'list',
}

export enum CompoundType {
  T = 'tuple',
  L = 'list',
}

function isExpr(expr: unknown) {
  return Array.isArray(expr) && isOperator(expr[0]) && !isDefinition(expr[0]);
}

function isDefinition(expr: unknown) {
  if (Array.isArray(expr) && !isOperator(expr[0])) {
    switch (expr[0]) {
      case '@t': {
        return CompoundType.T;
      }
      case '@l': {
        // list must have homogenous types for its elements
        return validate(expr.slice(1), getType(expr[1]));
      }
      default: {
        return false;
      }
    }
  }
  return false;
}

function isOperator(op) {
  return operators.hasOwnProperty(op);
}

function getType(expr) {
  return isExpr(expr)
    ? operators[expr[0]]
    : isDefinition(expr)
    ? expr[0] === '@t'
      ? [expr[0], ...expr.slice(1).map(getType)]
      : [expr[0], getType(expr[1])]
    : typeof expr;
}

const operators = {
  // Numerical Operators
  ':+': [Type.N, Type.N, Type.N],
  ':-': [Type.N, Type.N, Type.N],
  ':*': [Type.N, Type.N, Type.N],
  ':/': [Type.N, Type.N, Type.N],
  ':<': [Type.N, Type.N, Type.B],
  ':>': [Type.N, Type.N, Type.B],
  ':<=': [Type.N, Type.N, Type.B],
  ':>=': [Type.N, Type.N, Type.B],
  ':=n': [Type.N, Type.N, Type.B],
  ':=s': [Type.S, Type.S, Type.B],
  // Boolean Operators
  ':||': [Type.B, Type.B, Type.B],
  ':&&': [Type.B, Type.B, Type.B],
  // Lookup Operators
  ':.': [Type.N, Type.N],
  // cast to string
  ':s': [Type.N, Type.S],
  // Conditional Operators
  ':?n': [Type.B, Type.N, Type.N, Type.N],
  ':?s': [Type.B, Type.S, Type.S, Type.S],
  ':?b': [Type.B, Type.B, Type.B, Type.B],
  ':?f': [Type.B, Type.F, Type.F, Type.F],
};
type Operator = keyof typeof operators;
export function validate(expr: unknown, type?: Type): boolean {
  // Validate operator, arguments and return type
  if (Array.isArray(expr)) {
    try {
      const [op, ...cdr] = expr;
      console.log(`Checking if (${op}) exists:`, operators.hasOwnProperty(op));
      if (operators.hasOwnProperty(op as Operator) && cdr.length === operators[op as Operator].length - 1) {
        const retType = operators[op as Operator].slice(-1)[0];
        return (!type || retType === type) && cdr.every((item, idx) => validate(item, operators[op as Operator][idx]));
      }
      console.error('unhandled operator referenced:', op);
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  const typeComparison =
    type === undefined ? [Type.F, Type.N, Type.B, Type.S].includes(typeof expr as Type) : typeof expr === type;
  if (!typeComparison) {
    console.error(expr, 'is not of type:', type);
  }
  return typeComparison;
}
