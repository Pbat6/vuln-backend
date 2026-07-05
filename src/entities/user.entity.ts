import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { Image } from './image.entity';
import { UserSettings } from './user-settings.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Image, (image) => image.user)
  images: Image[];

  @OneToMany(() => UserSettings, (settings) => settings.user)
  settings: UserSettings[];
}