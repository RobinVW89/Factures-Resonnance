import { v4 as uuidv4 } from 'uuid';
import type { Invoice } from '../types/invoice';
import { computeTotals } from './calculations';
import { toIsoDate } from './formatters';
import { getNextInvoiceNumber } from './numbering';

export const defaultLegalMentions =
  "Association Loi 1901, enregistrée à la préfecture d'Auxerre.";

const defaultItems = [{ description: '', quantity: 1, unitPrice: 0, discountPct: 0 }];

export const createDefaultInvoice = (): Invoice => {
  const today = toIsoDate();

  return {
    id: uuidv4(),
    number: getNextInvoiceNumber(),
    date: today,
    dueDate: '',
    issuer: {
      name: 'Association RÉSONANCE ICAUNAISE',
      tagline: 'Le Business Ensemble',
      address: '2 rue des chariats, 89290 IRANCY',
      legalMentions: defaultLegalMentions,
      email: '',
      phone: '',
    },
    customer: {
      name: 'LG Courtage & J3G Patrimoine',
      sirenOrSiret: '839 824 651',
      address: "13 rue de l'horloge, 89000 Auxerre",
    },
    items: defaultItems,
    notes: '',
    signatureName: 'Soyer Robin',
    signatureTitle: 'Trésorier',
    totals: computeTotals(defaultItems, 0),
    payment: {
      method: 'virement',
      status: 'à payer',
      paidOn: '',
    },
    currency: 'EUR',
  };
};
