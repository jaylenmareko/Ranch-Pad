import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Brand palette ─────────────────────────────────────────────────────────────
const GREEN      = [26,  60,  55]  as [number,number,number]; // #1A3C37 — header bg
const ACCENT     = [66, 169, 110]  as [number,number,number]; // #42A96E — accent
const WHITE      = [255,255,255]  as [number,number,number];
const DARK       = [15,  30,  28]  as [number,number,number]; // body text
const SUBTEXT    = [100,130,125]  as [number,number,number]; // muted
const LIGHT_BG   = [240,248,244]  as [number,number,number]; // section bg
const BORDER     = [200,220,215]  as [number,number,number]; // table border

type SavedPhoto = {
  id: number;
  objectPath: string;
  originalFilename: string;
  mimeType: string;
};

export interface PdfAnimalData {
  // identity
  ranchName: string;
  name: string;
  tagNumber?: string | null;
  species: string;
  breed?: string | null;
  sex: string;
  dateOfBirth?: string | null;
  locationName?: string | null;
  damName?: string | null;
  dam?: { name: string } | null;
  sireName?: string | null;
  sire?: { name: string } | null;
  babies?: { name: string; tagNumber?: string | null }[];
  // records
  healthEvents: { id: number; description: string; eventDate: string; severity: string }[];
  medications: { id: number; medicationName: string; dosage?: string | null; dateGiven: string; nextDueDate?: string | null }[];
  famachaScores: { score: number; recordedDate: string }[];
  fieldNotes: { noteText: string; createdAt: string | Date }[];
  // photos keyed by health event id & med id
  healthPhotos: Record<string, SavedPhoto[]>;
  medPhotos: Record<string, SavedPhoto[]>;
}

