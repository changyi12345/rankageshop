import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post('payment-proof')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadPaymentProof(@UploadedFile() file?: { buffer: Buffer; originalname: string }) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = this.uploadsService.saveBuffer(file.buffer, file.originalname, 5 * 1024 * 1024);
    return { url };
  }

  @Post('payment-proof-base64')
  @UseGuards(JwtAuthGuard)
  uploadPaymentProofBase64(@Body('data') data: string) {
    if (!data?.trim()) throw new BadRequestException('No image data');
    const url = this.uploadsService.saveBase64(data);
    return { url };
  }
}
