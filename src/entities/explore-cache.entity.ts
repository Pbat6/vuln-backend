import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('explore_cache')
export class ExploreCache {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  picsum_id: string;

  @Column({ nullable: true })
  author: string;

  @Column({ type: 'int', default: 0 })
  width: number;

  @Column({ type: 'int', default: 0 })
  height: number;

  @Column({ type: 'text', nullable: true })
  tags: string;
}