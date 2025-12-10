export type BitGoApiArgs = {
  env: 'prod' | 'test' | 'staging';
  accessToken?: string;
  coin: string;
};
