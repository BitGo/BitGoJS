/**
 * @prettier
 */
import { AdaToken } from '@bitgo/sdk-coin-ada';
import { AlgoToken } from '@bitgo/sdk-coin-algo';
import { Bcha, Tbcha } from '@bitgo/sdk-coin-bcha';
import { HbarToken } from '@bitgo/sdk-coin-hbar';
import { Near, TNear } from '@bitgo/sdk-coin-near';
import { SolToken } from '@bitgo/sdk-coin-sol';
import { TrxToken } from '@bitgo/sdk-coin-trx';
import { CoinFactory } from '@bitgo/sdk-core';
import { tokens } from '../config';
import {
  Ada,
  Algo,
  Apt,
  AptToken,
  Arbeth,
  ArbethToken,
  Atom,
  AvaxC,
  AvaxCToken,
  AvaxP,
  Baby,
  Bch,
  Bera,
  BeraToken,
  Bld,
  Bsc,
  BscToken,
  Bsv,
  Btc,
  Btg,
  Celo,
  CeloToken,
  Coredao,
  Coreum,
  Cspr,
  Dash,
  Doge,
  Dot,
  Eos,
  EosToken,
  Erc20Token,
  Etc,
  Eth,
  Eth2,
  Ethw,
  EthLikeCoin,
  Flr,
  TethLikeCoin,
  FiatAED,
  FiatEur,
  FiatGBP,
  FiatSGD,
  FiatUsd,
  Gteth,
  Hash,
  Hbar,
  Hteth,
  Icp,
  Injective,
  Islm,
  Lnbtc,
  Ltc,
  Mantra,
  Ofc,
  Oas,
  OfcToken,
  Opeth,
  OpethToken,
  Osmo,
  Polygon,
  PolygonToken,
  Rune,
  Rbtc,
  Sei,
  Sgb,
  Sip10Token,
  Sol,
  StellarToken,
  Stx,
  Sui,
  SuiToken,
  Susd,
  Tao,
  Ton,
  Tada,
  Talgo,
  Tapt,
  Tarbeth,
  Tatom,
  TavaxC,
  TavaxP,
  Tbaby,
  Tbch,
  Tbera,
  Tbld,
  Tbsc,
  Tbsv,
  Tbtc,
  Tbtcsig,
  Tbtc4,
  Tbtcbgsig,
  Tcelo,
  Tcoredao,
  Tcoreum,
  Tcspr,
  Tdash,
  Tdoge,
  Tdot,
  Teos,
  Tetc,
  Teth,
  Teth2,
  Tflr,
  TfiatAED,
  TfiatEur,
  TfiatGBP,
  TfiatSGD,
  TfiatUsd,
  Thash,
  Thbar,
  Tia,
  Ticp,
  Tinjective,
  Tislm,
  Tlnbtc,
  Tltc,
  Tmantra,
  Toas,
  Tosmo,
  Topeth,
  Tpolygon,
  Trbtc,
  Trune,
  Trx,
  Tsgb,
  Tsei,
  Tsol,
  Tstx,
  Tsui,
  Tsusd,
  Twemix,
  Ttao,
  Ttia,
  Tton,
  Ttrx,
  Txlm,
  Txdc,
  Txrp,
  Txtz,
  Tzec,
  Tzeta,
  Tzketh,
  Wemix,
  Xdc,
  Xlm,
  Xrp,
  XrpToken,
  Xtz,
  Zec,
  Zeta,
  Zketh,
  ZkethToken,
} from './coins';

