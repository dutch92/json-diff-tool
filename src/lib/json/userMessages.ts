const lineColumnPattern = /\(line (\d+) column (\d+)\)/

const parserMessageTranslations: [RegExp, string][] = [
  [/Expected property name or '\}'/i, 'ожидалось имя свойства'],
  [/Unexpected end of JSON input/i, 'неожиданный конец JSON'],
  [/Unexpected token/i, 'неожиданный символ'],
]

export function formatJsonParseError(message: string) {
  const location = message.match(lineColumnPattern)
  const translatedMessage =
    parserMessageTranslations.find(([pattern]) => pattern.test(message))?.[1] ??
    message

  if (!location) {
    return `Ошибка JSON: ${translatedMessage}.`
  }

  return `Ошибка JSON: ${translatedMessage}. Строка ${location[1]}, колонка ${location[2]}.`
}

export function shouldConfirmExampleReset(leftVersion: number, rightVersion: number) {
  return leftVersion > 0 || rightVersion > 0
}
