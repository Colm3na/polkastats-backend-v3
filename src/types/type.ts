export interface IModule {
  enabled: boolean,
  module: string,
  config?: {
    [key:string]: string | number | number[] | any
  }
}

export interface IConfig {
  substrateNetwork: string,
  wsProviderUrl: string,
  crawlers: Array<IModule>,
  postgresConnParams: {
    [key:string]: string | number | number[] | any
  }  
}

export interface ILoggerOptions {
  crawler: string,
  [key:string]: string | number | number[] | any
}