function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function highlightJson(text: string) {
  const escaped = escapeHtml(text)

  return escaped.replace(
    /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\btrue\b|\bfalse\b|\bnull\b)/g,
    (token) => {
      let className = 'json-number'

      if (token.startsWith('"')) {
        className = token.endsWith(':') ? 'json-key' : 'json-string'
      } else if (token === 'true' || token === 'false') {
        className = 'json-boolean'
      } else if (token === 'null') {
        className = 'json-null'
      }

      return `<span class="${className}">${token}</span>`
    },
  )
}

export function highlightJsonText(text: string) {
  return text
    .split('\n')
    .map((line) => `<span class="editor-line">${highlightJson(line)}</span>`)
    .join('')
}
