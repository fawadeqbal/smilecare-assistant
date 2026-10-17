import { BadRequestException, Injectable } from '@nestjs/common';
import type { DocumentSourceType } from '@smilecare/shared';
import { PDFParse } from 'pdf-parse';

export interface ExtractedText {
  text: string;
  sourceType: DocumentSourceType;
}

/**
 * Turns an uploaded file into plain text. Add a case here (and a source type in
 * @smilecare/shared) to support new formats such as .docx or HTML.
 */
@Injectable()
export class TextExtractor {
  async extract(file: { buffer: Buffer; mimetype: string; originalname: string }): Promise<ExtractedText> {
    const name = file.originalname.toLowerCase();

    if (file.mimetype === 'application/pdf' || name.endsWith('.pdf')) {
      const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
      try {
        const result = await parser.getText();
        return { text: clean(result.text), sourceType: 'pdf' };
      } catch {
        throw new BadRequestException('Could not read this PDF. Is it password protected or scanned?');
      } finally {
        await parser.destroy();
      }
    }

    if (name.endsWith('.md') || name.endsWith('.markdown') || file.mimetype === 'text/markdown') {
      return { text: clean(file.buffer.toString('utf8')), sourceType: 'markdown' };
    }

    if (file.mimetype.startsWith('text/') || name.endsWith('.txt')) {
      return { text: clean(file.buffer.toString('utf8')), sourceType: 'text' };
    }

    throw new BadRequestException('Unsupported file type. Upload a PDF, Markdown or plain text file.');
  }
}

function clean(text: string): string {
  return text
    .replace(/\u0000/g, '')
    .replace(/-- \d+ of \d+ --/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
