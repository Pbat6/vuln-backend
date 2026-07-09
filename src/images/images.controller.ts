import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  EditImageDto,
  SaveExploreImageDto,
  SearchImageDto,
  UploadImageDto,
} from './dto/images.dto';
import { ImagesService, validateUploadExtension } from './images.service';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get('explore')
  async explore(@Query() query: SearchImageDto) {
    await this.imagesService.syncFromPicsum();
    const results = await this.imagesService.searchExplore(query.search);
    return results.map(
      (item: { picsum_id: string; width: number; height: number }) => ({
        ...item,
        image_url: this.imagesService.getPicsumUrl(
          item.picsum_id,
          item.width || 800,
          item.height || 600,
        ),
      }),
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('explore/save')
  saveFromExplore(
    @CurrentUser('id') userId: number,
    @Body() dto: SaveExploreImageDto,
  ) {
    return this.imagesService.saveFromExplore(userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  searchMy(
    @CurrentUser('id') userId: number,
    @Query() query: SearchImageDto,
  ) {
    return this.imagesService.searchMyImages(userId, query.search);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (_req, file, cb) => {
        try {
          console.log(file.originalname)
          validateUploadExtension(file.originalname);
          cb(null, true);
        } catch (error) {
          cb(error as Error, false);
        }
      },
      storage: diskStorage({
        destination: (_req, _file, cb) =>
          cb(null, join(process.cwd(), 'uploads')),
        filename: (_req, file, cb) => cb(null, file.originalname),
      }),
    }),
  )
  
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  //     fileFilter: (_req, file, cb) => {
  //       try {
  //         validateUploadExtension(file.originalname);
  //         cb(null, true);
  //       } catch (error) {
  //         cb(error as Error, false);
  //       }
  //     },
  //     storage: diskStorage({
  //       destination: (_req, _file, cb) =>
  //         cb(null, join(process.cwd(), 'uploads')),
  //       filename: (_req, file, cb) => {
  //         const ext = extname(file.originalname).toLowerCase();
  //         cb(null, `${randomUUID()}${ext}`);
  //       },
  //     }),
  //   }),
  // )
  upload(
    @CurrentUser('id') userId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadImageDto,
  ) {
    return this.imagesService.saveUpload(userId, file, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.imagesService.findById(id, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/download')
  download(@Query('file') file: string) {
    if (!file) {
      throw new BadRequestException('file query parameter is required');
    }
    return this.imagesService.download(file);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/edit')
  edit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: EditImageDto,
  ) {
    return this.imagesService.editImage(id, userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.imagesService.remove(id, userId);
  }
}