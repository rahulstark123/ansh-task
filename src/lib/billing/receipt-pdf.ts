import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import {
  COMPANY_NAME,
  SITE_NAME,
  GSTIN,
  UDYAM_REGISTRATION_NUMBER,
} from "@/lib/site";
import { GST_RATE_PERCENT, appliesIndianGst, splitGstInclusive } from "@/lib/billing/gst";

export type ReceiptPdfInput = {
  receiptNumber: string;
  invoiceNumber: string;
  issuedAt: Date;
  workspaceName: string;
  workspaceId: number;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  description: string;
  billingCycle: string;
  seats: number;
  amountMinor: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  planLabel: string;
  periodStart?: Date | null;
  periodEnd?: Date | null;
};

function formatMoney(amountMinor: number, currency: string) {
  const major = amountMinor / 100;
  const code = currency.toUpperCase();
  // Standard PDF fonts (WinAnsi) can't draw ₹ / many Unicode glyphs — keep ASCII.
  const formatted = major.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (code === "INR") return `INR ${formatted}`;
  if (code === "USD") return `USD ${formatted}`;
  return `${code} ${formatted}`;
}

function pdfSafe(text: string) {
  return text
    .replace(/₹/g, "INR ")
    .replace(/[–—]/g, "-")
    .replace(/[^\x00-\x7F]/g, "?");
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function resolveLogoPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "public", "logoAnshapps.png"),
    path.join(process.cwd(), "public", "logo.png"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function drawRoundedRect(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: ReturnType<typeof rgb>,
  border?: ReturnType<typeof rgb>
) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: fill,
    borderColor: border,
    borderWidth: border ? 1 : 0,
  });
}

