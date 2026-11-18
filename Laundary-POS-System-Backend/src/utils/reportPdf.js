const PDFDocument = require('pdfkit');

/**
 * Shared PDF layout for exported reports.
 *
 * buildReportPdf(res, {
 *   title: 'Revenue Report',
 *   subtitle: 'Daily · 01 Nov 2026 – 18 Nov 2026',
 *   summary: [{ label: 'Total Revenue', value: 'LKR 12,500' }, ...],
 *   sections: [{
 *     heading: 'Breakdown',
 *     columns: [{ header: 'Period', key: 'period', width: 120, align: 'left' }, ...],
 *     rows: [{ period: '2026-11-01', ... }],
 *     totalRow: { period: 'TOTAL', ... }   // optional, rendered bold
 *   }],
 *   landscape: false
 * })
 *
 * Streams the document straight to the response.
 */

const COLORS = {
  brand: '#233d4d',
  accent: '#fe7f2d',
  text: '#1f2937',
  muted: '#6b7280',
  line: '#e5e7eb',
  zebra: '#f9fafb',
  headerBg: '#233d4d',
  headerFg: '#ffffff'
};

const fmtMoney = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtDateTime = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return `${fmtDate(date)} ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};

const describePeriod = (startDate, endDate) => {
  if (startDate && endDate) return `${fmtDate(startDate)} – ${fmtDate(endDate)}`;
  if (startDate) return `From ${fmtDate(startDate)}`;
  if (endDate) return `Until ${fmtDate(endDate)}`;
  return 'All time';
};

const buildReportPdf = (res, { title, subtitle, summary = [], sections = [], landscape = false, filename = 'report.pdf' }) => {
  const doc = new PDFDocument({ size: 'A4', layout: landscape ? 'landscape' : 'portrait', margin: 40, bufferPages: true });

  // Collect the whole document first and send it with a Content-Length.
  // Streaming straight into the response is fragile behind serverless
  // runtimes and proxies, which can truncate or re-encode the body.
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {
    const pdf = Buffer.concat(chunks);
    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-store');
    res.end(pdf);
  });
  doc.on('error', (error) => {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF', error: error.message });
    }
  });

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = doc.page.margins.left;
  const businessName = process.env.BUSINESS_NAME || 'Fold Fox Laundry';

  // ---- Header band ----
  const drawHeader = () => {
    doc.save();
    doc.rect(0, 0, doc.page.width, 70).fill(COLORS.brand);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text(businessName, left, 20, { continued: false });
    doc.font('Helvetica').fontSize(10).fillColor('#e5e7eb').text(title, left, 44);
    doc.font('Helvetica').fontSize(9).fillColor('#e5e7eb').text(`Generated ${fmtDateTime(new Date())}`, left, 44, { width: pageWidth, align: 'right' });
    doc.restore();
    doc.y = 90;
  };

  drawHeader();
  doc.on('pageAdded', () => {
    drawHeader();
  });

  // ---- Title ----
  doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(20).text(title, left, doc.y);
  if (subtitle) {
    doc.font('Helvetica').fontSize(11).fillColor(COLORS.muted).text(subtitle, left, doc.y + 2);
  }
  doc.moveDown(0.8);

  // ---- Summary cards ----
  if (summary.length > 0) {
    const gap = 10;
    const perRow = Math.min(summary.length, landscape ? 5 : 4);
    const cardW = (pageWidth - gap * (perRow - 1)) / perRow;
    const cardH = 52;
    let x = left;
    let y = doc.y;
    summary.forEach((item, i) => {
      if (i > 0 && i % perRow === 0) {
        x = left;
        y += cardH + gap;
      }
      doc.save();
      doc.roundedRect(x, y, cardW, cardH, 6).fillAndStroke('#ffffff', COLORS.line);
      doc.rect(x, y, 4, cardH).fill(item.color || COLORS.accent);
      doc.restore();
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8.5).text(item.label.toUpperCase(), x + 12, y + 9, { width: cardW - 18, ellipsis: true });
      doc.fillColor(item.valueColor || COLORS.text).font('Helvetica-Bold').fontSize(14).text(String(item.value), x + 12, y + 24, { width: cardW - 18, ellipsis: true });
      x += cardW + gap;
    });
    doc.y = y + cardH + 18;
  }

  // ---- Tables ----
  const bottomLimit = () => doc.page.height - doc.page.margins.bottom - 20;

  const drawTableHeader = (columns, y) => {
    doc.save();
    doc.rect(left, y, pageWidth, 20).fill(COLORS.headerBg);
    doc.restore();
    let x = left;
    columns.forEach((col) => {
      doc.fillColor(COLORS.headerFg).font('Helvetica-Bold').fontSize(8.5)
        .text(col.header, x + 6, y + 6, { width: col.width - 12, align: col.align || 'left', lineBreak: false, ellipsis: true });
      x += col.width;
    });
    return y + 20;
  };

  sections.forEach((section, sIndex) => {
    if (!section.columns || section.columns.length === 0) return;

    // Scale column widths to the page
    const totalW = section.columns.reduce((s, c) => s + (c.width || 80), 0);
    const columns = section.columns.map((c) => ({ ...c, width: ((c.width || 80) / totalW) * pageWidth }));

    if (sIndex > 0) doc.moveDown(0.6);
    if (doc.y + 60 > bottomLimit()) doc.addPage();

    if (section.heading) {
      doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(12).text(section.heading, left, doc.y);
      doc.moveDown(0.3);
    }

    let y = drawTableHeader(columns, doc.y);
    const rows = section.rows || [];

    if (rows.length === 0) {
      doc.fillColor(COLORS.muted).font('Helvetica-Oblique').fontSize(9).text('No data for this period', left + 6, y + 8);
      y += 26;
      doc.y = y;
      return;
    }

    const drawRow = (row, index, bold = false) => {
      // Measure the tallest cell
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5);
      const heights = columns.map((col) => doc.heightOfString(String(row[col.key] ?? ''), { width: col.width - 12 }));
      const rowH = Math.max(18, Math.min(Math.max(...heights) + 8, 60));

      if (y + rowH > bottomLimit()) {
        doc.addPage();
        y = drawTableHeader(columns, doc.y);
      }

      if (bold) {
        doc.save(); doc.rect(left, y, pageWidth, rowH).fill('#fff7ed'); doc.restore();
      } else if (index % 2 === 1) {
        doc.save(); doc.rect(left, y, pageWidth, rowH).fill(COLORS.zebra); doc.restore();
      }

      let x = left;
      columns.forEach((col) => {
        const raw = row[col.key];
        const value = raw === null || raw === undefined ? '' : String(raw);
        doc.fillColor(col.color && !bold ? col.color : COLORS.text)
          .font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5)
          .text(value, x + 6, y + 5, { width: col.width - 12, align: col.align || 'left', height: rowH - 6, ellipsis: true });
        x += col.width;
      });

      doc.save();
      doc.moveTo(left, y + rowH).lineTo(left + pageWidth, y + rowH).lineWidth(0.5).strokeColor(COLORS.line).stroke();
      doc.restore();
      y += rowH;
    };

    rows.forEach((row, i) => drawRow(row, i));
    if (section.totalRow) drawRow(section.totalRow, rows.length, true);
    doc.y = y + 4;
  });

  // ---- Footer with page numbers ----
  // Writing inside the bottom margin would make pdfkit start a new page, so the
  // margin is lifted while the footer is drawn and restored afterwards.
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const previousBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8)
      .text(`${businessName} · ${title} · Page ${i - range.start + 1} of ${range.count}`,
        left, doc.page.height - previousBottom + 8, { width: pageWidth, align: 'center', lineBreak: false });
    doc.page.margins.bottom = previousBottom;
  }

  doc.end();
};

module.exports = { buildReportPdf, fmtMoney, fmtDate, fmtDateTime, describePeriod };
