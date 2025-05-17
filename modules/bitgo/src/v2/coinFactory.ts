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
import { CoinMap, coins, getFormattedTokens } from '@bitgo/statics';
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
  CoredaoToken,
  Coreum,
  Cronos,
  Cspr,
  Dash,
  Doge,
  Dot,
  Eos,
  EosToken,
  Erc20Token,
  Etc,
  Eth,
  Ethw,
  EthLikeCoin,
  Fetch,
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
  Init,
  Injective,
  Islm,
  Lnbtc,
  Ltc,
  Mon,
  Mantra,
  Ofc,
  Oas,
  OfcToken,
  Opeth,
  OpethToken,
  Osmo,
  Polygon,
  PolygonToken,
  Polyx,
  Rune,
  Rbtc,
  Sei,
  Sgb,
  Sip10Token,
  Sol,
  Soneium,
  SoneiumToken,
  StellarToken,
  Stx,
  Stt,
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
  Tcronos,
  Tcspr,
  Tdash,
  Tdoge,
  Tdot,
  Teos,
  Tetc,
  Teth,
  Tfetch,
  Tflr,
  Tmon,
  TfiatAED,
  TfiatEur,
  TfiatGBP,
  TfiatSGD,
  TfiatUsd,
  Thash,
  Thbar,
  Tia,
  Ticp,
  Tinit,
  Tinjective,
  Tislm,
  Tlnbtc,
  Tltc,
  Tmantra,
  Toas,
  Tosmo,
  Topeth,
  Tpolygon,
  Tpolyx,
  Trbtc,
  Trune,
  Trx,
  Tsgb,
  Tsei,
  Tsol,
  Tsoneium,
  Tstx,
  Tstt,
  Tsui,
  Tsusd,
  Twemix,
  Tworld,
  Ttao,
  Ttia,
  Tton,
  Ttrx,
  Tvet,
  Txlm,
  Txdc,
  Txrp,
  Txtz,
  Tzec,
  Tzeta,
  Tzketh,
  Vet,
  Wemix,
  World,
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

