import styles from './Spinner.module.css'

interface ISpinnerProps {
    className?: string
    style?: React.CSSProperties
}

export const Spinner: React.FC<ISpinnerProps> = ({ className, style }) => (
    <div
        className={className ? `${styles.spinner} ${className}` : styles.spinner}
        aria-hidden
        style={style}
    />
)
