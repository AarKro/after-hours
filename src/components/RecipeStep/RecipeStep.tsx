import styles from './RecipeStep.module.scss'

interface RecipeStepsProps {
  steps: string[]
}

/** Numbered method list (Figma › recipe-step). */
export function RecipeSteps({ steps }: RecipeStepsProps) {
  return (
    <ol className={styles.list}>
      {steps.map((step, index) => (
        <li key={step} className={styles.step}>
          <span className={styles.badge} aria-hidden="true">
            {index + 1}
          </span>
          <p className={styles.instruction}>{step}</p>
        </li>
      ))}
    </ol>
  )
}