/** Build a professional ANSH Apps payment receipt PDF (pdf-lib, Next-safe). */
export async function buildReceiptPdf(input: ReceiptPdfInput): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Receipt ${input.receiptNumber}`);
  doc.setAuthor(COMPANY_NAME);
  doc.setSubject(`${SITE_NAME} payment receipt`);

  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const left = 50;
  const right = width - 50;
  const contentWidth = right - left;

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const slate900 = rgb(0.06, 0.09, 0.15);
  const slate500 = rgb(0.39, 0.45, 0.55);
  const slate200 = rgb(0.89, 0.91, 0.94);
  const slate50 = rgb(0.97, 0.98, 0.99);
  const teal600 = rgb(0.05, 0.58, 0.53);
  const teal100 = rgb(0.8, 0.98, 0.94);
  const teal200 = rgb(0.37, 0.92, 0.83);
  const white = rgb(1, 1, 1);

  // Header
  page.drawRectangle({
    x: 0,
    y: height - 110,
    width,
    height: 110,
    color: slate900,
  });

  let titleX = left;
  const logoPath = resolveLogoPath();
  if (logoPath) {
    try {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await doc.embedPng(logoBytes);
      const logoW = 42;
      const logoH = (logoImage.height / logoImage.width) * logoW;
      page.drawImage(logoImage, {
        x: left,
        y: height - 28 - logoH,
        width: logoW,
        height: logoH,
      });
      titleX = left + 54;
    } catch {
      // Logo optional
    }
  }

  page.drawText(pdfSafe(COMPANY_NAME), {
    x: titleX,
    y: height - 42,
    size: 18,
    font: fontBold,
    color: white,
  });
  page.drawText(pdfSafe(SITE_NAME), {
    x: titleX,
    y: height - 58,
    size: 10,
    font,
    color: slate500,
  });
  page.drawText(pdfSafe("Built for Bharat, Ready for the World"), {
    x: titleX,
    y: height - 74,
    size: 8,
    font,
    color: slate500,
  });

  const receiptLabel = "PAYMENT RECEIPT";
  const receiptLabelWidth = fontBold.widthOfTextAtSize(receiptLabel, 14);
  page.drawText(receiptLabel, {
    x: right - receiptLabelWidth,
    y: height - 42,
    size: 14,
    font: fontBold,
    color: teal200,
  });

  const invoiceLine = pdfSafe(`Invoice No: ${input.invoiceNumber}`);
  const receiptLine = pdfSafe(`Receipt No: ${input.receiptNumber}`);
  const invoiceLineW = font.widthOfTextAtSize(invoiceLine, 8);
  const receiptLineW = font.widthOfTextAtSize(receiptLine, 8);
  page.drawText(invoiceLine, {
    x: right - invoiceLineW,
    y: height - 60,
    size: 8,
    font,
    color: slate500,
  });
  page.drawText(receiptLine, {
    x: right - receiptLineW,
    y: height - 74,
    size: 8,
    font,
    color: slate500,
  });

  let y = height - 150;

  // Meta cards
  const cardW = contentWidth / 2 - 8;
  const billedToLines = [
    pdfSafe(input.workspaceName || `Workspace #${input.workspaceId}`),
  ];
  if (input.ownerName?.trim()) {
    billedToLines.push(pdfSafe(input.ownerName.trim()));
  }
  if (input.ownerEmail?.trim()) {
    billedToLines.push(pdfSafe(input.ownerEmail.trim()));
  }
  if (input.ownerPhone?.trim()) {
    billedToLines.push(pdfSafe(input.ownerPhone.trim()));
  }
  const billedLineCount = Math.max(billedToLines.length, 2);
  const detailsLineCount = 4;
  const cardH = Math.max(92, 28 + Math.max(billedLineCount, detailsLineCount) * 14);
  drawRoundedRect(page, left, y - cardH, cardW, cardH, slate50, slate200);
  drawRoundedRect(
    page,
    left + contentWidth / 2 + 8,
    y - cardH,
    cardW,
    cardH,
    slate50,
    slate200
  );

  const drawLabelValue = (
    x: number,
    topY: number,
    label: string,
    lines: string[],
    f: PDFFont,
    fb: PDFFont
  ) => {
    page.drawText(label, {
      x,
      y: topY - 14,
      size: 8,
      font: f,
      color: slate500,
    });
    let lineY = topY - 30;
    lines.forEach((line, idx) => {
      page.drawText(line, {
        x,
        y: lineY,
        size: idx === 0 ? 11 : 8,
        font: idx === 0 ? fb : f,
        color: idx === 0 ? slate900 : slate500,
        maxWidth: cardW - 28,
      });
      lineY -= idx === 0 ? 15 : 13;
    });
  };

  drawLabelValue(left + 14, y, "BILLED TO", billedToLines, font, fontBold);

  drawLabelValue(left + contentWidth / 2 + 22, y, "DOCUMENT DETAILS", [
    `Invoice No: ${pdfSafe(input.invoiceNumber)}`,
    `Receipt No: ${pdfSafe(input.receiptNumber)}`,
    `Date: ${formatDate(input.issuedAt)}`,
    "Status: Paid",
  ], font, fontBold);

  y -= cardH + 28;

  // Table header
  const headerH = 28;
  page.drawRectangle({
    x: left,
    y: y - headerH,
    width: contentWidth,
    height: headerH,
    color: teal600,
  });
  page.drawText("DESCRIPTION", {
    x: left + 14,
    y: y - 18,
    size: 9,
    font: fontBold,
    color: white,
  });
  page.drawText("QTY", {
    x: left + contentWidth * 0.55,
    y: y - 18,
    size: 9,
    font: fontBold,
    color: white,
  });
  const amountHeader = "AMOUNT";
  const amountHeaderW = fontBold.widthOfTextAtSize(amountHeader, 9);
  page.drawText(amountHeader, {
    x: right - 14 - amountHeaderW,
    y: y - 18,
    size: 9,
    font: fontBold,
    color: white,
  });

  y -= headerH + 18;

  page.drawText(pdfSafe(input.planLabel), {
    x: left + 14,
    y,
    size: 10,
    font: fontBold,
    color: slate900,
    maxWidth: contentWidth * 0.5,
  });
  y -= 14;
  page.drawText(pdfSafe(input.description), {
    x: left + 14,
    y,
    size: 8,
    font,
    color: slate500,
    maxWidth: contentWidth * 0.5,
  });

  if (input.periodStart && input.periodEnd) {
    y -= 14;
    page.drawText(
      pdfSafe(
        `Period: ${formatDate(input.periodStart)} - ${formatDate(input.periodEnd)}`
      ),
      {
        x: left + 14,
        y,
        size: 8,
        font,
        color: slate500,
        maxWidth: contentWidth * 0.5,
      }
    );
  }

  const qtyY = y + 20;
  page.drawText(String(input.seats), {
    x: left + contentWidth * 0.55,
    y: qtyY,
    size: 10,
    font,
    color: slate900,
  });
  const showGst = appliesIndianGst(input.currency);
  const gst = showGst
    ? splitGstInclusive(input.amountMinor)
    : {
        exclusiveMinor: input.amountMinor,
        gstMinor: 0,
        totalMinor: input.amountMinor,
      };
  const exclusiveMoney = formatMoney(gst.exclusiveMinor, input.currency);
  const gstMoney = formatMoney(gst.gstMinor, input.currency);
  const totalMoney = formatMoney(gst.totalMinor, input.currency);
  const lineMoneyW = fontBold.widthOfTextAtSize(exclusiveMoney, 10);
  page.drawText(exclusiveMoney, {
    x: right - 14 - lineMoneyW,
    y: qtyY,
    size: 10,
    font: fontBold,
    color: slate900,
  });

  y -= 24;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 1,
    color: slate200,
  });

  y -= 24;
  const totalsX = left + contentWidth * 0.55;

  if (showGst) {
    page.drawText("Taxable value", {
      x: totalsX,
      y,
      size: 9,
      font,
      color: slate500,
    });
    const taxableW = font.widthOfTextAtSize(exclusiveMoney, 9);
    page.drawText(exclusiveMoney, {
      x: right - 14 - taxableW,
      y,
      size: 9,
      font,
      color: slate900,
    });

    y -= 16;
    page.drawText(`GST (${GST_RATE_PERCENT}%)`, {
      x: totalsX,
      y,
      size: 9,
      font,
      color: slate500,
    });
    const gstW = font.widthOfTextAtSize(gstMoney, 9);
    page.drawText(gstMoney, {
      x: right - 14 - gstW,
      y,
      size: 9,
      font,
      color: slate900,
    });

    y -= 16;
    page.drawText(pdfSafe(`GSTIN: ${GSTIN}`), {
      x: totalsX,
      y,
      size: 7,
      font,
      color: slate500,
    });

    y -= 30;
  } else {
    page.drawText("Subtotal", {
      x: totalsX,
      y,
      size: 9,
      font,
      color: slate500,
    });
    const subtotalW = font.widthOfTextAtSize(exclusiveMoney, 9);
    page.drawText(exclusiveMoney, {
      x: right - 14 - subtotalW,
      y,
      size: 9,
      font,
      color: slate900,
    });
    y -= 28;
  }

  page.drawRectangle({
    x: totalsX - 8,
    y: y - 6,
    width: contentWidth * 0.45 + 8,
    height: 28,
    color: teal100,
  });
  page.drawText("Total paid", {
    x: totalsX,
    y: y + 4,
    size: 11,
    font: fontBold,
    color: teal600,
  });
  const totalW = fontBold.widthOfTextAtSize(totalMoney, 11);
  page.drawText(totalMoney, {
    x: right - 14 - totalW,
    y: y + 4,
    size: 11,
    font: fontBold,
    color: teal600,
  });

  y -= 48;
  const refH = 78;
  drawRoundedRect(page, left, y - refH, contentWidth, refH, slate50, slate200);
  page.drawText("PAYMENT REFERENCE", {
    x: left + 14,
    y: y - 18,
    size: 8,
    font: fontBold,
    color: slate500,
  });
  page.drawText("Gateway: Razorpay", {
    x: left + 14,
    y: y - 36,
    size: 9,
    font,
    color: slate900,
  });
  page.drawText(pdfSafe(`Order ID: ${input.razorpayOrderId}`), {
    x: left + 14,
    y: y - 50,
    size: 9,
    font,
    color: slate900,
    maxWidth: contentWidth - 28,
  });
  page.drawText(pdfSafe(`Payment ID: ${input.razorpayPaymentId || "-"}`), {
    x: left + 14,
    y: y - 64,
    size: 9,
    font,
    color: slate900,
    maxWidth: contentWidth - 28,
  });

  // Footer — professional company strip
  const slate400 = rgb(0.58, 0.64, 0.72);
  const footerTop = 122;

  page.drawLine({
    start: { x: left, y: footerTop },
    end: { x: right, y: footerTop },
    thickness: 1,
    color: slate200,
  });

  const centerText = (
    text: string,
    atY: number,
    size: number,
    weight: PDFFont,
    color: ReturnType<typeof rgb>
  ) => {
    const safe = pdfSafe(text);
    const tw = weight.widthOfTextAtSize(safe, size);
    page.drawText(safe, {
      x: (width - tw) / 2,
      y: atY,
      size,
      font: weight,
      color,
    });
  };

  centerText(COMPANY_NAME, footerTop - 18, 10, fontBold, slate900);
  centerText(
    "Built for Bharat, Ready for the World",
    footerTop - 32,
    8,
    font,
    slate500
  );
  centerText(
    `Udyam Registration No: ${UDYAM_REGISTRATION_NUMBER}`,
    footerTop - 46,
    8,
    font,
    slate500
  );
  centerText(
    `GSTIN: ${GSTIN}`,
    footerTop - 60,
    8,
    font,
    slate500
  );
  centerText(
    `Support: support@anshapps.com  |  Website: anshapps.com`,
    footerTop - 74,
    8,
    font,
    slate500
  );
  centerText(
    "For billing support contact support@anshapps.com",
    footerTop - 88,
    7,
    font,
    slate400
  );

  page.drawLine({
    start: { x: left + contentWidth * 0.22, y: footerTop - 98 },
    end: { x: right - contentWidth * 0.22, y: footerTop - 98 },
    thickness: 0.5,
    color: slate200,
  });

  centerText(
    "This is a computer-generated receipt for your subscription payment. Thank you for choosing ANSH Apps.",
    footerTop - 112,
    7,
    font,
    slate400
  );

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

/** Stable document numbers derived from a transaction id + date. */
export function documentNumbersFromTransaction(id: string, createdAt: Date) {
  const year = createdAt.getFullYear();
  // Deterministic 6-digit sequence from UUID hex (stable across regenerations).
  const hex = id.replace(/-/g, "").slice(0, 8);
  const seq = (parseInt(hex, 16) % 1_000_000).toString().padStart(6, "0");
  return {
    invoiceNumber: `INV-${year}-${seq}`,
    receiptNumber: `RCPT-${year}-${seq}`,
  };
}

export function receiptNumberFromTransaction(id: string, createdAt: Date) {
  return documentNumbersFromTransaction(id, createdAt).receiptNumber;
}

export function formatOwnerDisplayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}) {
  const full = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return full || user.email.split("@")[0] || "Owner";
}

