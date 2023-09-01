function createFunction(template: string, state: Record<string, any>) {
  const keys = Object.keys(state);
  const values = Object.values(state);
  const fn = new Function(...keys, `return ${template}`);
  const result = fn(...values);

  return result;
}

const result = createFunction(`a > 5`, { a: 6 });

console.log({ result });
