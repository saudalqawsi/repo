import { fill, type Dict, type Locale } from '@/lib/i18n'
import { formatSar } from '@/lib/catalog'

export type ContractInput = {
  items: { name: string; qty: number }[]
  site: string | null
  start: string | null
  duration: string | null
  estimate: { sub: number; total: number } | null
  conditions: string[]
}

/** A non-binding sample built from the request; the real one comes from the e-contract provider. */
export function SampleContract({ locale, d, input }: { locale: Locale; d: Dict['contract']; input: ContractInput }) {
  const tbd = d.tbd
  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
  return (
    <article className="contract" aria-label={d.title}>
      <header>
        <b>{d.title}</b>
        <span className="tag">{locale === 'ar' ? 'نموذج' : 'Sample'}</span>
      </header>
      <p className="small muted">{d.note}</p>
      <ol>
        <li><h4>{d.parties}</h4><p>{d.partiesText}</p></li>
        <li>
          <h4>{d.subject}</h4>
          <p>{d.subjectText}</p>
          <ul>
            {input.items.map((i) => (
              <li key={i.name}>{i.name} × {new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(i.qty)}</li>
            ))}
          </ul>
        </li>
        <li><h4>{d.site}</h4><p>{input.site || tbd}</p></li>
        <li><h4>{d.term}</h4><p>{fill(d.termText, { start: input.start ? fmtDate(input.start) : tbd, duration: input.duration || tbd })}</p></li>
        <li>
          <h4>{d.price}</h4>
          <p>{input.estimate ? fill(d.priceText, { sub: formatSar(input.estimate.sub, locale), total: formatSar(input.estimate.total, locale) }) : d.priceOnRequest}</p>
        </li>
        <li><h4>{d.included}</h4><p>{d.includedText}</p></li>
        <li>
          <h4>{d.duties}</h4>
          <p>{d.dutiesText}</p>
          {input.conditions.length ? <p className="small muted">{d.conditions}: {input.conditions.join(locale === 'ar' ? '، ' : ', ')}</p> : null}
        </li>
        <li><h4>{d.handover}</h4><p>{d.handoverText}</p></li>
        <li><h4>{d.payment}</h4><p>{d.paymentText} <span className="pending">{d.pending}</span></p></li>
        <li><h4>{d.signing}</h4><p>{d.signingText} <span className="pending">{d.pending}</span></p></li>
      </ol>
    </article>
  )
}
