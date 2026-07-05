import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExploreCache } from '../entities/explore-cache.entity';
import { Image } from '../entities/image.entity';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';

@Module({
  imports: [TypeOrmModule.forFeature([Image, ExploreCache])],
  controllers: [ImagesController],
  providers: [ImagesService],
})
export class ImagesModule {}