// Textos de los documentos impresos. La interfaz está en español, pero las
// cotizaciones y facturas se entregan a clientes en EE. UU., por eso van en inglés.
// Basados en la redacción de las cotizaciones que Ruben ya usa.

import { DocType } from "./types";

export const COMPANY = {
  name: "ZAP Blinds Solutions",
  address: "114 Yukon Dr",
  city: "Greenville, SC 29605",
  phone: "954-470-4851",
  email: "info@zapblindsusa.com",
  website: "www.zapblindsusa.com",
  signer: "Ruben Zapata",
  signerTitle: "Project Coordinator",
  // Correo o teléfono registrado en Zelle; si está vacío, la factura solo dice "Zelle"
  zelle: "",
};

export const QUOTE_VALID_DAYS = 30;

export const QUOTE_TEXT = {
  greeting: (client: string) => `Dear ${client},`,
  intro:
    "Greetings. In response to your kind request, I am pleased to provide you with this quotation " +
    "for the following items. It has been prepared with your specific requirements in mind, using " +
    "high-quality products and reliable systems that guarantee excellent performance.",
  taxNote: "Prices do not include sales tax.",
  validity: (until: string) => `This quotation is valid for ${QUOTE_VALID_DAYS} days (until ${until}).`,
  closing:
    "I look forward to receiving your comments, answering any questions you may have, or making any " +
    "adjustments you wish to request. It would be a pleasure to assist you with your project.",
  acceptance:
    "Acceptance of quotation: the prices, specifications and terms above are satisfactory and are " +
    "hereby accepted. ZAP Blinds Solutions is authorized to proceed as specified.",
};

export const INVOICE_TEXT = {
  paymentMethods: [
    `Check — payable to ${COMPANY.name}`,
    COMPANY.zelle ? `Zelle — ${COMPANY.zelle}` : "Zelle",
    "Cash",
  ],
  paymentReference: "Please include the invoice number with your payment.",
  thanks: "Thank you for your business!",
  contact: `Questions about this invoice? Contact ${COMPANY.signer}, ${COMPANY.signerTitle}, at ${COMPANY.phone} or ${COMPANY.email}.`,
};

// Texto editable con que se precarga el campo "Notas / Términos" del formulario
export const DEFAULT_NOTES: Record<DocType, string> = {
  quote:
    "Delivery time: 20 to 25 calendar days. Screens exceeding 3 meters (10 ft) in length: 60 to 70 calendar days.\n" +
    "Payment terms: 70% upon signing of the agreement or contract; the remaining 30% upon delivery and the client's full satisfaction.",
  // Las formas de pago ya van fijas en la factura; las notas quedan libres
  invoice: "",
};
