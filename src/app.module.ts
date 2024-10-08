import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MarketDataModule } from './MarketData/MarketDataModule';
import { SharedModule } from './Shared/SharedModule';
import { AuthModule } from './Auth/AuthModule';
import { UsersModule } from './Users/UsersModule';
import { typeOrmAsyncConfig } from './Shared/Database/TypeORMConfig';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from './Account/AccountModule';
import { InvestmentTransactionModule } from './InvestmentTransaction/InvestmentTransactionModule';
import { BalanceModule } from './Balance/BalanceModule';

@Module({
  imports: [
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      isGlobal: true,
    }),
    MarketDataModule,
    SharedModule,
    AuthModule,
    UsersModule,
    AccountModule,
    InvestmentTransactionModule,
    BalanceModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
