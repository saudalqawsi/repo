import type { Dict } from '@/lib/i18n'

/** The two steps that follow an owner's acceptance. Both providers are still being chosen. */
export function NextSteps({ d, state = 'pending' }: { d: Dict['after']; state?: 'pending' | 'waiting' }) {
  return (
    <section className="next-steps" aria-label={d.title}>
      <b className="sub-h">{d.title}</b>
      <ol>
        <li>
          <div>
            <h4>{d.contract}</h4>
            <p>{d.contractText}</p>
          </div>
          <span className="soon">{state === 'waiting' ? d.waiting : d.soon}</span>
        </li>
        <li>
          <div>
            <h4>{d.payment}</h4>
            <p>{d.paymentText}</p>
          </div>
          <span className="soon">{state === 'waiting' ? d.waiting : d.soon}</span>
        </li>
      </ol>
    </section>
  )
}
