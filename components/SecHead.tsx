import { LoaderMark } from './Logo'

/** Centred section heading: light eyebrow, bold title, dotted rule with the loader mark. */
export function SecHead({ id, eyebrow, title, lead, dark }: { id?: string; eyebrow: string; title: string; lead?: string; dark?: boolean }) {
  return (
    <header className={`sh${dark ? ' sh-dark' : ''}`}>
      <p className="sh-eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      <Divider />
      {lead ? <p className="sh-lead">{lead}</p> : null}
    </header>
  )
}

export function Divider() {
  return (
    <span className="divider" aria-hidden="true">
      <i />
      <LoaderMark size={30} color="var(--sun)" />
      <i />
    </span>
  )
}