export function registerCoinConstructors(coinFactory: CoinFactory, coinMap: CoinMap = coins): void {
  coinFactory.register('ada', Ada.createInstance);
  coinFactory.register('algo', Algo.createInstance);
  coinFactory.register('apt', Apt.createInstance);
  coinFactory.register('arbeth', Arbeth.createInstance);
  coinFactory.register('atom', Atom.createInstance);
  coinFactory.register('avaxc', AvaxC.createInstance);
  coinFactory.register('avaxp', AvaxP.createInstance);
  coinFactory.register('baby', Baby.createInstance);
  coinFactory.register('bch', Bch.createInstance);
  coinFactory.register('bcha', Bcha.createInstance);
  coinFactory.register('bera', Bera.createInstance);
  coinFactory.register('bld', Bld.createInstance);
  coinFactory.register('bsc', Bsc.createInstance);
  coinFactory.register('bsv', Bsv.createInstance);
  coinFactory.register('btc', Btc.createInstance);
  coinFactory.register('btg', Btg.createInstance);
  coinFactory.register('celo', Celo.createInstance);
  coinFactory.register('coredao', Coredao.createInstance);
  coinFactory.register('coreum', Coreum.createInstance);
  coinFactory.register('cronos', Cronos.createInstance);
  coinFactory.register('cspr', Cspr.createInstance);
  coinFactory.register('dash', Dash.createInstance);
  coinFactory.register('doge', Doge.createInstance);
  coinFactory.register('dot', Dot.createInstance);
  coinFactory.register('eos', Eos.createInstance);
  coinFactory.register('etc', Etc.createInstance);
  coinFactory.register('eth', Eth.createInstance);
  coinFactory.register('ethw', Ethw.createInstance);
  coinFactory.register('baseeth', EthLikeCoin.createInstance);
  coinFactory.register('tbaseeth', TethLikeCoin.createInstance);
  coinFactory.register('fiataed', FiatAED.createInstance);
  coinFactory.register('fiateur', FiatEur.createInstance);
  coinFactory.register('fiatgbp', FiatGBP.createInstance);
  coinFactory.register('fiatsgd', FiatSGD.createInstance);
  coinFactory.register('fiatusd', FiatUsd.createInstance);
  coinFactory.register('fetch', Fetch.createInstance);
  coinFactory.register('flr', Flr.createInstance);
  coinFactory.register('gteth', Gteth.createInstance);
  coinFactory.register('hash', Hash.createInstance);
  coinFactory.register('hbar', Hbar.createInstance);
  coinFactory.register('hteth', Hteth.createInstance);
  coinFactory.register('lnbtc', Lnbtc.createInstance);
  coinFactory.register('ltc', Ltc.createInstance);
  coinFactory.register('mon', Mon.createInstance);
  coinFactory.register('mantra', Mantra.createInstance);
  coinFactory.register('icp', Icp.createInstance);
  coinFactory.register('init', Init.createInstance);
  coinFactory.register('injective', Injective.createInstance);
  coinFactory.register('islm', Islm.createInstance);
  coinFactory.register('near', Near.createInstance);
  coinFactory.register('oas', Oas.createInstance);
  coinFactory.register('ofc', Ofc.createInstance);
  coinFactory.register('opeth', Opeth.createInstance);
  coinFactory.register('osmo', Osmo.createInstance);
  coinFactory.register('polygon', Polygon.createInstance);
  coinFactory.register('polyx', Polyx.createInstance);
  coinFactory.register('rbtc', Rbtc.createInstance);
  coinFactory.register('thorchain:rune', Rune.createInstance);
  coinFactory.register('sei', Sei.createInstance);
  coinFactory.register('sgb', Sgb.createInstance);
  coinFactory.register('sol', Sol.createInstance);
  coinFactory.register('soneium', Soneium.createInstance);
  coinFactory.register('stx', Stx.createInstance);
  coinFactory.register('stt', Stt.createInstance);
  coinFactory.register('sui', Sui.createInstance);
  coinFactory.register('susd', Susd.createInstance);
  coinFactory.register('tao', Tao.createInstance);
  coinFactory.register('tia', Tia.createInstance);
  coinFactory.register('ton', Ton.createInstance);
  coinFactory.register('talgo', Talgo.createInstance);
  coinFactory.register('tapt', Tapt.createInstance);
  coinFactory.register('tarbeth', Tarbeth.createInstance);
  coinFactory.register('tada', Tada.createInstance);
  coinFactory.register('tatom', Tatom.createInstance);
  coinFactory.register('tavaxc', TavaxC.createInstance);
  coinFactory.register('tavaxp', TavaxP.createInstance);
  coinFactory.register('tbaby', Tbaby.createInstance);
  coinFactory.register('tbch', Tbch.createInstance);
  coinFactory.register('tbcha', Tbcha.createInstance);
  coinFactory.register('tbera', Tbera.createInstance);
  coinFactory.register('tbld', Tbld.createInstance);
  coinFactory.register('tbsc', Tbsc.createInstance);
  coinFactory.register('tbsv', Tbsv.createInstance);
  coinFactory.register('tbtc', Tbtc.createInstance);
  coinFactory.register('tbtcsig', Tbtcsig.createInstance);
  coinFactory.register('tbtc4', Tbtc4.createInstance);
  coinFactory.register('tbtcbgsig', Tbtcbgsig.createInstance);
  coinFactory.register('tcelo', Tcelo.createInstance);
  coinFactory.register('tcoredao', Tcoredao.createInstance);
  coinFactory.register('tcoreum', Tcoreum.createInstance);
  coinFactory.register('tcronos', Tcronos.createInstance);
  coinFactory.register('tcspr', Tcspr.createInstance);
  coinFactory.register('tdash', Tdash.createInstance);
  coinFactory.register('tdoge', Tdoge.createInstance);
  coinFactory.register('tdot', Tdot.createInstance);
  coinFactory.register('teos', Teos.createInstance);
  coinFactory.register('tetc', Tetc.createInstance);
  coinFactory.register('teth', Teth.createInstance);
  coinFactory.register('tfiataed', TfiatAED.createInstance);
  coinFactory.register('tfiateur', TfiatEur.createInstance);
  coinFactory.register('tfiatgbp', TfiatGBP.createInstance);
  coinFactory.register('tfiatsgd', TfiatSGD.createInstance);
  coinFactory.register('tfiatusd', TfiatUsd.createInstance);
  coinFactory.register('tfetch', Tfetch.createInstance);
  coinFactory.register('tflr', Tflr.createInstance);
  coinFactory.register('tmon', Tmon.createInstance);
  coinFactory.register('thash', Thash.createInstance);
  coinFactory.register('thbar', Thbar.createInstance);
  coinFactory.register('ticp', Ticp.createInstance);
  coinFactory.register('tinit', Tinit.createInstance);
  coinFactory.register('tinjective', Tinjective.createInstance);
  coinFactory.register('tislm', Tislm.createInstance);
  coinFactory.register('tlnbtc', Tlnbtc.createInstance);
  coinFactory.register('tltc', Tltc.createInstance);
  coinFactory.register('tmantra', Tmantra.createInstance);
  coinFactory.register('tnear', TNear.createInstance);
  coinFactory.register('toas', Toas.createInstance);
  coinFactory.register('topeth', Topeth.createInstance);
  coinFactory.register('tosmo', Tosmo.createInstance);
  coinFactory.register('tpolygon', Tpolygon.createInstance);
  coinFactory.register('tpolyx', Tpolyx.createInstance);
  coinFactory.register('trbtc', Trbtc.createInstance);
  coinFactory.register('tsgb', Tsgb.createInstance);
  coinFactory.register('tthorchain:rune', Trune.createInstance);
  coinFactory.register('trx', Trx.createInstance);
  coinFactory.register('tsei', Tsei.createInstance);
  coinFactory.register('tsol', Tsol.createInstance);
  coinFactory.register('tsoneium', Tsoneium.createInstance);
  coinFactory.register('tstx', Tstx.createInstance);
  coinFactory.register('tstt', Tstt.createInstance);
  coinFactory.register('tsui', Tsui.createInstance);
  coinFactory.register('tsusd', Tsusd.createInstance);
  coinFactory.register('ttao', Ttao.createInstance);
  coinFactory.register('ttia', Ttia.createInstance);
  coinFactory.register('tton', Tton.createInstance);
  coinFactory.register('ttrx', Ttrx.createInstance);
  coinFactory.register('tvet', Tvet.createInstance);
  coinFactory.register('txdc', Txdc.createInstance);
  coinFactory.register('txlm', Txlm.createInstance);
  coinFactory.register('txrp', Txrp.createInstance);
  coinFactory.register('txtz', Txtz.createInstance);
  coinFactory.register('tzec', Tzec.createInstance);
  coinFactory.register('tzeta', Tzeta.createInstance);
  coinFactory.register('tzketh', Tzketh.createInstance);
  coinFactory.register('twemix', Twemix.createInstance);
  coinFactory.register('tworld', Tworld.createInstance);
  coinFactory.register('vet', Vet.createInstance);
  coinFactory.register('xdc', Xdc.createInstance);
  coinFactory.register('xlm', Xlm.createInstance);
  coinFactory.register('xrp', Xrp.createInstance);
  coinFactory.register('xtz', Xtz.createInstance);
  coinFactory.register('wemix', Wemix.createInstance);
  coinFactory.register('world', World.createInstance);
  coinFactory.register('zec', Zec.createInstance);
  coinFactory.register('zeta', Zeta.createInstance);
  coinFactory.register('zketh', Zketh.createInstance);

  const tokens = getFormattedTokens(coinMap);

  Erc20Token.createTokenConstructors([...tokens.bitcoin.eth.tokens, ...tokens.testnet.eth.tokens]).forEach(
    ({ name, coinConstructor }) => {
      coinFactory.register(name, coinConstructor);
    }
  );

  StellarToken.createTokenConstructors([...tokens.bitcoin.xlm.tokens, ...tokens.testnet.xlm.tokens]).forEach(
    ({ name, coinConstructor }) => {
      coinFactory.register(name, coinConstructor);
    }
  );

  for (const ofcToken of [...tokens.bitcoin.ofc.tokens, ...tokens.testnet.ofc.tokens]) {
    const tokenConstructor = OfcToken.createTokenConstructor(ofcToken);
    coinFactory.register(ofcToken.type, tokenConstructor);
  }

  CeloToken.createTokenConstructors([...tokens.bitcoin.celo.tokens, ...tokens.testnet.celo.tokens]).forEach(
    ({ name, coinConstructor }) => {
      coinFactory.register(name, coinConstructor);
    }
  );

  BscToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    coinFactory.register(name, coinConstructor);
  });

  EosToken.createTokenConstructors([...tokens.bitcoin.eos.tokens, ...tokens.testnet.eos.tokens]).forEach(
    ({ name, coinConstructor }) => {
      coinFactory.register(name, coinConstructor);
    }
  );

  AlgoToken.createTokenConstructors([...tokens.bitcoin.algo.tokens, ...tokens.testnet.algo.tokens]).forEach(
    ({ name, coinConstructor }) => {
      coinFactory.register(name, coinConstructor);
    }
  );

  AvaxCToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    coinFactory.register(name, coinConstructor);
  });

  PolygonToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    coinFactory.register(name, coinConstructor);
  });

  SoneiumToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    coinFactory.register(name, coinConstructor);
  });

  ArbethToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    coinFactory.register(name, coinConstructor);
  });

  OpethToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    coinFactory.register(name, coinConstructor);
  });

  ZkethToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    coinFactory.register(name, coinConstructor);
  });

  BeraToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    coinFactory.register(name, coinConstructor);
  });

  CoredaoToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    coinFactory.register(name, coinConstructor);
  });

  SolToken.createTokenConstructors([...tokens.bitcoin.sol.tokens, ...tokens.testnet.sol.tokens]).forEach(
    ({ name, coinConstructor }) => {
      coinFactory.register(name, coinConstructor);
    }
  );

  HbarToken.createTokenConstructors([...tokens.bitcoin.hbar.tokens, ...tokens.testnet.hbar.tokens]).forEach(
    ({ name, coinConstructor }) => {
      coinFactory.register(name, coinConstructor);
    }
  );

  TrxToken.createTokenConstructors([...tokens.bitcoin.trx.tokens, ...tokens.testnet.trx.tokens]).forEach(
    ({ name, coinConstructor }) => {
      coinFactory.register(name, coinConstructor);
    }
  );

  AdaToken.createTokenConstructors([...tokens.bitcoin.ada.tokens, ...tokens.testnet.ada.tokens]).forEach(
    ({ name, coinConstructor }) => coinFactory.register(name, coinConstructor)
  );

  SuiToken.createTokenConstructors([...tokens.bitcoin.sui.tokens, ...tokens.testnet.sui.tokens]).forEach(
    ({ name, coinConstructor }) => coinFactory.register(name, coinConstructor)
  );

  XrpToken.createTokenConstructors([...tokens.bitcoin.xrp.tokens, ...tokens.testnet.xrp.tokens]).forEach(
    ({ name, coinConstructor }) => coinFactory.register(name, coinConstructor)
  );

  AptToken.createTokenConstructors([...tokens.bitcoin.apt.tokens, ...tokens.testnet.apt.tokens]).forEach(
    ({ name, coinConstructor }) => coinFactory.register(name, coinConstructor)
  );

  Sip10Token.createTokenConstructors([...tokens.bitcoin.stx.tokens, ...tokens.testnet.stx.tokens]).forEach(
    ({ name, coinConstructor }) => coinFactory.register(name, coinConstructor)
  );
}

export const GlobalCoinFactory: CoinFactory = new CoinFactory();

registerCoinConstructors(GlobalCoinFactory);
