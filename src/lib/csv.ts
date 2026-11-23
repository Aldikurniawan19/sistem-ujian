const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/**
 * Escapes a CSV cell and neutralizes spreadsheet formula injection.
 */
export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  let text = String(value);
  if (FORMULA_PREFIX.test(text)) {
    text = `'${text}`;
  }
  if (text.includes(",") || text.includes('"') || text.includes("\n") || text.includes("\r")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsvDocument(
  headers: readonly string[],
  rows: readonly (readonly (string | number | boolean | null | undefined)[])[]
): string {
  const headerLine = headers.map((h) => escapeCsvCell(h)).join(",");
  const bodyLines = rows.map((row) =>
    row.map((cell) => escapeCsvCell(cell)).join(",")
  );
  // UTF-8 BOM for seamless Microsoft Excel opening in Indonesian schools
  return `\uFEFF${[headerLine, ...bodyLines].join("\r\n")}`;
}

/**
 * RFC-4180 compliant minimal CSV parser supporting quoted fields and newlines.
 */
export function parseCsvText(input: string): string[][] {
  const cleaned = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    const next = cleaned[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else if (ch !== undefined) {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field.trim());
      field = "";
    } else if (ch === "\r" && next === "\n") {
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
      i += 1;
    } else if (ch === "\n") {
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else if (ch !== undefined) {
      field += ch;
    }
  }

  row.push(field.trim());
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }

  return rows;
}
