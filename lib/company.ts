/** Registration details printed under the footer. Fill in from the official certificates. */
export const COMPANY = {
  /** الرقم الوطني الموحد — 10 digits starting with 7 */
  unn: process.env.NEXT_PUBLIC_UNN ?? '',
  /** الرقم الضريبي — 15 digits starting and ending with 3 */
  vat: process.env.NEXT_PUBLIC_VAT_NUMBER ?? '',
}
