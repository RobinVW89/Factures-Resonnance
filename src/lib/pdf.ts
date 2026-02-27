import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Invoice } from '../types/invoice';
import { formatDate } from './formatters';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 50;
const COL_WIDTH = A4_WIDTH - MARGIN * 2;

function fmtMoney(amount: number): string {
  return amount.toFixed(2).replace('.', ',') + ' EUR';
}

export async function generateInvoicePDF(invoice: Invoice): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = A4_HEIGHT - MARGIN;
  const lineH = 14;

  // Title
  page.drawText('FACTURE', {
    x: MARGIN,
    y,
    size: 28,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.5),
  });

  // Logo
  if (invoice.issuer.logoDataUrl) {
    try {
      const base64 = invoice.issuer.logoDataUrl.split(',')[1];
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      let img;
      if (invoice.issuer.logoDataUrl.startsWith('data:image/png')) {
        img = await pdfDoc.embedPng(bytes);
      } else {
        img = await pdfDoc.embedJpg(bytes);
      }
      page.drawImage(img, { x: A4_WIDTH - MARGIN - 100, y: y - 10, width: 100, height: 50 });
    } catch {
      // ignore logo errors
    }
  }

  y -= 30;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: A4_WIDTH - MARGIN, y },
    thickness: 1,
    color: rgb(0.1, 0.1, 0.5),
  });
  y -= 20;

  // Issuer (left) + Customer (right)
  const colLeft = MARGIN;
  const colRight = A4_WIDTH / 2 + 10;

  let yLeft = y;
  page.drawText(invoice.issuer.name, { x: colLeft, y: yLeft, size: 11, font: fontBold, color: rgb(0,0,0) });
  yLeft -= lineH;
  if (invoice.issuer.tagline) {
    page.drawText(invoice.issuer.tagline, { x: colLeft, y: yLeft, size: 9, font: fontRegular, color: rgb(0.4,0.4,0.4) });
    yLeft -= lineH;
  }
  invoice.issuer.address.split('\n').forEach(line => {
    page.drawText(line.substring(0, 60), { x: colLeft, y: yLeft, size: 9, font: fontRegular, color: rgb(0,0,0) });
    yLeft -= lineH;
  });
  if (invoice.issuer.email) {
    page.drawText(invoice.issuer.email.substring(0, 60), { x: colLeft, y: yLeft, size: 9, font: fontRegular, color: rgb(0,0,0) });
    yLeft -= lineH;
  }
  if (invoice.issuer.phone) {
    page.drawText(invoice.issuer.phone, { x: colLeft, y: yLeft, size: 9, font: fontRegular, color: rgb(0,0,0) });
    yLeft -= lineH;
  }

  let yRight = y;
  page.drawText('Facturé à :', { x: colRight, y: yRight, size: 9, font: fontRegular, color: rgb(0.4,0.4,0.4) });
  yRight -= lineH;
  page.drawText(invoice.customer.name.substring(0, 50), { x: colRight, y: yRight, size: 11, font: fontBold, color: rgb(0,0,0) });
  yRight -= lineH;
  if (invoice.customer.sirenOrSiret) {
    page.drawText(`SIREN/SIRET : ${invoice.customer.sirenOrSiret}`, { x: colRight, y: yRight, size: 9, font: fontRegular, color: rgb(0,0,0) });
    yRight -= lineH;
  }
  invoice.customer.address.split('\n').forEach(line => {
    page.drawText(line.substring(0, 50), { x: colRight, y: yRight, size: 9, font: fontRegular, color: rgb(0,0,0) });
    yRight -= lineH;
  });

  y = Math.min(yLeft, yRight) - 20;

  // Invoice info box
  page.drawRectangle({
    x: MARGIN,
    y: y - 40,
    width: COL_WIDTH,
    height: 40,
    color: rgb(0.93, 0.95, 1),
    borderColor: rgb(0.1, 0.1, 0.5),
    borderWidth: 0.5,
  });
  page.drawText(`Facture n° ${invoice.number}`, { x: MARGIN + 10, y: y - 18, size: 10, font: fontBold, color: rgb(0,0,0) });
  page.drawText(`Date : ${formatDate(invoice.date)}`, { x: MARGIN + 10, y: y - 32, size: 9, font: fontRegular, color: rgb(0,0,0) });
  if (invoice.dueDate) {
    page.drawText(`Échéance : ${formatDate(invoice.dueDate)}`, { x: MARGIN + 200, y: y - 32, size: 9, font: fontRegular, color: rgb(0,0,0) });
  }
  y -= 60;

  // Items table header
  const col1X = MARGIN;
  const col2X = MARGIN + 270;
  const col3X = MARGIN + 330;
  const col4X = MARGIN + 410;

  page.drawRectangle({
    x: MARGIN,
    y: y - 20,
    width: COL_WIDTH,
    height: 20,
    color: rgb(0.1, 0.1, 0.5),
  });
  page.drawText('Désignation', { x: col1X + 5, y: y - 13, size: 9, font: fontBold, color: rgb(1,1,1) });
  page.drawText('Qte', { x: col2X + 5, y: y - 13, size: 9, font: fontBold, color: rgb(1,1,1) });
  page.drawText('PU (EUR)', { x: col3X + 5, y: y - 13, size: 9, font: fontBold, color: rgb(1,1,1) });
  page.drawText('Total (EUR)', { x: col4X + 5, y: y - 13, size: 9, font: fontBold, color: rgb(1,1,1) });
  y -= 22;

  let rowBg = false;
  for (const item of invoice.items) {
    if (rowBg) {
      page.drawRectangle({ x: MARGIN, y: y - 16, width: COL_WIDTH, height: 16, color: rgb(0.96, 0.97, 1) });
    }
    const disc = item.discountPct ?? 0;
    const lineTotal = item.quantity * item.unitPrice * (1 - disc / 100);
    const descText = item.description.length > 50 ? item.description.substring(0, 47) + '...' : item.description;
    page.drawText(descText, { x: col1X + 5, y: y - 11, size: 8, font: fontRegular, color: rgb(0,0,0) });
    page.drawText(String(item.quantity), { x: col2X + 5, y: y - 11, size: 8, font: fontRegular, color: rgb(0,0,0) });
    page.drawText(fmtMoney(item.unitPrice), { x: col3X + 5, y: y - 11, size: 8, font: fontRegular, color: rgb(0,0,0) });
    page.drawText(fmtMoney(Math.round(lineTotal * 100) / 100), { x: col4X + 5, y: y - 11, size: 8, font: fontRegular, color: rgb(0,0,0) });
    if (disc > 0) {
      page.drawText(`Remise : ${disc}%`, { x: col1X + 5, y: y - 22, size: 7, font: fontRegular, color: rgb(0.5,0.5,0.5) });
      y -= 10;
    }
    y -= 18;
    rowBg = !rowBg;
    if (y < 200) break;
  }

  page.drawLine({ start: { x: MARGIN, y }, end: { x: A4_WIDTH - MARGIN, y }, thickness: 0.5, color: rgb(0.7,0.7,0.7) });
  y -= 15;

  // Totals
  const totalsLabelX = MARGIN + 300;
  const totalsValueX = A4_WIDTH - MARGIN - 5;

  page.drawText('Total HT :', { x: totalsLabelX, y, size: 9, font: fontRegular, color: rgb(0,0,0) });
  page.drawText(fmtMoney(invoice.totals.subtotal), { x: totalsValueX - 70, y, size: 9, font: fontRegular, color: rgb(0,0,0) });
  y -= lineH;
  
  const vatLabel = invoice.totals.vatPct === 0 ? 'TVA (0%) :' : `TVA (${invoice.totals.vatPct}%) :`;
  const vatColor = invoice.totals.vatPct === 0 ? rgb(0.5,0.5,0.5) : rgb(0,0,0);
  page.drawText(vatLabel, { x: totalsLabelX, y, size: 9, font: fontRegular, color: vatColor });
  page.drawText(fmtMoney(invoice.totals.vatAmount), { x: totalsValueX - 70, y, size: 9, font: fontRegular, color: vatColor });
  y -= lineH;

  page.drawLine({ start: { x: totalsLabelX, y }, end: { x: totalsValueX, y }, thickness: 0.5, color: rgb(0,0,0) });
  y -= 15;
  page.drawText('TOTAL TTC :', { x: totalsLabelX, y, size: 11, font: fontBold, color: rgb(0.1,0.1,0.5) });
  page.drawText(fmtMoney(invoice.totals.grandTotal), { x: totalsValueX - 80, y, size: 11, font: fontBold, color: rgb(0.1,0.1,0.5) });
  y -= 25;

  if (invoice.payment.status === 'payée') {
    const payText = `Réglée par ${invoice.payment.method ?? ''}${invoice.payment.paidOn ? ' le ' + formatDate(invoice.payment.paidOn) : ''}`;
    page.drawText(payText, { x: MARGIN, y, size: 9, font: fontRegular, color: rgb(0.1,0.5,0.1) });
    y -= lineH;
  }

  if (invoice.notes) {
    y -= 10;
    page.drawText('Notes :', { x: MARGIN, y, size: 9, font: fontBold, color: rgb(0,0,0) });
    y -= lineH;
    invoice.notes.split('\n').forEach(line => {
      if (y > 130) {
        page.drawText(line.substring(0, 90), { x: MARGIN, y, size: 8, font: fontRegular, color: rgb(0,0,0) });
        y -= lineH;
      }
    });
  }

  // Legal footer
  y = 120;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: A4_WIDTH - MARGIN, y }, thickness: 0.5, color: rgb(0.8,0.8,0.8) });
  y -= 14;
  page.drawText('Facture en euros. T.V.A. non applicable, article 293 B du CGI.', { x: MARGIN, y, size: 7, font: fontRegular, color: rgb(0.4,0.4,0.4) });
  y -= 10;
  if (invoice.issuer.legalMentions) {
    page.drawText(invoice.issuer.legalMentions.substring(0, 100), { x: MARGIN, y, size: 7, font: fontRegular, color: rgb(0.4,0.4,0.4) });
    y -= 10;
  }

  // Signature
  y = 80;
  if (invoice.signatureName || invoice.signatureTitle) {
    page.drawText('Cordialement,', { x: A4_WIDTH - MARGIN - 150, y, size: 9, font: fontRegular, color: rgb(0,0,0) });
    y -= 12;
    if (invoice.signatureName) {
      page.drawText(invoice.signatureName, { x: A4_WIDTH - MARGIN - 150, y, size: 9, font: fontBold, color: rgb(0,0,0) });
      y -= 12;
    }
    if (invoice.signatureTitle) {
      page.drawText(invoice.signatureTitle, { x: A4_WIDTH - MARGIN - 150, y, size: 8, font: fontRegular, color: rgb(0.3,0.3,0.3) });
    }
  }

  return pdfDoc.save();
}
