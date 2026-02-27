import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { Invoice } from '../types/invoice';
import { formatAmount, formatDate } from './formatters';

async function loadFont(url: string): Promise<ArrayBuffer | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return await resp.arrayBuffer();
  } catch {
    return null;
  }
}

export async function generatePDF(invoice: Invoice, logoBase64?: string | null): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  let font: PDFFont;
  let boldFont: PDFFont;

  const regularBuffer = await loadFont('/Factures-Resonnance/fonts/roboto-regular.ttf');
  const boldBuffer = await loadFont('/Factures-Resonnance/fonts/roboto-bold.ttf');

  if (regularBuffer && boldBuffer) {
    font = await doc.embedFont(regularBuffer);
    boldFont = await doc.embedFont(boldBuffer);
  } else {
    font = await doc.embedFont(StandardFonts.Helvetica);
    boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  }

  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const drawText = (text: string, x: number, yPos: number, size: number, isBold = false, color = rgb(0, 0, 0)) => {
    page.drawText(text, { x, y: yPos, size, font: isBold ? boldFont : font, color });
  };

  const textWidth = (text: string, size: number, isBold = false) => {
    return (isBold ? boldFont : font).widthOfTextAtSize(text, size);
  };

  // Header: FACTURE title
  drawText('FACTURE', margin, y, 28, true, rgb(0.1, 0.1, 0.5));
  y -= 40;

  // Logo if provided
  if (logoBase64) {
    try {
      const base64Data = logoBase64.split(',')[1] || logoBase64;
      const imgBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      let img;
      if (logoBase64.includes('data:image/jpeg') || logoBase64.includes('data:image/jpg')) {
        img = await doc.embedJpg(imgBytes);
      } else {
        img = await doc.embedPng(imgBytes);
      }
      const dims = img.scale(0.5);
      page.drawImage(img, { x: width - margin - Math.min(dims.width, 150), y: height - margin - 60, width: Math.min(dims.width, 150), height: Math.min(dims.height, 60) });
    } catch {
      // ignore logo errors
    }
  }

  // Emitter info (left)
  const issuer = invoice.issuer;
  let leftY = y;
  drawText(issuer.name, margin, leftY, 11, true);
  leftY -= 15;
  if (issuer.tagline) { drawText(issuer.tagline, margin, leftY, 9, false, rgb(0.4,0.4,0.4)); leftY -= 13; }
  const issuerLines = issuer.address.split('\n');
  for (const line of issuerLines) { drawText(line, margin, leftY, 9); leftY -= 13; }
  if (issuer.email) { drawText(issuer.email, margin, leftY, 9); leftY -= 13; }
  if (issuer.phone) { drawText(issuer.phone, margin, leftY, 9); leftY -= 13; }
  if (issuer.sirenOrSiret) { drawText(`SIREN/SIRET: ${issuer.sirenOrSiret}`, margin, leftY, 9); leftY -= 13; }

  // Customer info (right)
  const customer = invoice.customer;
  const rightX = width / 2 + 20;
  let rightY = y;
  drawText('FACTURÉ À :', rightX, rightY, 9, false, rgb(0.4,0.4,0.4));
  rightY -= 15;
  drawText(customer.name, rightX, rightY, 11, true);
  rightY -= 15;
  if (customer.sirenOrSiret) { drawText(`SIREN/SIRET: ${customer.sirenOrSiret}`, rightX, rightY, 9); rightY -= 13; }
  const custLines = customer.address.split('\n');
  for (const line of custLines) { drawText(line, rightX, rightY, 9); rightY -= 13; }
  if (customer.email) { drawText(customer.email, rightX, rightY, 9); rightY -= 13; }

  y = Math.min(leftY, rightY) - 20;

  // Separator line
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.7,0.7,0.7) });
  y -= 15;

  // Invoice details
  drawText(`Facture N° : ${invoice.number}`, margin, y, 10, true);
  drawText(`Date : ${formatDate(invoice.date)}`, width / 2, y, 10);
  if (invoice.dueDate) { drawText(`Échéance : ${formatDate(invoice.dueDate)}`, width - margin - 150, y, 10); }
  y -= 25;

  // Items table header
  const col = { desc: margin, qty: 320, pu: 390, total: 480 };
  const tableHeaderY = y;
  page.drawRectangle({ x: margin, y: tableHeaderY - 5, width: width - 2*margin, height: 18, color: rgb(0.1,0.1,0.5) });
  drawText('Désignation', col.desc + 3, tableHeaderY, 9, true, rgb(1,1,1));
  drawText('Qté', col.qty, tableHeaderY, 9, true, rgb(1,1,1));
  drawText('PU (€)', col.pu, tableHeaderY, 9, true, rgb(1,1,1));
  drawText('Total (€)', col.total, tableHeaderY, 9, true, rgb(1,1,1));
  y -= 22;

  // Items rows
  let rowBg = false;
  for (const item of invoice.items) {
    if (rowBg) {
      page.drawRectangle({ x: margin, y: y - 5, width: width - 2*margin, height: 16, color: rgb(0.95,0.95,0.95) });
    }
    const discount = item.discountPct ?? 0;
    const lineTotal = item.quantity * item.unitPrice * (1 - discount / 100);
    drawText(item.description, col.desc + 3, y, 9);
    drawText(String(item.quantity), col.qty, y, 9);
    drawText(formatAmount(item.unitPrice), col.pu, y, 9);
    if (discount > 0) drawText(`-${discount}%`, col.pu + 40, y, 8, false, rgb(0.8,0.1,0.1));
    drawText(formatAmount(lineTotal), col.total, y, 9);
    y -= 18;
    rowBg = !rowBg;
  }

  // Separator
  page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: width - margin, y: y + 5 }, thickness: 0.5, color: rgb(0.7,0.7,0.7) });
  y -= 15;

  // Totals (bottom right)
  const totX = width - margin - 160;
  if (invoice.totals.vatPct === 0) {
    drawText('T.V.A. non applicable, article 293 B du CGI', margin, y, 7.5, false, rgb(0.4,0.4,0.4));
  }
  drawText('Sous-total :', totX, y, 9);
  drawText(formatAmount(invoice.totals.subtotal), totX + 80, y, 9);
  y -= 14;
  if (invoice.totals.vatPct > 0) {
    drawText(`TVA (${invoice.totals.vatPct}%) :`, totX, y, 9);
    drawText(formatAmount(invoice.totals.vatAmount), totX + 80, y, 9);
    y -= 14;
  }
  page.drawLine({ start: { x: totX, y: y + 2 }, end: { x: width - margin, y: y + 2 }, thickness: 0.5, color: rgb(0.5,0.5,0.5) });
  y -= 12;
  drawText('TOTAL :', totX, y, 11, true);
  drawText(formatAmount(invoice.totals.grandTotal), totX + 80, y, 11, true, rgb(0.1,0.1,0.5));
  y -= 25;

  // Payment status
  if (invoice.payment.status === 'payée') {
    const msg = invoice.payment.method
      ? `Réglée par ${invoice.payment.method}${invoice.payment.paidOn ? ' le ' + formatDate(invoice.payment.paidOn) : ''}`
      : 'Payée';
    drawText(msg, margin, y, 10, true, rgb(0,0.5,0));
    y -= 18;
  } else {
    drawText('Paiement à effectuer', margin, y, 10, false, rgb(0.7,0.1,0.1));
    if (invoice.payment.method) drawText(` par ${invoice.payment.method}`, margin + textWidth('Paiement à effectuer', 10), y, 10, false, rgb(0.7,0.1,0.1));
    y -= 18;
  }

  // Notes
  if (invoice.notes) {
    y -= 5;
    drawText('Notes :', margin, y, 9, true);
    y -= 13;
    const noteLines = invoice.notes.split('\n');
    for (const line of noteLines) {
      drawText(line, margin, y, 9, false, rgb(0.3,0.3,0.3));
      y -= 13;
    }
  }

  // Signature block
  if (invoice.signatureName || invoice.signatureTitle) {
    y -= 10;
    drawText('Signature :', width - margin - 150, y, 9, true);
    y -= 13;
    if (invoice.signatureName) { drawText(invoice.signatureName, width - margin - 150, y, 9); y -= 13; }
    if (invoice.signatureTitle) { drawText(invoice.signatureTitle, width - margin - 150, y, 9, false, rgb(0.4,0.4,0.4)); y -= 13; }
  }

  // Legal mentions footer
  const footerY = 40;
  page.drawLine({ start: { x: margin, y: footerY + 15 }, end: { x: width - margin, y: footerY + 15 }, thickness: 0.3, color: rgb(0.8,0.8,0.8) });
  if (issuer.legalMentions) {
    drawText(issuer.legalMentions, margin, footerY + 5, 7.5, false, rgb(0.5,0.5,0.5));
  }

  return doc.save();
}
