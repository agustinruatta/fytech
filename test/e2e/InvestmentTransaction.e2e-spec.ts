import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import createAppToTest from './config/e2e-app-creator';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import Helpers from './Helpers';
import BuyInvestmentTransaction from '../../src/InvestmentTransaction/Entities/BuyInvestmentTransaction';
import SellInvestmentTransaction from '../../src/InvestmentTransaction/Entities/SellInvestmentTransaction';
import { AvailableCurrencies } from '../../src/Money/AvailableCurrencies';

describe('InvestmentTransaction (e2e)', () => {
  let app: INestApplication;
  let buyInvestmentTransactionRepository: Repository<BuyInvestmentTransaction>;
  let sellInvestmentTransactionRepository: Repository<SellInvestmentTransaction>;
  const actions = ['buy', 'sell'];

  const validBody = {
    code: 'BTC',
    amount: 150,
    money: {
      amount: '100',
      currency: AvailableCurrencies.USD,
    },
    datetime: '2023-10-07T11:00:00.000Z',
  };

  beforeAll(async () => {
    app = await createAppToTest();

    buyInvestmentTransactionRepository = app.get<
      Repository<BuyInvestmentTransaction>
    >(getRepositoryToken(BuyInvestmentTransaction));
    sellInvestmentTransactionRepository = app.get<
      Repository<SellInvestmentTransaction>
    >(getRepositoryToken(SellInvestmentTransaction));
  });

  actions.forEach((action) => {
    it('fails if body is empty', async () => {
      const signInData = await Helpers.signIn(app);

      return request(app.getHttpServer())
        .post('/investment-transaction/' + action)
        .auth(signInData.accessToken, { type: 'bearer' })
        .send({})
        .expect(400)
        .expect({
          message: [
            'accountId should not be empty',
            'code should not be empty',
            'amount should not be empty',
            'money should not be empty',
            'datetime must be a Date instance',
            'datetime should not be empty',
          ],
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('fails if account id is not found', async () => {
      const signInData = await Helpers.signIn(app);

      return request(app.getHttpServer())
        .post('/investment-transaction/' + action)
        .auth(signInData.accessToken, { type: 'bearer' })
        .send({
          ...validBody,
          accountId: '3ecded66-941f-493f-838e-59c7d7771b80',
        })
        .expect(400)
        .expect({
          message: ["You don't have permissions to use sent account id"],
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('fails if you do not have access to this account', async () => {
      const signInDataA = await Helpers.signIn(app);
      const signInDataB = await Helpers.signIn(app, {
        email: 'test@mail.com',
        password: 'password',
        defaultAccountName: 'Some name',
      });

      return request(app.getHttpServer())
        .post('/investment-transaction/' + action)
        .auth(signInDataB.accessToken, { type: 'bearer' })
        .send({
          ...validBody,
          accountId: (await signInDataA.user.accounts)[0].getId(),
        })
        .expect(400)
        .expect({
          message: ["You don't have permissions to use sent account id"],
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('fails if currency is not supported', async () => {
      const signInData = await Helpers.signIn(app);

      return request(app.getHttpServer())
        .post('/investment-transaction/' + action)
        .auth(signInData.accessToken, { type: 'bearer' })
        .send({
          ...validBody,
          accountId: signInData.defaultAccount.getId(),
          money: {
            amount: '100',
            currency: 'usd',
          },
        })
        .expect(400)
        .expect({
          message: [
            'money.currency must be one of the following values: ' +
              Object.values(AvailableCurrencies).join(', '),
          ],
          error: 'Bad Request',
          statusCode: 400,
        });
    });
  });

  it('buys ', async () => {
    const signInData = await Helpers.signIn(app);

    await request(app.getHttpServer())
      .post('/investment-transaction/buy')
      .auth(signInData.accessToken, { type: 'bearer' })
      .send({
        ...validBody,
        accountId: signInData.defaultAccount.getId(),
      })
      .expect(201);

    const createdTransaction = await buyInvestmentTransactionRepository.findOne(
      {
        order: { createdAt: 'DESC' },
        where: {},
      },
    );

    expect(await createdTransaction.account).toStrictEqual(
      signInData.defaultAccount,
    );
    expect(createdTransaction).toBeInstanceOf(BuyInvestmentTransaction);
  });

  it('sells', async () => {
    const signInData = await Helpers.signIn(app);

    //Buy before sell
    await Helpers.buyTransaction(
      app,
      signInData.accessToken,
      signInData.defaultAccount.getId(),
      validBody.code,
      1000,
      '1000',
      AvailableCurrencies.USD_MEP,
    );

    await request(app.getHttpServer())
      .post('/investment-transaction/sell')
      .auth(signInData.accessToken, { type: 'bearer' })
      .send({
        ...validBody,
        accountId: signInData.defaultAccount.getId(),
      })
      .expect(201);

    const createdTransaction =
      await sellInvestmentTransactionRepository.findOne({
        order: { createdAt: 'DESC' },
        where: {},
      });

    expect(await createdTransaction.account).toStrictEqual(
      signInData.defaultAccount,
    );
    expect(createdTransaction).toBeInstanceOf(SellInvestmentTransaction);
  });

  it('fails if is trying to sell something that does not have', async () => {
    const signInDataA = await Helpers.signIn(app);

    const signInDataB = await Helpers.signIn(app, {
      email: 'test@mail.com',
      password: 'password',
      defaultAccountName: 'Some name',
    });

    //Another account buy same
    await Helpers.buyTransaction(
      app,
      signInDataB.accessToken,
      signInDataB.defaultAccount.getId(),
      validBody.code,
      1000,
      '1000',
      AvailableCurrencies.USD_MEP,
    );

    //Try to sell
    return request(app.getHttpServer())
      .post('/investment-transaction/sell')
      .auth(signInDataA.accessToken, { type: 'bearer' })
      .send({
        ...validBody,
        accountId: signInDataA.defaultAccount.getId(),
        money: {
          amount: '100',
          currency: AvailableCurrencies.USD_MEP,
        },
      })
      .expect(400)
      .expect({
        message: [
          'Insufficient quantity for sale. Please check your portfolio and enter a valid quantity.',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
  });
});
