import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { BID_DOCS_BUCKET, db } from "@/lib/supabase";
import { attachmentUrl, politeFetch } from "./fetcher";
import type { ParsedAttachment } from "./detail";

/**
 * Downloads a bid's attachments into Supabase Storage and pulls the text out
 * of the PDFs.
 *
 * A file already in Storage is never fetched again — that is the whole point
 * of keying `solicitation_documents` on (solicitation_id, file_name).
 */

export interface DocumentResult {
  fileName: string;
  status: "stored" | "skipped" | "failed";
  detail?: string;
}

export async function fetchDocuments(
  solicitationId: string,
  bidNumber: string,
  docId: string,
  attachments: ParsedAttachment[],
): Promise<DocumentResult[]> {
  const supabase = db();
  const results: DocumentResult[] = [];

  const { data: existing } = await supabase
    .from("solicitation_documents")
    .select("file_name, storage_path")
    .eq("solicitation_id", solicitationId);

  const alreadyStored = new Set(
    (existing ?? []).filter((row) => row.storage_path).map((row) => row.file_name),
  );

  for (const attachment of attachments) {
    if (alreadyStored.has(attachment.fileName)) {
      results.push({ fileName: attachment.fileName, status: "skipped", detail: "already in storage" });
      continue;
    }

    try {
      const url = attachmentUrl(docId, attachment.fileNbr);
      const response = await politeFetch(url);

      if (response.status !== 200 || response.body.length === 0) {
        throw new Error(`download returned ${response.status} (${response.body.length} bytes)`);
      }

      const fileName = response.filename ?? attachment.fileName;
      const storagePath = `${sanitizeSegment(bidNumber)}/${attachment.fileNbr}-${sanitizeSegment(fileName)}`;
      const mimeType = guessMimeType(fileName, response.contentType);

      const { error: uploadError } = await supabase.storage
        .from(BID_DOCS_BUCKET)
        .upload(storagePath, response.body, { contentType: mimeType, upsert: true });
      if (uploadError) throw new Error(`storage upload failed: ${uploadError.message}`);

      const extracted = await extractText(response.body, mimeType);

      const { error: rowError } = await supabase.from("solicitation_documents").upsert(
        {
          solicitation_id: solicitationId,
          file_name: attachment.fileName,
          source_url: url,
          storage_path: storagePath,
          mime_type: mimeType,
          byte_size: response.body.length,
          page_count: extracted.pageCount,
          text_extracted: extracted.text !== null,
          extracted_text: extracted.text,
          extract_error: extracted.error,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "solicitation_id,file_name" },
      );
      if (rowError) throw new Error(`row upsert failed: ${rowError.message}`);

      results.push({
        fileName: attachment.fileName,
        status: "stored",
        detail: extracted.text
          ? `${extracted.pageCount ?? "?"} pages, ${extracted.text.length} chars`
          : (extracted.error ?? "no text extracted"),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ fileName: attachment.fileName, status: "failed", detail: message });
      // Record the attempt so /admin shows what went wrong.
      await supabase.from("solicitation_documents").upsert(
        {
          solicitation_id: solicitationId,
          file_name: attachment.fileName,
          source_url: attachmentUrl(docId, attachment.fileNbr),
          text_extracted: false,
          extract_error: message,
        },
        { onConflict: "solicitation_id,file_name" },
      );
    }
  }

  return results;
}

interface Extracted {
  text: string | null;
  pageCount: number | null;
  error: string | null;
}

/**
 * v1 handles PDFs with an embedded text layer. Scanned PDFs come back with
 * almost no text; we flag them rather than OCR them.
 */
async function extractText(body: Buffer, mimeType: string): Promise<Extracted> {
  if (mimeType !== "application/pdf") {
    return { text: null, pageCount: null, error: `no extractor for ${mimeType}` };
  }
  try {
    const parsed = await pdfParse(body);
    const text = parsed.text.replace(/\n{3,}/g, "\n\n").trim();
    // ~40 characters a page is well under anything with a real text layer.
    if (text.length < Math.max(80, parsed.numpages * 40)) {
      return {
        text: text || null,
        pageCount: parsed.numpages,
        error: "little or no text layer — probably a scan (no OCR in v1)",
      };
    }
    return { text, pageCount: parsed.numpages, error: null };
  } catch (error) {
    return {
      text: null,
      pageCount: null,
      error: `pdf parse failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function sanitizeSegment(name: string): string {
  return name
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 120) || "file";
}

function guessMimeType(fileName: string, headerValue: string | null): string {
  // The site sends application/octet-stream for everything, so trust the
  // extension first and fall back to the header.
  const ext = fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  const byExt: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    zip: "application/zip",
    txt: "text/plain",
    csv: "text/csv",
    rtf: "application/rtf",
    dwg: "image/vnd.dwg",
  };
  if (ext && byExt[ext]) return byExt[ext];

  const header = headerValue?.split(";")[0].trim();
  return header && header !== "application/octet-stream" ? header : "application/octet-stream";
}

/** A short-lived link so the UI can open a stored document. */
export async function signedDocumentUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await db()
    .storage.from(BID_DOCS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}
