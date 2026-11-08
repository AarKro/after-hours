import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type SubmitEvent,
} from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/FormField/FormField'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { RESERVATION_INTENT } from '@/routes'
import { submitContactForm } from './submitContactForm'
import {
  FIELD_ORDER,
  LIMITS,
  validateContact,
  validateField,
  type ContactErrors,
  type ContactField,
  type ContactValues,
} from './validation'
import styles from './Contact.module.scss'

const EMPTY_VALUES: ContactValues = { firstName: '', lastName: '', email: '', message: '' }

const RESERVATION_TEMPLATE = `Hi, I’d like to reserve a table.

Date:
Time:
Number of guests: `

type Status = 'idle' | 'submitting' | 'success'

export function Contact() {
  useDocumentTitle('Contact')

  const [searchParams] = useSearchParams()
  const isReservation = searchParams.get('intent') === RESERVATION_INTENT

  const [values, setValues] = useState<ContactValues>(() => ({
    ...EMPTY_VALUES,
    message: isReservation ? RESERVATION_TEMPLATE : '',
  }))
  const [errors, setErrors] = useState<ContactErrors>({})
  const [dirty, setDirty] = useState<Partial<Record<ContactField, boolean>>>({})
  const [attempted, setAttempted] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [submittedName, setSubmittedName] = useState('')

  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLHeadingElement>(null)

  // Clicking "reserve a table" while already here: prefill if the message is still empty.
  const [wasReservation, setWasReservation] = useState(isReservation)
  if (isReservation !== wasReservation) {
    setWasReservation(isReservation)
    if (isReservation && !values.message.trim()) {
      setValues({ ...values, message: RESERVATION_TEMPLATE })
    }
  }

  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
  }, [status])

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = event.target.name as ContactField
    const { value } = event.target
    setValues((current) => ({ ...current, [field]: value }))
    setDirty((current) => ({ ...current, [field]: true }))
    // Once a field has shown an error (or the user tried to submit), keep it live.
    if (attempted || errors[field]) {
      setErrors((current) => ({ ...current, [field]: validateField(field, value) }))
    }
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = event.target.name as ContactField
    if (!dirty[field] && !attempted) return
    setErrors((current) => ({ ...current, [field]: validateField(field, event.target.value) }))
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAttempted(true)

    const nextErrors = validateContact(values)
    setErrors(nextErrors)
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field])
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }

    setStatus('submitting')
    await submitContactForm(values)
    setSubmittedName(values.firstName.trim())
    setStatus('success')
  }

  const reset = () => {
    setValues(EMPTY_VALUES)
    setErrors({})
    setDirty({})
    setAttempted(false)
    setStatus('idle')
  }

  const fieldProps = (field: ContactField) => ({
    id: `contact-${field}`,
    name: field,
    value: values[field],
    error: errors[field],
    onChange: handleChange,
    onBlur: handleBlur,
    required: true,
    readOnly: status === 'submitting',
  })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.intro}>
          Questions, private events or a big table for your birthday? Write to us and we’ll get back
          within 48 hours.
        </p>
      </header>

      {status === 'success' ? (
        <div className={styles.success} role="status">
          <h2 ref={successRef} tabIndex={-1} className={styles.successTitle}>
            Thanks, {submittedName}!
          </h2>
          <p className={styles.successText}>
            Your message is on its way. We’ll get back to you within 48 hours. In the meantime, the
            bar is open from Tuesday.
          </p>
          <Button variant="secondary-outlined" onClick={reset}>
            send another message
          </Button>
        </div>
      ) : (
        <form ref={formRef} className={styles.form} noValidate onSubmit={handleSubmit}>
          <div className={styles.nameRow}>
            <FormField
              {...fieldProps('firstName')}
              label="first name"
              placeholder="Jane"
              autoComplete="given-name"
              maxLength={LIMITS.nameMaxLength}
            />
            <FormField
              {...fieldProps('lastName')}
              label="last name"
              placeholder="Doe"
              autoComplete="family-name"
              maxLength={LIMITS.nameMaxLength}
            />
          </div>
          <FormField
            {...fieldProps('email')}
            label="e-mail"
            type="email"
            inputMode="email"
            placeholder="jane@example.com"
            autoComplete="email"
          />
          <FormField
            {...fieldProps('message')}
            multiline
            label="message"
            placeholder="tell us what’s on your mind…"
            rows={6}
            maxLength={LIMITS.messageMaxLength}
            hint={`${values.message.length} / ${LIMITS.messageMaxLength}`}
          />

          <Button type="submit" fullWidth disabled={status === 'submitting'}>
            {status === 'submitting' ? 'sending…' : 'send'}
          </Button>
        </form>
      )}
    </div>
  )
}
