import { Module } from '@nestjs/common';
import { MarketDataService } from './MarketDataService';
import { MarketDataController } from './MarketDataController';
import { EstadisticasBCRAProvider } from './MarketDataProviders/EstadisticasBCRAProvider';
import { HttpModule } from '@nestjs/axios';
import { MarketDataProvider } from './MarketDataProviders/MarketDataProvider';
import ArgentinianCryptoPricesProvider from './MarketDataProviders/ArgentinianCryptoPricesProvider';
import PortfolioPersonalProvider from './MarketDataProviders/PortfolioPersonalProvider';

@Module({
  controllers: [MarketDataController],
  providers: [
    ArgentinianCryptoPricesProvider,
    EstadisticasBCRAProvider,
    PortfolioPersonalProvider,
    {
      provide: MarketDataService,
      useFactory: (...params: MarketDataProvider[]) => {
        return new MarketDataService(params);
      },
      inject: [
        //It is very important this order, because this is how is going to be asked if it can handle the instrument code
        ArgentinianCryptoPricesProvider,
        EstadisticasBCRAProvider,
        PortfolioPersonalProvider,
      ],
    },
  ],
  imports: [HttpModule],
  exports: [MarketDataService],
})
export class MarketDataModule {}
