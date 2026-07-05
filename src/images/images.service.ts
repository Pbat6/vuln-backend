import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { exec } from 'child_process';
import { createReadStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { extname, join } from 'path';
import { promisify } from 'util';
import { DataSource, Repository } from 'typeorm';
import { ExploreCache } from '../entities/explore-cache.entity';
import { Image, ImageSource } from '../entities/image.entity';
import { EditImageDto, UploadImageDto } from './dto/images.dto';

const execAsync = (command: string) =>
  promisify(exec)(command, {
    shell: process.platform === 'win32' ? process.env.COMSPEC || 'cmd.exe' : '/bin/sh',
  });
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.html'];

interface PicsumItem {
  id: string;
  author: string;
  width: number;
  height: number;
}

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);
  private readonly uploadDir: string;
  private readonly imagemagickCmd: string;

  constructor(
    @InjectRepository(Image)
    private readonly imagesRepo: Repository<Image>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = join(
      process.cwd(),
      this.configService.get<string>('uploadDir') ?? 'uploads',
    );
    this.imagemagickCmd =
      this.configService.get<string>('imagemagickCmd') ?? 'magick';

    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // --- Upload (vuln #2: XSS via weak validation + static serve) ---

  private validateUpload(originalname: string) {
    const ext = extname(originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `File type not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }
  }

  async saveUpload(
    userId: number,
    file: Express.Multer.File,
    dto: UploadImageDto,
  ) {
    this.validateUpload(file.originalname);

    const image = this.imagesRepo.create({
      user_id: userId,
      filename: file.filename,
      title: dto.title ?? file.originalname,
      description: dto.description,
      source: ImageSource.UPLOAD,
    });

    const saved = await this.imagesRepo.save(image);
    return { ...saved, url: this.getImageUrl(saved) };
  }

  private resolveFilePath(filename: string): string | null {
    const filePath = join(this.uploadDir, filename);
    return existsSync(filePath) ? filePath : null;
  }

  private getImageUrl(image: Image): string | null {
    if (image.source !== ImageSource.UPLOAD) return null;
    if (existsSync(join(this.uploadDir, image.filename))) {
      return `/uploads/${image.filename}`;
    }
    return null;
  }

  async findById(id: number, userId?: number) {
    const image = await this.imagesRepo.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    if (userId && image.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return {
      ...image,
      url: this.getImageUrl(image),
    };
  }

  // --- Explore (vuln #5a: error-based SQLi) ---

  async syncFromPicsum() {
    try {
      const response = await fetch(
        'https://picsum.photos/v2/list?page=1&limit=30',
      );
      const items = (await response.json()) as PicsumItem[];
      const repo = this.dataSource.getRepository(ExploreCache);

      for (const item of items) {
        const existing = await repo.findOne({ where: { picsum_id: item.id } });
        if (existing) continue;

        await repo.save(
          repo.create({
            picsum_id: item.id,
            author: item.author,
            width: item.width,
            height: item.height,
            tags: `${item.author},photo,explore`,
          }),
        );
      }
      this.logger.log(`Synced ${items.length} pics from Picsum`);
    } catch (error) {
      this.logger.warn(`Picsum sync failed: ${(error as Error).message}`);
    }
  }

  async searchExplore(search?: string) {
    if (!search) {
      return this.dataSource.getRepository(ExploreCache).find({
        take: 20,
        order: { id: 'DESC' },
      });
    }
    const sql = `SELECT * FROM explore_cache WHERE tags LIKE '%${search}%' LIMIT 20`;
    return this.dataSource.query(sql);
  }

  getPicsumUrl(picsumId: string, width = 800, height = 600) {
    return `https://picsum.photos/id/${picsumId}/${width}/${height}`;
  }

  // --- My images (vuln #5b: blind SQLi) ---

  async searchMyImages(userId: number, search?: string) {
    let images: Image[];
    if (!search) {
      images = await this.imagesRepo.find({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
      });
    } else {
      const sql = `SELECT * FROM images WHERE user_id = ${userId} AND title LIKE '%${search}%'`;
      try {
        images = await this.dataSource.query(sql);
      } catch {
        // Blind SQLi: không leak lỗi SQL, trả về rỗng để phân biệt true/false qua số lượng kết quả
        images = [];
      }
    }
    return images.map((image) => ({
      ...image,
      url: this.getImageUrl(image),
    }));
  }

  async remove(id: number, userId: number) {
    const image = await this.imagesRepo.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    if (image.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const filePath = this.resolveFilePath(image.filename);
    if (filePath) {
      unlinkSync(filePath);
    }

    await this.imagesRepo.remove(image);
    return { deleted: true, id };
  }

  // --- Download (vuln #1: path traversal) ---

  download(file: string) {
    const filePath = join(this.uploadDir, file);
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    return new StreamableFile(createReadStream(filePath));
  }

  // --- Edit (vuln #3: command injection) ---

  async editImage(id: number, userId: number, dto: EditImageDto) {
    const image = await this.imagesRepo.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    if (image.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const inputPath = this.resolveFilePath(image.filename);
    if (!inputPath) {
      throw new NotFoundException('Source file not found on disk');
    }

    const format = dto.format ?? 'png';
    const outputName = `edited-${Date.now()}.${format}`;
    const outputPath = join(this.uploadDir, outputName);
    const command = `${this.imagemagickCmd} "${inputPath}" -resize ${dto.width}x${dto.height} "${outputPath}"`;

    try {
      await execAsync(command);
    } catch (error) {
      const err = error as { message?: string; stderr?: string };
      throw new InternalServerErrorException({
        message: 'ImageMagick command failed',
        command,
        detail: err.stderr ?? err.message,
      });
    }

    if (!existsSync(outputPath)) {
      throw new BadRequestException({
        message:
          'Output file was not created. The edit command may have been broken by injected shell operators.',
        command,
      });
    }

    image.filename = outputName;
    await this.imagesRepo.save(image);

    return {
      id: image.id,
      filename: outputName,
      command,
      url: `/uploads/${outputName}`,
    };
  }
}