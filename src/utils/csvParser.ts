import { TeachingRecord } from "../types";

/**
 * Robust CSV parser that handles:
 * - Semicolon (;) separator
 * - Double quotes enclosing values (with possible newlines or semicolons inside)
 * - Headers: Môn;Tên môn;Lớp;Chuyên ngành;Số sinh viên cần học;Part;Giảng viên;Số giờ AP
 */
export function parseCSV(csvText: string): TeachingRecord[] {
  const records: TeachingRecord[] = [];
  let i = 0;
  const len = csvText.length;

  // Helper to parse a single line/row considering quotes
  function parseNextRow(): string[] | null {
    if (i >= len) return null;
    const row: string[] = [];
    let currentValue = "";
    let inQuotes = false;

    while (i < len) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            // Escaped quote inside quote
            currentValue += '"';
            i += 2;
          } else {
            // End of quote
            inQuotes = false;
            i++;
          }
        } else {
          currentValue += char;
          i++;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
          i++;
        } else if (char === ';') {
          row.push(currentValue.trim());
          currentValue = "";
          i++;
        } else if (char === '\r' || char === '\n') {
          row.push(currentValue.trim());
          currentValue = "";
          // Skip the newline characters
          if (char === '\r' && nextChar === '\n') {
            i += 2;
          } else {
            i++;
          }
          return row;
        } else {
          currentValue += char;
          i++;
        }
      }
    }

    // Push final value
    row.push(currentValue.trim());
    return row.length > 0 && row.some(cell => cell !== "") ? row : null;
  }

  // Parse header
  const header = parseNextRow();
  if (!header) return [];

  // Map header column indices
  // Expected: Môn;Tên môn;Lớp;Chuyên ngành;Số sinh viên cần học;Part;Giảng viên;Số giờ AP
  let mIdx = header.findIndex(h => h.toLowerCase().includes("môn") && !h.toLowerCase().includes("tên"));
  let tmIdx = header.findIndex(h => h.toLowerCase().includes("tên môn"));
  let lIdx = header.findIndex(h => h.toLowerCase().includes("lớp"));
  let cnIdx = header.findIndex(h => h.toLowerCase().includes("chuyên ngành") || h.toLowerCase().includes("ngành"));
  let svIdx = header.findIndex(h => h.toLowerCase().includes("sinh viên"));
  let pIdx = header.findIndex(h => h.toLowerCase().includes("part"));
  let gvIdx = header.findIndex(h => h.toLowerCase().includes("giảng viên") || h.toLowerCase().includes("gv"));
  let gIdx = header.findIndex(h => h.toLowerCase().includes("giờ") || h.toLowerCase().includes("hours") || h.toLowerCase().includes("ap"));

  // Fallbacks if header labels don't match exactly
  if (mIdx === -1) mIdx = 0;
  if (tmIdx === -1) tmIdx = 1;
  if (lIdx === -1) lIdx = 2;
  if (cnIdx === -1) cnIdx = 3;
  if (svIdx === -1) svIdx = 4;
  if (pIdx === -1) pIdx = 5;
  if (gvIdx === -1) gvIdx = 6;
  if (gIdx === -1) gIdx = 7;

  let rowCount = 0;
  while (true) {
    const row = parseNextRow();
    if (!row) break;

    // Pad row with empty strings if it has fewer columns than header
    while (row.length < header.length) {
      row.push("");
    }

    const subjectCode = row[mIdx] || "";
    const subjectName = row[tmIdx] || "";
    const className = row[lIdx] || "";
    const major = row[cnIdx] || "";
    
    // Parse numbers safely
    const studentCountStr = row[svIdx] || "0";
    const studentCount = parseInt(studentCountStr.replace(/[^0-9]/g, ""), 10) || 0;
    
    const part = row[pIdx] || "";
    const lecturer = row[gvIdx] || "";
    
    const hoursStr = row[gIdx] || "0";
    const hours = parseFloat(hoursStr.replace(/[^0-9.]/g, "")) || 0;

    // Skip empty lines
    if (!subjectCode && !subjectName && !className) continue;

    records.push({
      id: `record-${rowCount++}-${Date.now()}`,
      subjectCode,
      subjectName,
      className,
      major,
      studentCount,
      part,
      lecturer,
      hours
    });
  }

  return records;
}

/**
 * Converts a list of records back into CSV text with `;` separator
 */
export function exportToCSV(records: TeachingRecord[]): string {
  const headers = ["Môn", "Tên môn", "Lớp", "Chuyên ngành", "Số sinh viên cần học", "Part", "Giảng viên", "Số giờ AP"];
  const rows = records.map(r => {
    // Escape values that have double quotes or semicolons or newlines
    const escape = (val: string | number) => {
      const str = String(val);
      if (str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    return [
      escape(r.subjectCode),
      escape(r.subjectName),
      escape(r.className),
      escape(r.major),
      r.studentCount,
      escape(r.part),
      escape(r.lecturer),
      r.hours
    ].join(";");
  });

  return [headers.join(";"), ...rows].join("\n");
}
