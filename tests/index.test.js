const fs = require('fs');
const path = require('path');

describe('index.html validation', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  test('only one <html> tag exists', () => {
    const matches = html.match(/<html\b[^>]*>/g) || [];
    expect(matches).toHaveLength(1);
  });

  test('outdated-browser message contains "browser" without newline breaks', () => {
    const outdatedRegex = /<!--\[if lt IE 7\]>([\s\S]*?)<!\[endif\]-->/i;
    const match = html.match(outdatedRegex);
    expect(match).not.toBeNull();
    const snippet = match[1];
    // Check for a continuous occurrence of "browser"
    expect(snippet.includes('browser')).toBe(true);
    expect(snippet).not.toMatch(/br\s*\n\s*owser/);
  });
});
