import * as t from 'io-ts';

// codecs for lightning wallet channel backup api

export const ChanPoints = t.strict(
  {
    fundingTxid: t.string,
    outputIndex: t.number,
  },
  'ChanPoints'
);

export type ChanPoints = t.TypeOf<typeof ChanPoints>;

export const BackupResponse = t.strict(
  {
    chanPoints: t.array(ChanPoints),
    multiChanBackup: t.string,
  },
  'BackupResponse'
);

export type BackupResponse = t.TypeOf<typeof BackupResponse>;
