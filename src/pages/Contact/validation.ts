export interface ContactValues {
  firstName: string
  lastName: string
  email: string
  message: string
}

export type ContactField = keyof ContactValues
export type ContactErrors = Partial<Record<ContactField, string>>

export const FIELD_ORDER: ContactField[] = ['firstName', 'lastName', 'email', 'message']

export const LIMITS = {
  nameMaxLength: 50,
  messageMinLength: 10,
  messageMaxLength: 1000,
} as const

// Pragmatic check: something@something.tld, no spaces. The server should do the real check.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const validators: Record<ContactField, (value: string) => string | undefined> = {
  firstName: (value) => validateName(value, 'first name'),
  lastName: (value) => validateName(value, 'last name'),
  email: (value) => {
    if (!value) return 'Please enter your e-mail address.'
    if (!EMAIL_PATTERN.test(value)) return 'That doesn’t look like an e-mail address yet.'
    return undefined
  },
  message: (value) => {
    if (!value) return 'Please tell us what’s on your mind.'
    if (value.length < LIMITS.messageMinLength)
      return `A few more words, please (at least ${LIMITS.messageMinLength} characters).`
    if (value.length > LIMITS.messageMaxLength)
      return `Please keep it under ${LIMITS.messageMaxLength} characters.`
    return undefined
  },
}

function validateName(value: string, label: string): string | undefined {
  if (!value) return `Please enter your ${label}.`
  if (value.length > LIMITS.nameMaxLength)
    return `Your ${label} can be at most ${LIMITS.nameMaxLength} characters.`
  return undefined
}

export function validateField(field: ContactField, value: string): string | undefined {
  return validators[field](value.trim())
}

export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {}
  for (const field of FIELD_ORDER) {
    const error = validateField(field, values[field])
    if (error) errors[field] = error
  }
  return errors
}