// ── Helper: fetch a /api/storage image and return a data URL ─────────────────
async function imageToDataUrl(objectPath: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/storage${objectPath}`);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ── Helper: draw a section header bar ────────────────────────────────────────
function sectionHeader(doc: jsPDF, label: string, y: number, pageW: number, margin: number): number {
  doc.setFillColor(...LIGHT_BG);
  doc.rect(margin, y, pageW - margin * 2, 8, "F");
  doc.setTextColor(...ACCENT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(label.toUpperCase(), margin + 3, y + 5.5);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  return y + 10;
}

// ── Helper: nicely format a date string ──────────────────────────────────────
function fmtDate(d?: string | null | Date): string {
  if (!d) return "—";
  const date = new Date(typeof d === "string" ? d + "T12:00:00" : d);
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ── Helper: severity badge color ─────────────────────────────────────────────
function sevColor(sev: string): [number,number,number] {
  if (sev === "high")   return [220, 38, 38];
  if (sev === "medium") return [217, 119, 6];
  return [34, 197, 94];
}

// ── Main export function ──────────────────────────────────────────────────────
export async function generateAnimalPDF(data: PdfAnimalData): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "letter", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;

  // ── Collect all photos to pre-load ─────────────────────────────────────────
  const allPhotoPaths: string[] = [];
  Object.values(data.healthPhotos).flat().forEach(p => allPhotoPaths.push(p.objectPath));
  Object.values(data.medPhotos).flat().forEach(p => allPhotoPaths.push(p.objectPath));
  const photoDataUrls: Record<string, string | null> = {};
  await Promise.all(allPhotoPaths.map(async path => {
    photoDataUrls[path] = await imageToDataUrl(path);
  }));

  // ─────────────────────────────────────────────────────────────────────────
  // PAGE HEADER BANNER
  // ─────────────────────────────────────────────────────────────────────────
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageW, 28, "F");

  // Green accent stripe
  doc.setFillColor(...ACCENT);
  doc.rect(0, 26, pageW, 2, "F");

  // Ranch name
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(data.ranchName.toUpperCase(), margin, 10);

  // Animal name (large)
  doc.setFontSize(18);
  doc.text(data.name, margin, 22);

  // Tag badge (top right)
  if (data.tagNumber) {
    const tagLabel = `# ${data.tagNumber}`;
    doc.setFontSize(9);
    const tagW = doc.getTextWidth(tagLabel) + 8;
    doc.setFillColor(...ACCENT);
    doc.roundedRect(pageW - margin - tagW, 14, tagW, 9, 2, 2, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(tagLabel, pageW - margin - tagW / 2, 19.5, { align: "center" });
  }

  // Generated date (top right, below tag)
  doc.setTextColor(180, 220, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageW - margin, 26.5, { align: "right" });

  let y = 36;

  // ─────────────────────────────────────────────────────────────────────────
  // IDENTITY GRID  (2-column)
  // ─────────────────────────────────────────────────────────────────────────
  const identFields: [string, string][] = [
    ["Species", data.species],
    ["Breed",   data.breed || "—"],
    ["Sex",     data.sex],
    ["Date of Birth", fmtDate(data.dateOfBirth)],
    ["Pasture / Location", data.locationName || "—"],
  ];
  if (data.sire || data.sireName) identFields.push(["Sire", data.sire?.name || data.sireName || "—"]);
  if (data.dam  || data.damName)  identFields.push(["Dam",  data.dam?.name  || data.damName  || "—"]);
  if (data.babies && data.babies.length > 0) {
    identFields.push(["Offspring", data.babies.map(b => b.name + (b.tagNumber ? ` (#${b.tagNumber})` : "")).join(", ")]);
  }

  const colMid = margin + contentW / 2 + 4;
  const leftFields  = identFields.filter((_, i) => i % 2 === 0);
  const rightFields = identFields.filter((_, i) => i % 2 === 1);
  const rowH = 7.5;
  const gridRows = Math.max(leftFields.length, rightFields.length);

  doc.setFillColor(248, 252, 250);
  doc.rect(margin, y - 2, contentW, gridRows * rowH + 4, "F");
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.rect(margin, y - 2, contentW, gridRows * rowH + 4);

  const renderIdentCol = (fields: [string,string][], x: number) => {
    fields.forEach(([label, value], i) => {
      const fy = y + i * rowH;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...SUBTEXT);
      doc.text(label, x + 3, fy + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      // wrap long values
      const maxW = contentW / 2 - 10;
      const lines = doc.splitTextToSize(value, maxW);
      doc.text(lines[0], x + 3, fy + 9);
    });
  };
  renderIdentCol(leftFields,  margin);
  renderIdentCol(rightFields, colMid);

  // Vertical divider
  doc.setDrawColor(...BORDER);
  doc.line(colMid - 2, y - 2, colMid - 2, y + gridRows * rowH + 2);

  y += gridRows * rowH + 8;

  // ─────────────────────────────────────────────────────────────────────────
  // HEALTH EVENTS
  // ─────────────────────────────────────────────────────────────────────────
  const checkPageBreak = (needed: number) => {
    if (y + needed > pageH - 20) {
      doc.addPage();
      y = 20;
    }
  };

  checkPageBreak(20);
  y = sectionHeader(doc, "Health Events", y, pageW, margin);

  if (data.healthEvents.length === 0) {
    doc.setTextColor(...SUBTEXT);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.text("No health events recorded.", margin + 3, y + 4);
    y += 10;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Date", "Description", "Severity"]],
      body: data.healthEvents
        .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
        .map(ev => [fmtDate(ev.eventDate), ev.description, ev.severity.charAt(0).toUpperCase() + ev.severity.slice(1)]),
      styles: { font: "helvetica", fontSize: 8.5, textColor: DARK, lineColor: BORDER, lineWidth: 0.2 },
      headStyles: { fillColor: GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 252, 250] },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 24, halign: "center" },
      },
      didParseCell: (hookData) => {
        if (hookData.section === "body" && hookData.column.index === 2) {
          const sev = String(hookData.cell.text).toLowerCase();
          hookData.cell.styles.textColor = sevColor(sev);
          hookData.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 4;

    // Inline photos for health events
    for (const ev of data.healthEvents) {
      const photos = (data.healthPhotos[(ev as any).id] || []).filter(p => photoDataUrls[p.objectPath]);
      if (photos.length === 0) continue;
      checkPageBreak(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...SUBTEXT);
      doc.text(`Photos — ${ev.description} (${fmtDate(ev.eventDate)})`, margin + 2, y + 4);
      y += 7;
      let px = margin;
      for (const photo of photos.slice(0, 4)) {
        const dataUrl = photoDataUrls[photo.objectPath];
        if (!dataUrl) continue;
        const imgSize = 38;
        checkPageBreak(imgSize + 8);
        try {
          doc.addImage(dataUrl, "JPEG", px, y, imgSize, imgSize);
        } catch { /* skip corrupt images */ }
        px += imgSize + 3;
        if (px + imgSize > pageW - margin) { px = margin; y += imgSize + 3; }
      }
      y += 42;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MEDICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  checkPageBreak(20);
  y = sectionHeader(doc, "Medications", y, pageW, margin);

  if (data.medications.length === 0) {
    doc.setTextColor(...SUBTEXT);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.text("No medications recorded.", margin + 3, y + 4);
    y += 10;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Medication", "Dosage", "Date Given", "Next Due"]],
      body: data.medications
        .sort((a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime())
        .map(m => [m.medicationName, m.dosage || "—", fmtDate(m.dateGiven), fmtDate(m.nextDueDate)]),
      styles: { font: "helvetica", fontSize: 8.5, textColor: DARK, lineColor: BORDER, lineWidth: 0.2 },
      headStyles: { fillColor: GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 252, 250] },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 30 },
        2: { cellWidth: 28, halign: "center" },
        3: { cellWidth: 28, halign: "center" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 4;

    // Inline photos for meds
    for (const med of data.medications) {
      const photos = (data.medPhotos[(med as any).id] || []).filter(p => photoDataUrls[p.objectPath]);
      if (photos.length === 0) continue;
      checkPageBreak(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...SUBTEXT);
      doc.text(`Photos — ${med.medicationName} (${fmtDate(med.dateGiven)})`, margin + 2, y + 4);
      y += 7;
      let px = margin;
      for (const photo of photos.slice(0, 4)) {
        const dataUrl = photoDataUrls[photo.objectPath];
        if (!dataUrl) continue;
        const imgSize = 38;
        checkPageBreak(imgSize + 8);
        try {
          doc.addImage(dataUrl, "JPEG", px, y, imgSize, imgSize);
        } catch { /* skip corrupt images */ }
        px += imgSize + 3;
        if (px + imgSize > pageW - margin) { px = margin; y += imgSize + 3; }
      }
      y += 42;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FAMACHA (sheep/goat only)
  // ─────────────────────────────────────────────────────────────────────────
  if (data.famachaScores.length > 0) {
    checkPageBreak(20);
    y = sectionHeader(doc, "FAMACHA Eye Scores  (1 = Anemic → 5 = Healthy)", y, pageW, margin);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Date", "Score", "Interpretation"]],
      body: data.famachaScores
        .sort((a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime())
        .map(s => {
          const interp = s.score === 1 ? "Critical — treat immediately"
            : s.score === 2 ? "Anemic — treat"
            : s.score === 3 ? "Monitor closely"
            : s.score === 4 ? "Acceptable"
            : "Healthy";
          return [fmtDate(s.recordedDate), String(s.score), interp];
        }),
      styles: { font: "helvetica", fontSize: 8.5, textColor: DARK, lineColor: BORDER, lineWidth: 0.2 },
      headStyles: { fillColor: GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 252, 250] },
      columnStyles: {
        0: { cellWidth: 35, halign: "center" },
        1: { cellWidth: 20, halign: "center", fontStyle: "bold" },
        2: { cellWidth: "auto" },
      },
      didParseCell: (hookData) => {
        if (hookData.section === "body" && hookData.column.index === 1) {
          const score = parseInt(String(hookData.cell.text));
          hookData.cell.styles.textColor = score <= 2 ? [220,38,38] : score === 3 ? [161,98,7] : [22,163,74];
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FIELD NOTES
  // ─────────────────────────────────────────────────────────────────────────
  if (data.fieldNotes.length > 0) {
    checkPageBreak(20);
    y = sectionHeader(doc, "Field Notes", y, pageW, margin);

    for (const note of [...data.fieldNotes].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )) {
      const text = note.noteText;
      const wrapped = doc.splitTextToSize(text, contentW - 6);
      const noteH = wrapped.length * 4.5 + 10;
      checkPageBreak(noteH + 4);

      doc.setFillColor(248, 252, 250);
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.25);
      doc.rect(margin, y, contentW, noteH, "FD");

      // Accent left bar
      doc.setFillColor(...ACCENT);
      doc.rect(margin, y, 2.5, noteH, "F");

      doc.setTextColor(...SUBTEXT);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(fmtDate(note.createdAt), margin + 6, y + 5);

      doc.setTextColor(...DARK);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(wrapped, margin + 6, y + 9.5);

      y += noteH + 3;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FOOTER on every page
  // ─────────────────────────────────────────────────────────────────────────
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setTextColor(...SUBTEXT);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("RanchPad — Livestock Management", margin, pageH - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 7, { align: "right" });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE
  // ─────────────────────────────────────────────────────────────────────────
  const safeName = data.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  doc.save(`${safeName}_record.pdf`);
}
