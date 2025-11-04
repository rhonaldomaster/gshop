import { Injectable, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as multer from 'multer'
import * as path from 'path'
import * as fs from 'fs'

@Injectable()
export class SellersUploadService {
  private readonly uploadDir: string

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'sellers')
    this.ensureUploadDirExists()
  }

  private ensureUploadDirExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
    }
  }

  getMulterConfig() {
    return {
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, this.uploadDir)
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
          const ext = path.extname(file.originalname)
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
        },
      }),
      fileFilter: (req, file, cb) => {
        // Solo permitir PDFs e imágenes
        const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(new BadRequestException('Solo se permiten archivos PDF o imágenes'), false)
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
      },
    }
  }

  getFileUrl(filename: string): string {
    const baseUrl = this.configService.get<string>('API_URL', 'http://localhost:3000')
    return `${baseUrl}/uploads/sellers/${filename}`
  }

  deleteFile(fileUrl: string): void {
    try {
      const filename = path.basename(fileUrl)
      const filePath = path.join(this.uploadDir, filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }
}
