import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { Icon } from '@/components/Icon/Icon'
import styles from './FormField.module.scss'

interface BaseProps {
  id: string
  label: string
  error?: string
  /** Helper text under the field (hidden while an error is shown). */
  hint?: ReactNode
}

type InputFieldProps = BaseProps & { multiline?: false } & InputHTMLAttributes<HTMLInputElement>
type TextareaFieldProps = BaseProps & {
  multiline: true
} & TextareaHTMLAttributes<HTMLTextAreaElement>

/**
 * Labelled text input / textarea with error + hint, based on Figma › form-input-text
 * and form-input-text-area (states: default, focus, error, disabled).
 */
export function FormField(props: InputFieldProps | TextareaFieldProps) {
  const { id, label, error, hint, required } = props
  const messageId = `${id}-message`
  const message = error ?? hint
  const describedBy = message ? messageId : undefined

  const controlProps = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    className: styles.control,
  }

  return (
    <div className={[styles.field, error && styles.invalid].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span aria-hidden="true">*</span>}
      </label>

      {props.multiline ? (
        <div className={styles.textareaWrap}>
          <textarea {...stripOwnProps(props)} {...controlProps} />
          <Icon name="corner" className={styles.corner} />
        </div>
      ) : (
        <input {...stripOwnProps(props)} {...controlProps} />
      )}

      {message && (
        <p id={messageId} className={error ? styles.error : styles.hint}>
          {message}
        </p>
      )}
    </div>
  )
}

function stripOwnProps<T extends BaseProps & { multiline?: boolean }>(props: T) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, label, error, hint, multiline, ...rest } = props
  return rest
}
