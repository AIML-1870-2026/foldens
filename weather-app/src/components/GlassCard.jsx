import styles from './GlassCard.module.css'

export default function GlassCard({ title, className = '', children, loading = false }) {
  return (
    <div className={`${styles.card} ${className}`}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {loading ? (
        <div className={styles.skeletonWrapper}>
          <div className={styles.skeleton} />
          <div className={`${styles.skeleton} ${styles.skeletonMed}`} />
          <div className={`${styles.skeleton} ${styles.skeletonShort}`} />
        </div>
      ) : children}
    </div>
  )
}
