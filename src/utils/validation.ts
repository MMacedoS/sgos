const onlyDigits = (value: string): string => value.replace(/\D/g, '')

export const isValidCPF = (value: string): boolean => {
  const cpf = onlyDigits(value)

  if (cpf.length !== 11 || /(\d)\1{10}/.test(cpf)) {
    return false
  }

  let sum = 0
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index)
  }

  let digit = (sum * 10) % 11
  if (digit === 10) {
    digit = 0
  }

  if (digit !== Number(cpf[9])) {
    return false
  }

  sum = 0
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index)
  }

  digit = (sum * 10) % 11
  if (digit === 10) {
    digit = 0
  }

  return digit === Number(cpf[10])
}

export const isValidPhoneBR = (value: string): boolean => {
  const phone = onlyDigits(value)
  const thirdDigit = phone.charAt(2)

  if (phone.length !== 10 && phone.length !== 11) {
    return false
  }

  if (/(\d)\1{9,10}/.test(phone)) {
    return false
  }

  const ddd = Number(phone.slice(0, 2))
  if (ddd < 11 || ddd > 99) {
    return false
  }

  if (phone.length === 11) {
    return thirdDigit === '9'
  }

  return ['2', '3', '4', '5'].includes(thirdDigit)
}

const currencyPattern = /^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/

export const parseCurrencyBRL = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const normalized = value.trim().replace(/\s+/g, '').replace(/^R\$/, '')
  if (!normalized) {
    return null
  }

  if (!currencyPattern.test(normalized)) {
    return null
  }

  const numericValue = Number(normalized.replace(/\./g, '').replace(',', '.'))

  return Number.isFinite(numericValue) ? numericValue : null
}

export const isValidCurrencyBRL = (value: string | number | null | undefined): boolean => {
  return parseCurrencyBRL(value) !== null
}