import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import * as bcrypt from 'bcrypt';

@Entity({ name: 'users' })
export class User {
  private readonly SALT_ROUNDS = 10;

  @PrimaryGeneratedColumn('uuid')
  private id: string | undefined;

  @Column({ name: 'email' })
  private readonly email: string;

  @Column({ name: 'hashed_password' })
  private hashedPassword: string;

  @CreateDateColumn({ name: 'created_at' })
  private createdAt: Date | undefined;

  @UpdateDateColumn({ name: 'updated_at' })
  private updatedAt: Date | undefined;

  constructor(email: string, password: string) {
    this.email = email;

    this.setPassword(password);
  }

  private setPassword(password: string) {
    if (password === undefined) {
      return;
    }

    this.hashedPassword = bcrypt.hashSync(password, this.SALT_ROUNDS);
  }

  public isValidPassword(password: string): Promise<boolean> {
    return bcrypt.compareSync(password, this.hashedPassword);
  }

  public getEmail(): string {
    return this.email;
  }
}
