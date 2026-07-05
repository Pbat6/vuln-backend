import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExploreCache } from '../entities/explore-cache.entity';
import { Image } from '../entities/image.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { User } from '../entities/user.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        entities: [User, Image, ExploreCache, UserSettings],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([User, Image, ExploreCache, UserSettings]),
  ],
  providers: [SeedService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}