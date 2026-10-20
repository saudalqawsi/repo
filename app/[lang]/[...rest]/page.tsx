import { notFound } from 'next/navigation'

// Unknown paths render the localised 404 inside the layout, per request, so the CSP nonce applies.
export default function CatchAll() {
  notFound()
}
