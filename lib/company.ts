/** Registration details printed under the footer, from Pillarnova's ZATCA registration certificate. */
export const COMPANY = {
  /** CR national number (الرقم الوطني الموحد) */
  unn: process.env.NEXT_PUBLIC_UNN ?? '7054043794',
  /** ZATCA registration certificate number */
  zatcaCert: process.env.NEXT_PUBLIC_ZATCA_CERT ?? '100261168483070',
  /** 15-digit VAT number, once issued */
  vat: process.env.NEXT_PUBLIC_VAT_NUMBER ?? '',
}
