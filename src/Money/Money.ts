// eslint-disable-next-line @typescript-eslint/no-var-requires
const currency = require('currency.js');
import currencyNamespace from 'currency.js';

interface currencyLibObject {
  add(number: currencyNamespace.Any): currencyLibObject;
  subtract(number: currencyNamespace.Any): currencyLibObject;
  multiply(number: currencyNamespace.Any): currencyLibObject;
  divide(number: currencyNamespace.Any): currencyLibObject;
  distribute(count: number): Array<currencyLibObject>;
  dollars(): number;
  cents(): number;
  format(opts?: currencyNamespace.Options | currencyNamespace.Format): string;
  toString(): string;
  toJSON(): number;
  readonly intValue: number;
  readonly value: number;
}

export default class Money {
  private readonly internalMoney: currencyLibObject;
  private readonly currency: string;

  constructor(internalMoney: currencyLibObject, currency: string) {
    this.internalMoney = internalMoney;
    this.currency = currency;
  }

  public static newFromString(amount: string, currencySymbol: string): Money {
    //TODO: If amount is "USD" it does not throw an error

    if (currencySymbol.trim() === '') {
      throw new Error('Currency must not be empty');
    }

    if (amount.trim() === '') {
      throw new Error('Amount must not be an empty string');
    }

    const money = currency(amount, { errorOnInvalid: true, precision: 2 });
    if (isNaN(money.value)) {
      throw new Error('Invalid amount');
    }

    if (money.value < 0) {
      throw new Error('Amount must not be negative');
    }

    return new Money(money, currencySymbol);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(`Parameter's currency must be ${this.currency}`);
    }

    return new Money(
      this.internalMoney.add(other.internalMoney),
      this.currency,
    );
  }

  divide(number: number): Money {
    //TODO: there's some problems when you divide 5/2, because it rounds
    return new Money(this.internalMoney.divide(number), this.currency);
  }

  serialize(): {
    cents: number;
    currency: string;
    floatValue: number;
  } {
    return {
      cents: this.internalMoney.intValue,
      currency: this.currency,
      floatValue: this.internalMoney.value,
    };
  }
}
