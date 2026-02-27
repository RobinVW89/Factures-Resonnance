import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Invoice } from '../types/invoice';
import { formatCurrency, formatDate } from './formatters';
import { lineTotal } from './calculations';

const MARGIN = 40;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const FOOTER_MIN_Y = 100;

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const normalized = hex.replace('#', '');
  const bigint = Number.parseInt(normalized, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return { r, g, b };
};

const toRgb = (hex: string) => {
  const color = hexToRgb(hex);
  return rgb(color.r, color.g, color.b);
};

const dataUrlToBytes = async (dataUrl: string): Promise<Uint8Array> => {
  const response = await fetch(dataUrl);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
};

const svgDataUrlToPngBytes = async (svgDataUrl: string): Promise<Uint8Array> => {
  const image = new Image();
  image.src = svgDataUrl;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Impossible de charger le logo SVG.'));
  });

  const canvas = document.createElement('canvas');
  canvas.width = image.width || 320;
  canvas.height = image.height || 120;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Impossible de convertir le logo SVG.');
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pngDataUrl = canvas.toDataURL('image/png');
  return dataUrlToBytes(pngDataUrl);
};

const splitLines = (text: string, maxLength: number): string[] => {
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxLength) {
      if (current) lines.push(current);
      current = word;
      return;
    }
    current = candidate;
  });

  if (current) lines.push(current);
  return lines;
};