function registerCoinConstructors(globalCoinFactory: CoinFactory): void {
  globalCoinFactory.register('ada', Ada.createInstance);
  globalCoinFactory.register('algo', Algo.createInstance);
  globalCoinFactory.register('apt', Apt.createInstance);
  globalCoinFactory.register('arbeth', Arbeth.createInstance);
  globalCoinFactory.register('atom', Atom.createInstance);
  globalCoinFactory.register('avaxc', AvaxC.createInstance);
  globalCoinFactory.register('avaxp', AvaxP.createInstance);
  globalCoinFactory.register('baby', Baby.createInstance);
  globalCoinFactory.register('bch', Bch.createInstance);
  globalCoinFactory.register('bcha', Bcha.createInstance);
  globalCoinFactory.register('bera', Bera.createInstance);
  globalCoinFactory.register('bld', Bld.createInstance);
  globalCoinFactory.register('bsc', Bsc.createInstance);
  globalCoinFactory.register('bsv', Bsv.createInstance);
  globalCoinFactory.register('btc', Btc.createInstance);
  globalCoinFactory.register('btg', Btg.createInstance);
  globalCoinFactory.register('celo', Celo.createInstance);
  globalCoinFactory.register('coredao', Coredao.createInstance);
  globalCoinFactory.register('coreum', Coreum.createInstance);
  globalCoinFactory.register('cspr', Cspr.createInstance);
  globalCoinFactory.register('dash', Dash.createInstance);
  globalCoinFactory.register('doge', Doge.createInstance);
  globalCoinFactory.register('dot', Dot.createInstance);
  globalCoinFactory.register('eos', Eos.createInstance);
  globalCoinFactory.register('etc', Etc.createInstance);
  globalCoinFactory.register('eth', Eth.createInstance);
  globalCoinFactory.register('eth2', Eth2.createInstance);
  globalCoinFactory.register('ethw', Ethw.createInstance);
  globalCoinFactory.register('baseeth', EthLikeCoin.createInstance);
  globalCoinFactory.register('tbaseeth', TethLikeCoin.createInstance);
  globalCoinFactory.register('fiataed', FiatAED.createInstance);
  globalCoinFactory.register('fiateur', FiatEur.createInstance);
  globalCoinFactory.register('fiatgbp', FiatGBP.createInstance);
  globalCoinFactory.register('fiatsgd', FiatSGD.createInstance);
  globalCoinFactory.register('fiatusd', FiatUsd.createInstance);
  globalCoinFactory.register('flr', Flr.createInstance);
  globalCoinFactory.register('gteth', Gteth.createInstance);
  globalCoinFactory.register('hash', Hash.createInstance);
  globalCoinFactory.register('hbar', Hbar.createInstance);
  globalCoinFactory.register('hteth', Hteth.createInstance);
  globalCoinFactory.register('lnbtc', Lnbtc.createInstance);
  globalCoinFactory.register('ltc', Ltc.createInstance);
  globalCoinFactory.register('mantra', Mantra.createInstance);
  globalCoinFactory.register('icp', Icp.createInstance);
  globalCoinFactory.register('injective', Injective.createInstance);
  globalCoinFactory.register('islm', Islm.createInstance);
  globalCoinFactory.register('near', Near.createInstance);
  globalCoinFactory.register('oas', Oas.createInstance);
  globalCoinFactory.register('ofc', Ofc.createInstance);
  globalCoinFactory.register('opeth', Opeth.createInstance);
  globalCoinFactory.register('osmo', Osmo.createInstance);
  globalCoinFactory.register('polygon', Polygon.createInstance);
  globalCoinFactory.register('rbtc', Rbtc.createInstance);
  globalCoinFactory.register('thorchain:rune', Rune.createInstance);
  globalCoinFactory.register('sei', Sei.createInstance);
  globalCoinFactory.register('sgb', Sgb.createInstance);
  globalCoinFactory.register('sol', Sol.createInstance);
  globalCoinFactory.register('stx', Stx.createInstance);
  globalCoinFactory.register('sui', Sui.createInstance);
  globalCoinFactory.register('susd', Susd.createInstance);
  globalCoinFactory.register('tao', Tao.createInstance);
  globalCoinFactory.register('tia', Tia.createInstance);
  globalCoinFactory.register('ton', Ton.createInstance);
  globalCoinFactory.register('talgo', Talgo.createInstance);
  globalCoinFactory.register('tapt', Tapt.createInstance);
  globalCoinFactory.register('tarbeth', Tarbeth.createInstance);
  globalCoinFactory.register('tada', Tada.createInstance);
  globalCoinFactory.register('tatom', Tatom.createInstance);
  globalCoinFactory.register('tavaxc', TavaxC.createInstance);
  globalCoinFactory.register('tavaxp', TavaxP.createInstance);
  globalCoinFactory.register('tbaby', Tbaby.createInstance);
  globalCoinFactory.register('tbch', Tbch.createInstance);
  globalCoinFactory.register('tbcha', Tbcha.createInstance);
  globalCoinFactory.register('tbera', Tbera.createInstance);
  globalCoinFactory.register('tbld', Tbld.createInstance);
  globalCoinFactory.register('tbsc', Tbsc.createInstance);
  globalCoinFactory.register('tbsv', Tbsv.createInstance);
  globalCoinFactory.register('tbtc', Tbtc.createInstance);
  globalCoinFactory.register('tbtcsig', Tbtcsig.createInstance);
  globalCoinFactory.register('tbtc4', Tbtc4.createInstance);
  globalCoinFactory.register('tbtcbgsig', Tbtcbgsig.createInstance);
  globalCoinFactory.register('tcelo', Tcelo.createInstance);
  globalCoinFactory.register('tcoredao', Tcoredao.createInstance);
  globalCoinFactory.register('tcoreum', Tcoreum.createInstance);
  globalCoinFactory.register('tcspr', Tcspr.createInstance);
  globalCoinFactory.register('tdash', Tdash.createInstance);
  globalCoinFactory.register('tdoge', Tdoge.createInstance);
  globalCoinFactory.register('tdot', Tdot.createInstance);
  globalCoinFactory.register('teos', Teos.createInstance);
  globalCoinFactory.register('tetc', Tetc.createInstance);
  globalCoinFactory.register('teth', Teth.createInstance);
  globalCoinFactory.register('teth2', Teth2.createInstance);
  globalCoinFactory.register('tfiataed', TfiatAED.createInstance);
  globalCoinFactory.register('tfiateur', TfiatEur.createInstance);
  globalCoinFactory.register('tfiatgbp', TfiatGBP.createInstance);
  globalCoinFactory.register('tfiatsgd', TfiatSGD.createInstance);
  globalCoinFactory.register('tfiatusd', TfiatUsd.createInstance);
  globalCoinFactory.register('tflr', Tflr.createInstance);
  globalCoinFactory.register('thash', Thash.createInstance);
  globalCoinFactory.register('thbar', Thbar.createInstance);
  globalCoinFactory.register('ticp', Ticp.createInstance);
  globalCoinFactory.register('tinjective', Tinjective.createInstance);
  globalCoinFactory.register('tislm', Tislm.createInstance);
  globalCoinFactory.register('tlnbtc', Tlnbtc.createInstance);
  globalCoinFactory.register('tltc', Tltc.createInstance);
  globalCoinFactory.register('tmantra', Tmantra.createInstance);
  globalCoinFactory.register('tnear', TNear.createInstance);
  globalCoinFactory.register('toas', Toas.createInstance);
  globalCoinFactory.register('topeth', Topeth.createInstance);
  globalCoinFactory.register('tosmo', Tosmo.createInstance);
  globalCoinFactory.register('tpolygon', Tpolygon.createInstance);
  globalCoinFactory.register('trbtc', Trbtc.createInstance);
  globalCoinFactory.register('tsgb', Tsgb.createInstance);
  globalCoinFactory.register('tthorchain:rune', Trune.createInstance);
  globalCoinFactory.register('trx', Trx.createInstance);
  globalCoinFactory.register('tsei', Tsei.createInstance);
  globalCoinFactory.register('tsol', Tsol.createInstance);
  globalCoinFactory.register('tstx', Tstx.createInstance);
  globalCoinFactory.register('tsui', Tsui.createInstance);
  globalCoinFactory.register('tsusd', Tsusd.createInstance);
  globalCoinFactory.register('ttao', Ttao.createInstance);
  globalCoinFactory.register('ttia', Ttia.createInstance);
  globalCoinFactory.register('tton', Tton.createInstance);
  globalCoinFactory.register('ttrx', Ttrx.createInstance);
  globalCoinFactory.register('txdc', Txdc.createInstance);
  globalCoinFactory.register('txlm', Txlm.createInstance);
  globalCoinFactory.register('txrp', Txrp.createInstance);
  globalCoinFactory.register('txtz', Txtz.createInstance);
  globalCoinFactory.register('tzec', Tzec.createInstance);
  globalCoinFactory.register('tzeta', Tzeta.createInstance);
  globalCoinFactory.register('tzketh', Tzketh.createInstance);
  globalCoinFactory.register('twemix', Twemix.createInstance);
  globalCoinFactory.register('xdc', Xdc.createInstance);
  globalCoinFactory.register('xlm', Xlm.createInstance);
  globalCoinFactory.register('xrp', Xrp.createInstance);
  globalCoinFactory.register('xtz', Xtz.createInstance);
  globalCoinFactory.register('wemix', Wemix.createInstance);
  globalCoinFactory.register('zec', Zec.createInstance);
  globalCoinFactory.register('zeta', Zeta.createInstance);
  globalCoinFactory.register('zketh', Zketh.createInstance);

  Erc20Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    globalCoinFactory.register(name, coinConstructor);
  });

  StellarToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    globalCoinFactory.register(name, coinConstructor);
  });

  for (const ofcToken of [...tokens.bitcoin.ofc.tokens, ...tokens.testnet.ofc.tokens]) {
    const tokenConstructor = OfcToken.createTokenConstructor(ofcToken);
    globalCoinFactory.register(ofcToken.type, tokenConstructor);
  }

  CeloToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    globalCoinFactory.register(name, coinConstructor);
  });

  BscToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    globalCoinFactory.register(name, coinConstructor);
  });

  EosToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    globalCoinFactory.register(name, coinConstructor);
  });

  AlgoToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    globalCoinFactory.register(name, coinConstructor);
  });

  AvaxCToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    globalCoinFactory.register(name, coinConstructor);
  });

  PolygonToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    globalCoinFactory.register(name, coinConstructor);
  });

  ArbethToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    globalCoinFactory.register(name, coinConstructor);
  });

  OpethToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    globalCoinFactory.register(name, coinConstructor);
  });

  ZkethToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    globalCoinFactory.register(name, coinConstructor);
  });

  BeraToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    globalCoinFactory.register(name, coinConstructor);
  });

  SolToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    globalCoinFactory.register(name, coinConstructor);
  });

  HbarToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    globalCoinFactory.register(name, coinConstructor);
  });

  TrxToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    globalCoinFactory.register(name, coinConstructor);
  });

  AdaToken.createTokenConstructors().forEach(({ name, coinConstructor }) =>
    globalCoinFactory.register(name, coinConstructor)
  );

  SuiToken.createTokenConstructors().forEach(({ name, coinConstructor }) =>
    globalCoinFactory.register(name, coinConstructor)
  );

  XrpToken.createTokenConstructors().forEach(({ name, coinConstructor }) =>
    globalCoinFactory.register(name, coinConstructor)
  );

  AptToken.createTokenConstructors().forEach(({ name, coinConstructor }) =>
    globalCoinFactory.register(name, coinConstructor)
  );

  Sip10Token.createTokenConstructors().forEach(({ name, coinConstructor }) =>
    globalCoinFactory.register(name, coinConstructor)
  );
}

const GlobalCoinFactory: CoinFactory = new CoinFactory();

registerCoinConstructors(GlobalCoinFactory);

export default GlobalCoinFactory;
