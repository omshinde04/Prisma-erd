export function parseEnumBlock(block) {
  const values = block.body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('//') && !line.startsWith('@'))
    .map((line) => {
      const [name] = line.split(/\s+/);
      return { name };
    });

  return {
    name: block.name,
    values,
  };
}