export const generateInvoicePdfBytes = async (invoice: Invoice): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const palette = {
    bg: toRgb('#F8F8F8'),
    white: toRgb('#FFFFFF'),
    border: toRgb('#DADADA'),
    accent: toRgb('#C8D8A8'),
    accentSoft: toRgb('#F0F8F0'),
    text: toRgb('#202020'),
    muted: toRgb('#606060'),
  };

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const drawPageBackground = (): void => {
    page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: palette.bg });
  };

  const drawTableHeader = (): void => {
    page.drawRectangle({
      x: MARGIN,
      y: y - 20,
      width: contentWidth,
      height: 20,
      color: palette.accent,
      borderColor: palette.border,
      borderWidth: 1,
    });

    page.drawText('Désignation', { x: MARGIN + 8, y: y - 14, size: 10, font: boldFont, color: palette.text });
    page.drawText('Qté', { x: MARGIN + 320, y: y - 14, size: 10, font: boldFont, color: palette.text });
    page.drawText('PU (€)', { x: MARGIN + 372, y: y - 14, size: 10, font: boldFont, color: palette.text });
    page.drawText('Total (€)', { x: MARGIN + 448, y: y - 14, size: 10, font: boldFont, color: palette.text });

    y -= 24;
  };

  const drawHeader = async (): Promise<void> => {
    drawPageBackground();

    page.drawRectangle({
      x: MARGIN,
      y: y - 52,
      width: contentWidth,
      height: 52,
      color: palette.accent,
      borderColor: palette.border,
      borderWidth: 1,
    });

    page.drawText('FACTURE', {
      x: MARGIN + 12,
      y: y - 33,
      size: 24,
      font: boldFont,
      color: palette.text,
    });

    page.drawText(`N° ${invoice.number}`, {
      x: MARGIN + 150,
      y: y - 28,
      size: 11,
      font: boldFont,
      color: palette.text,
    });

    if (invoice.logoDataUrl) {
      try {
        const isSvg = invoice.logoDataUrl.startsWith('data:image/svg+xml');
        const logoBytes = isSvg
          ? await svgDataUrlToPngBytes(invoice.logoDataUrl)
          : await dataUrlToBytes(invoice.logoDataUrl);

        const logoImage = invoice.logoDataUrl.includes('png') || isSvg
          ? await pdfDoc.embedPng(logoBytes)
          : await pdfDoc.embedJpg(logoBytes);

        const logo = logoImage.scale(0.17);
        page.drawImage(logoImage, {
          x: MARGIN + contentWidth - logo.width - 8,
          y: y - 44,
          width: logo.width,
          height: logo.height,
        });
      } catch {
      }
    }

    y -= 68;

    const cardGap = 12;
    const cardWidth = (contentWidth - cardGap) / 2;
    const cardHeight = 126;

    const drawCard = (x: number, title: string, lines: string[]): void => {
      page.drawRectangle({
        x,
        y: y - cardHeight,
        width: cardWidth,
        height: cardHeight,
        color: palette.white,
        borderColor: palette.border,
        borderWidth: 1,
      });

      page.drawRectangle({
        x,
        y: y - 20,
        width: cardWidth,
        height: 20,
        color: palette.accentSoft,
      });

      page.drawText(title, { x: x + 8, y: y - 14, size: 10, font: boldFont, color: palette.text });

      let lineY = y - 34;
      lines.forEach((line, lineIndex) => {
        const font = lineIndex === 0 ? boldFont : regularFont;
        page.drawText(line, { x: x + 8, y: lineY, size: 9.5, font, color: palette.text });
        lineY -= 12;
      });
    };

    const issuerLines = [
      invoice.issuer.name || '—',
      ...(invoice.issuer.tagline ? [invoice.issuer.tagline] : []),
      ...splitLines(invoice.issuer.address || '', 40),
      ...(invoice.issuer.email ? [`Email : ${invoice.issuer.email}`] : []),
      ...(invoice.issuer.phone ? [`Tél : ${invoice.issuer.phone}`] : []),
    ].slice(0, 7);

    const customerLines = [
      invoice.customer.name || '—',
      ...splitLines(invoice.customer.address || '', 40),
      ...(invoice.customer.sirenOrSiret ? [`SIREN/SIRET : ${invoice.customer.sirenOrSiret}`] : []),
    ].slice(0, 7);

    drawCard(MARGIN, 'ÉMETTEUR', issuerLines);
    drawCard(MARGIN + cardWidth + cardGap, 'CLIENT', customerLines);

    y -= cardHeight + 12;

    page.drawRectangle({
      x: MARGIN,
      y: y - 24,
      width: contentWidth,
      height: 24,
      color: palette.white,
      borderColor: palette.border,
      borderWidth: 1,
    });

    page.drawText(`Date : ${formatDate(invoice.date) || '—'}`, {
      x: MARGIN + 8,
      y: y - 16,
      size: 9.5,
      font: boldFont,
      color: palette.text,
    });

    page.drawText(`Échéance : ${invoice.dueDate ? formatDate(invoice.dueDate) : '—'}`, {
      x: MARGIN + 188,
      y: y - 16,
      size: 9.5,
      font: regularFont,
      color: palette.text,
    });

    page.drawText(`Statut : ${invoice.payment.status}`, {
      x: MARGIN + 388,
      y: y - 16,
      size: 9.5,
      font: regularFont,
      color: palette.text,
    });

    y -= 32;
  };

  await drawHeader();
  drawTableHeader();

  let rowIndex = 0;
  for (const item of invoice.items) {
    const description = item.description || '—';
    const lines = splitLines(description, 48);
    const lineCount = Math.max(1, lines.length);
    const hasDiscount = Boolean(item.discountPct && item.discountPct > 0);
    const rowHeight = lineCount * 12 + (hasDiscount ? 12 : 0) + 8;

    if (y - rowHeight < FOOTER_MIN_Y + 130) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawPageBackground();
      y = PAGE_HEIGHT - MARGIN;
      drawTableHeader();
    }

    if (rowIndex % 2 === 0) {
      page.drawRectangle({
        x: MARGIN,
        y: y - rowHeight + 2,
        width: contentWidth,
        height: rowHeight,
        color: palette.white,
      });
    }

    page.drawRectangle({
      x: MARGIN,
      y: y - rowHeight + 2,
      width: contentWidth,
      height: rowHeight,
      borderColor: palette.border,
      borderWidth: 0.5,
    });

    let rowY = y - 10;
    lines.forEach((line, i) => {
      page.drawText(line, {
        x: MARGIN + 8,
        y: rowY,
        size: i === 0 ? 10 : 9,
        font: i === 0 ? boldFont : regularFont,
        color: palette.text,
      });
      rowY -= 12;
    });

    if (hasDiscount) {
      page.drawText(`Remise : ${item.discountPct}%`, {
        x: MARGIN + 8,
        y: rowY,
        size: 8.5,
        font: regularFont,
        color: palette.muted,
      });
    }

    page.drawText(String(item.quantity), {
      x: MARGIN + 322,
      y: y - 10,
      size: 10,
      font: regularFont,
      color: palette.text,
    });
    page.drawText(formatCurrency(item.unitPrice), {
      x: MARGIN + 372,
      y: y - 10,
      size: 10,
      font: regularFont,
      color: palette.text,
    });
    page.drawText(formatCurrency(lineTotal(item)), {
      x: MARGIN + 448,
      y: y - 10,
      size: 10,
      font: boldFont,
      color: palette.text,
    });

    y -= rowHeight;
    rowIndex += 1;
  }

  if (y < 220) {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawPageBackground();
    y = PAGE_HEIGHT - MARGIN;
  }

  const totalsBoxWidth = 230;
  const totalsBoxX = PAGE_WIDTH - MARGIN - totalsBoxWidth;
  const totalsBoxY = y - 92;

  page.drawRectangle({
    x: totalsBoxX,
    y: totalsBoxY,
    width: totalsBoxWidth,
    height: 92,
    color: palette.white,
    borderColor: palette.border,
    borderWidth: 1,
  });

  page.drawText(`Sous-total HT : ${formatCurrency(invoice.totals.subtotal)}`, {
    x: totalsBoxX + 10,
    y: totalsBoxY + 66,
    size: 10,
    font: regularFont,
    color: palette.text,
  });

  page.drawText(`TVA (${(invoice.totals.vatPct * 100).toFixed(0)}%) : ${formatCurrency(invoice.totals.vatAmount)}`, {
    x: totalsBoxX + 10,
    y: totalsBoxY + 48,
    size: 10,
    font: regularFont,
    color: palette.text,
  });

  page.drawRectangle({
    x: totalsBoxX + 6,
    y: totalsBoxY + 10,
    width: totalsBoxWidth - 12,
    height: 26,
    color: palette.accent,
  });

  page.drawText(`TOTAL TTC : ${formatCurrency(invoice.totals.grandTotal)}`, {
    x: totalsBoxX + 12,
    y: totalsBoxY + 19,
    size: 11,
    font: boldFont,
    color: palette.text,
  });

  let footerY = totalsBoxY - 18;

  page.drawText('Facture en euros. T.V.A. non applicable, article 293 B du CGI.', {
    x: MARGIN,
    y: footerY,
    size: 8.8,
    font: regularFont,
    color: palette.muted,
  });
  footerY -= 12;

  if (invoice.issuer.legalMentions) {
    splitLines(invoice.issuer.legalMentions, 92).forEach((line) => {
      page.drawText(line, { x: MARGIN, y: footerY, size: 8.8, font: regularFont, color: palette.muted });
      footerY -= 10;
    });
  }

  if (invoice.payment.status === 'payée') {
    const paidDate = invoice.payment.paidOn ? formatDate(invoice.payment.paidOn) : '—';
    page.drawText(`Réglée par ${invoice.payment.method || '—'} le ${paidDate}.`, {
      x: MARGIN,
      y: footerY,
      size: 8.8,
      font: regularFont,
      color: palette.text,
    });
    footerY -= 11;
  }

  if (invoice.notes) {
    splitLines(invoice.notes, 96).forEach((line) => {
      page.drawText(line, { x: MARGIN, y: footerY, size: 8.8, font: regularFont, color: palette.muted });
      footerY -= 10;
    });
  }

  const signerName = invoice.signatureName || 'Soyer Robin';
  const signerTitle = invoice.signatureTitle || 'Trésorier';
  const signatureText = `Cordialement, ${signerName}, en sa qualité de ${signerTitle}.`;
  page.drawText(signatureText, {
    x: MARGIN,
    y: Math.max(footerY - 6, 46),
    size: 9.5,
    font: regularFont,
    color: palette.text,
  });

  return pdfDoc.save();
};

export const buildPdfBlobUrl = async (invoice: Invoice): Promise<string> => {
  const bytes = await generateInvoicePdfBytes(invoice);
  const stableBytes = new Uint8Array(bytes.byteLength);
  stableBytes.set(bytes);
  const blob = new Blob([stableBytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
};
