import type { Dict, Locale } from '@/lib/i18n'
import { RIYAL_PATH } from './Icons'

/** Signed contract: a page with a signature stroke and a pen. */
function ContractSign() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z" />
      <path d="M14 3v5h5M8 12h7M8 15.5c1.2-1.6 2-1.6 2.6 0s1.4 1.6 2.4-.2" />
    </svg>
  )
}
function Riyal() {
  return (
    <svg viewBox="40 0 1145 1270" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d={RIYAL_PATH} />
    </svg>
  )
}

/** The two steps that follow a provider's acceptance. Both partners are still being chosen, so each icon shows a waiting ring. */
export function NextSteps({ d, state = 'pending' }: { d: Dict['after']; locale?: Locale; state?: 'pending' | 'waiting' }) {
  const steps = [
    { icon: <ContractSign />, t: d.contract, p: d.contractText },
    { icon: <Riyal />, t: d.payment, p: d.paymentText },
  ]
  return (
    <section className="next-steps" aria-label={d.title}>
      <b className="sub-h">{d.title}</b>
      <ol>
        {steps.map((s) => (
          <li key={s.t}>
            <span className="ns-icon" aria-hidden="true">{s.icon}</span>
            <div>
              <h4>{s.t}</h4>
              <p>{s.p}</p>
            </div>
            <span className="soon">{state === 'waiting' ? d.waiting : d.soon}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
