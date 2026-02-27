export type Party = {
  name: string;
  tagline?: string;
  address: string;
  sirenOrSiret?: string;
  legalMentions?: string;
  email?: string;
  phone?: string;
};
export type Item = { description: string; quantity: number; unitPrice: number; discountPct?: number; };
export type Payment = { method?: 'chèque' | 'virement' | 'CB' | 'autre'; status: 'payée' | 'à payer'; paidOn?: string; };
export type Invoice = {
  id: string;
  number: string; date: string; dueDate?: string;
  issuer: Party; customer: Party;
  items: Item[];
  notes?: string; signatureName?: string; signatureTitle?: string;
  totals: { subtotal: number; vatPct: number; vatAmount: number; grandTotal: number; };
  payment: Payment; currency: 'EUR';
};
