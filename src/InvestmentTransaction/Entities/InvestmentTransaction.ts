import { Account } from '../../Account/Entities/Account';
import Money from '../../Money/Money';
import Serializable from '../../Shared/Serialization/Serializable';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  TableInheritance,
  UpdateDateColumn,
} from 'typeorm';
import { InvalidArgumentException } from '../../Shared/Exceptions/InvalidArgumentException';
import ColumnNumericTransformer from '../../Shared/Database/Transformers/ColumnNumericTransformer';

@Entity({ name: 'investment_transactions' })
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class InvestmentTransaction implements Serializable {
  @PrimaryGeneratedColumn('uuid')
  private id: string | undefined;

  @ManyToOne(() => Account, (account) => account.investmentTransactions)
  @JoinColumn({ name: 'account_id' })
  account: Promise<Account>;

  @Column({ name: 'code' })
  private code: string;

  @Column({
    name: 'amount',
    type: 'numeric',
    //Typeorm map "numeric" type to string. So we need to apply this transformer
    transformer: new ColumnNumericTransformer(),
  })
  private amount: number;

  @Column(() => Money, { prefix: '' })
  private money: Money;

  @Column({ name: 'datetime' })
  private readonly datetime: Date;

  @CreateDateColumn({ name: 'created_at' })
  public createdAt: Date | undefined;

  @UpdateDateColumn({ name: 'updated_at' })
  private updatedAt: Date | undefined;

  protected constructor(
    account: Account,
    code: string,
    amount: number,
    money: Money,
    datetime: Date,
  ) {
    this.account = Promise.resolve(account);
    this.setCode(code);
    this.setAmount(amount);
    this.money = money;
    this.datetime = datetime;
  }

  public getCode(): string {
    return this.code;
  }

  private setCode(code: string) {
    if (code.trim() === '') {
      throw new InvalidArgumentException(
        'Code must not be empty',
        'Code must not be empty',
      );
    }

    this.code = code;
  }

  public getAmount(): number {
    return this.amount;
  }

  private setAmount(amount: number) {
    if (amount < 0) {
      throw new InvalidArgumentException(
        'Amount must be greater or equal than 0',
        'Amount must be greater or equal than 0',
      );
    }

    this.amount = amount;
  }

  async serialize(): Promise<object> {
    return {
      accountId: (await this.account).getId(),
      code: this.code,
      amount: this.amount,
      money: this.money.serialize(),
      datetime: this.datetime,
      action: this.getAction(),
    };
  }

  protected abstract getAction(): 'buy' | 'sell';
}
