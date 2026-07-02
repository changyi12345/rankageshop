import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

@Injectable()
export class UploadsService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor() {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  saveBuffer(buffer: Buffer, originalName: string, maxBytes = 3 * 1024 * 1024): string {
    const ext = extname(originalName).toLowerCase() || '.png';
    if (!ALLOWED_EXT.has(ext)) {
      throw new BadRequestException('Only JPG, PNG, WEBP, GIF images are allowed');
    }
    if (buffer.length > maxBytes) {
      throw new BadRequestException(`Image must be under ${Math.round(maxBytes / (1024 * 1024))}MB`);
    }
    const filename = `${uuidv4()}${ext}`;
    writeFileSync(join(this.uploadDir, filename), buffer);
    return `/uploads/${filename}`;
  }

  saveBase64(dataUrl: string): string {
    const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) throw new BadRequestException('Invalid image data');
    const ext = `.${match[1] === 'jpeg' ? 'jpg' : match[1]}`;
    if (!ALLOWED_EXT.has(ext)) {
      throw new BadRequestException('Unsupported image format');
    }
    const buffer = Buffer.from(match[2], 'base64');
    return this.saveBuffer(buffer, `upload${ext}`);
  }
}
