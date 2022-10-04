import * as paillierBigint from 'paillier-bigint';
// import * as bigintCryptoUtils from 'bigint-crypto-utils';
import * as secp from '@noble/secp256k1';
import { randomBytes, createHash, Hash } from 'crypto';
import { hexToBigInt } from '../../../util/crypto';
import { bigIntFromBufferBE, bigIntToBufferBE, bigIntFromU8ABE, getPaillierPublicKey } from '../../util';
import { Secp256k1Curve } from '../../curves';
import Shamir from '../../shamir';
import {
  NShare,
  PShare,
  KeyShare,
  KeyCombined,
  BShare,
  AShare,
  Signature,
  SignConvertRT,
  SignConvert,
  GShare,
  MUShare,
  SignCombine,
  SignCombineRT,
  DShare,
  OShare,
  SShare,
  SignShareRT,
  KShare,
  XShare,
  YShare,
} from './types';

// import createKeccakHash from 'keccak';
// import { convertCombinedSignature } from 'modules/sdk-core/src/bitgo/tss/ecdsa/ecdsa';

// const _1n = BigInt(1);
// const _3n = BigInt(3);

/**
 * ECDSA TSS implementation supporting 2:n Threshold
 */
export default class Ecdsa {
  static curve: Secp256k1Curve = new Secp256k1Curve();
  static shamir: Shamir = new Shamir(Ecdsa.curve);
  /**
   * Generate shares for participant at index and split keys `(threshold,numShares)` ways.
   * @param {number} index participant index
   * @param {number} threshold Signing threshold
   * @param {number} numShares  Number of shares
   * @param {Buffer} seed optional seed to use for key generation
   * @returns {Promise<KeyShare>} Returns the private p-share
   * and n-shares to be distributed to participants at their corresponding index.
   */
  async keyShare(index: number, threshold: number, numShares: number, seed?: Buffer): Promise<KeyShare> {
    if (!(index > 0 && index <= numShares && threshold <= numShares && threshold === 2)) {
      throw 'Invalid KeyShare Config';
    }

    if (seed && seed.length !== 72) {
      throw new Error('Seed must have length 72');
    }
    // Generate additively homomorphic encryption key.
    const { publicKey, privateKey } = await paillierBigint.generateRandomKeys(3072, true);
    const u = (seed && bigIntFromU8ABE(secp.utils.hashToPrivateKey(seed.slice(0, 40)))) ?? Ecdsa.curve.scalarRandom();
    const y = Ecdsa.curve.basePointMult(u);
    const chaincode = seed?.slice(40) ?? randomBytes(32);
    // Compute secret shares of the private key
    const uShares = Ecdsa.shamir.split(u, threshold, numShares);
    const currentParticipant: PShare = {
      i: index,
      l: privateKey.lambda.toString(16),
      m: privateKey.mu.toString(16),
      n: publicKey.n.toString(16),
      y: bigIntToBufferBE(y, 33).toString('hex'),
      u: bigIntToBufferBE(uShares[index], 32).toString('hex'),
      chaincode: chaincode.toString('hex'),
    };
    const keyShare: KeyShare = {
      pShare: currentParticipant,
      nShares: {},
    };

    for (const share in uShares) {
      const participantIndex = parseInt(share, 10);
      if (participantIndex !== index) {
        keyShare.nShares[participantIndex] = {
          i: participantIndex,
          j: currentParticipant['i'],
          n: publicKey.n.toString(16),
          y: bigIntToBufferBE(y, 33).toString('hex'),
          u: bigIntToBufferBE(uShares[participantIndex], 32).toString('hex'),
          chaincode: chaincode.toString('hex'),
        } as NShare;
      }
    }
    return keyShare;
  }

  /**
   * Combine data shared during the key generation protocol.
   * @param {KeyShare} participantShares private p-share and
   * n-shares received from all other participants.
   * @returns {KeyCombined} Returns the participant private x-share
   * and y-shares to be used when generating signing shares.
   */
  keyCombine(pShare: PShare, nShares: NShare[]): KeyCombined {
    const allShares = [pShare, ...nShares];
    // Compute the public key.
    const y = allShares.map((participant) => hexToBigInt(participant['y'])).reduce(Ecdsa.curve.pointAdd);
    // Add secret shares
    const x = allShares.map((participant) => hexToBigInt(participant['u'])).reduce(Ecdsa.curve.scalarAdd);

    // Chaincode will be used in future when we add support for key derivation for ecdsa
    const chaincodes = [pShare, ...nShares].map(({ chaincode }) => bigIntFromBufferBE(Buffer.from(chaincode, 'hex')));
    const chaincode = chaincodes.reduce(
      (acc, chaincode) =>
        (acc + chaincode) % BigInt('0x010000000000000000000000000000000000000000000000000000000000000000') // 2^256
    );

    const participants: KeyCombined = {
      xShare: {
        i: pShare.i,
        l: pShare.l,
        m: pShare.m,
        n: pShare.n,
        y: bigIntToBufferBE(y, 33).toString('hex'),
        x: bigIntToBufferBE(x, 32).toString('hex'),
        chaincode: bigIntToBufferBE(chaincode, 32).toString('hex'),
      },
      yShares: {},
    };

    for (const share in nShares) {
      const participantIndex = nShares[share]['j'];
      participants.yShares[participantIndex] = {
        i: pShare.i,
        j: nShares[share]['j'],
        n: nShares[share]['n'],
      };
    }
    return participants;
  }

  /**
   * Create signing shares.
   * @param {xShare} xShare Private xShare of current participant signer
   * @param {YShare} yShare yShare corresponding to the other participant signer
   * @returns {SignShareRT} Returns the participant private w-share
   * and k-share to be distributed to other participant signer
   */
  signShare(xShare: XShare, yShare: YShare): SignShareRT {
    const pk = getPaillierPublicKey(hexToBigInt(xShare.n));

    const k = BigInt('115643700461675366850946154169507010198203225909652007511838679123938932186030'); // Ecdsa.curve.scalarRandom();
    const gamma = BigInt('89710333414945913119916693126477382199854056448019471467985933895658830338255'); // Ecdsa.curve.scalarRandom();
    // console.log(`k ${k.toString()}, gamma ${gamma.toString()}`);

    const d = Ecdsa.curve.scalarMult(Ecdsa.curve.scalarSub(BigInt(yShare.j), BigInt(xShare.i)), BigInt(xShare.i));

    const w = [
      Ecdsa.curve.scalarMult(BigInt(yShare.j), BigInt(xShare.i)),
      hexToBigInt(xShare['x']),
      Ecdsa.curve.scalarInvert(d),
    ].reduce(Ecdsa.curve.scalarMult);

    const signers: SignShareRT = {
      wShare: {
        i: xShare.i,
        l: xShare.l,
        m: xShare.m,
        n: xShare.n,
        y: xShare.y,
        k: bigIntToBufferBE(k, 32).toString('hex'),
        w: bigIntToBufferBE(w, 32).toString('hex'),
        gamma: bigIntToBufferBE(gamma, 32).toString('hex'),
      },
      kShare: {} as KShare,
    };

    signers.kShare = {
      i: yShare.j,
      j: xShare.i,
      n: pk.n.toString(16),
      k: '3308b2edd8c9d1ae0f05223ed0ab0afd61f6f7b0c122f8e5471f1b99414d50163c43f0bdfa5661a4556728ac410387bbac1144dd256c303a5198a753cc22bc1f9b4a4de5c18a60e370780ebbdd3d1e39170d2f4ab00e26f5f8432bcbb38ffb0de034d109f972c9e3275ab333b251293c79904910265d79fad073290420d0c0223530e65f01987315fcf0eaf2811c19ed7203558dffb1c34635bf94eb473df13b0e6d8cd688a2ca147ed97b9a2ab3ec66ac450308b0a44ab7e7d84f5dfaf44bee6c4f65e4f7048c38a5d5e2fffab60c34f3767df5dd807f9b3883107ebb329adbbfaec5a447005299addd79048d354da4a8f7bb1f9e72be18148b43af1f5cee7b25837fb5746bd3d352983fe02130ca3e923848027c00c699af48759615976b6e98e8eeb870a76064f90ee20bfa4ab6fb4f25fafe7637cfa0a339708030a82a05977089cca82fc673898d19849507f41e44e88135628d6a7aa5e6c2c73d3bd8c5718b3e4739af776c399f3ba2ba583f359c548a151415b38b7e4f1d717eed70079315da14afd279a56effb305a471e7d14b98a82d94517cf18643ba8d759fbaf493cbc485461bfb979d246248fa6d025867577417ea6df5ae78d4cd5143b0edf4ab1a347f7e2c79b059fa67b3503c0631ca77ff83af2afdf77cb287464a629e33d39f170501955df1fcb26fc3b7a8788b860c12b6432ab0ba742722def51b646d10c6142aa14e2eb4643a974d9ed36f47e55693d35fd47dffe4274359951714dad6e6c196337c133d934cc40d9c01dc6e7482bb34f3bc9fd6e372a0c73dfaee3a4e6255e7abc8da94a034a696f8259d131c6cd7d4abfca471549bc22d94c0c2e44516ac30f24a5e324965ededbed20d07b53d39b7a69af183c7234743ba1a67abeb0c1ff461ea257b4f001e9a7b0f17dec3bd203e6e389a0bd4725b89e9615fa19f53c61ba4fafee2e1d9be986cc6223dfd67d33faf8774a313c396da5cb5b6711cbe347a144b05296de1fb598a4578fcca6423afd96d3ec794cf6c839d0bdf5dec0106b106c65425ee7225fab0cbc543d9ef097e646662a99f12b96b4626b771', // bigIntToBufferBE(pk.encrypt(k), 32).toString('hex'),
    };

    return signers;
  }

  /**
   * Perform multiplicitive-to-additive (MtA) share conversion with another
   * signer.
   * @param {SignConvert}
   * @returns {SignConvertRT}
   */
  signConvert(shares: SignConvert): SignConvertRT {
    let shareParticipant: BShare | GShare, shareToBeSend: AShare | MUShare;
    let isGammaShare = false;
    if (shares.xShare && shares.yShare && shares.kShare) {
      const xShare = shares.xShare; // currentParticipant secret xShare
      const yShare = shares.yShare;
      const signShare = this.signShare(xShare, yShare);
      shareToBeSend = { ...shares.kShare, alpha: '', mu: '' } as AShare;
      shareParticipant = { ...signShare.wShare, beta: '', nu: '' } as BShare;
    } else if ((shares.bShare && shares.muShare) || (shares.aShare && shares.wShare)) {
      isGammaShare = true;
      shareToBeSend = shares.aShare ? ({ ...shares.aShare } as MUShare) : ({ ...shares.muShare } as MUShare);
      shareParticipant = shares.wShare ? ({ ...shares.wShare } as GShare) : ({ ...shares.bShare } as GShare);
    } else {
      throw new Error('Invalid config for Sign Convert');
    }
    if (shareParticipant.i !== shareToBeSend.i) {
      throw new Error('Shares from same participant');
    }
    if (shareToBeSend['alpha']) {
      const pk = getPaillierPublicKey(hexToBigInt(shareParticipant.n));
      const sk = new paillierBigint.PrivateKey(
        hexToBigInt(shareParticipant.l as string),
        hexToBigInt(shareParticipant.m as string),
        pk
      );
      const alpha = sk.decrypt(hexToBigInt(shareToBeSend.alpha));
      shareParticipant['alpha'] = bigIntToBufferBE(Ecdsa.curve.scalarReduce(alpha), 32).toString('hex');
      const mu = sk.decrypt(hexToBigInt(shareToBeSend.mu as string)); // recheck encrypted number
      shareParticipant['mu'] = bigIntToBufferBE(Ecdsa.curve.scalarReduce(mu), 32).toString('hex');
      delete shareParticipant['l'];
      delete shareParticipant['m'];
      delete shareToBeSend['alpha'];
      delete shareToBeSend['mu'];
    }
    if (shareToBeSend['k']) {
      const n = hexToBigInt(shareToBeSend['n']); // Paillier pub from other signer
      let pk = getPaillierPublicKey(n);
      const k = hexToBigInt(shareToBeSend['k']);

      const beta0 = BigInt(
        '275272377104216259068749216159356634765893900299628775726629374029053607058370940207118446614277965769931014138950773831654454801951139678336205223629064471613195489868866724197813863514598874757619067659601247483608492831632456928160548180747646487843966644052083304088221405331852294582396412555294058378167459636444700762257413434156191143140100961370210134672071480831212719034114036320893215850649751477854008893659816893024146064269066140446914425253193323218114854738542488173359140777471395422896580055508038064908355359668659094988917274856224392741736780374250274729529694382121582040507685519293234730200203794417505154749345062459283033134806514961503107561390838656910213676178992137207147061337636941765952731382141517682365674156091854474293829871345176514391717709896901347480209944757860244361623128492600934561562812351100881811104665234056490387595534102939448286166843741397788558411283455268832663117460'
      ); // bigintCryptoUtils.randBetween(n / _3n - _1n);
      // console.log(`beta0 ${beta0}`);
      shareParticipant.beta = bigIntToBufferBE(Ecdsa.curve.scalarNegate(Ecdsa.curve.scalarReduce(beta0)), 32).toString(
        'hex'
      );
      const alpha = pk.addition(pk.multiply(k, hexToBigInt(shareParticipant.gamma)), pk.encrypt(beta0));
      // const alpha = pk.addition(pk.multiply(k, hexToBigInt(shareParticipant.gamma)), BigInt('5179058203210012034392444188257399272892318537725065918590418523879618461033746447918693671932748924761240270825990697473704468348878442196473712546734363311898950686977240094286115746263734969198706224731783629039753412604527885895378649439979477537089529887326575898330030741440141018526458181239735737190193352321642015718714897531070283106445684422095774647581814694050899256787213842853122527302130443703686717217605642601181126611156520952393250526854003984583005387892370408228472798751904525188544613608886232972633097284754998001607838383938416021782111615400584289603266799005864625617408591300491959634888568431177663245840328124075530325518311074376489242166150329019941384929525574805763502996086639494445230541379517484956429422625923997139479916847439364984886181747404550316571010136629458850335714320632931263656769658208683955020950259870517520540501341086771950848780948216290975265639507840044577830919363668636783430916579975110529836243010019582126321449778737076102065036680959171122148730755810040056024463389243883291038809721196023275234059337142369273249228531734823518760357002845886471245295104861530772861074908741349058908945778717455056960655236446605427830700238337870279837780901724482357615146652126584340365930751112239680683186845099377820975451414932555921160753059318977777811018455959477453222102453507523490711056798776080028657110087559981830908772337904110894418945835383322503170694629793810957507932672130115280574226353635391324858625250064939197215674706223204916703631712352817855749644917838474628839517969235663757280480703891133806273940818668769690070279878410749738264779810802805966340564104866318015173353134205248621340306722373994050912357222252552661406860590853268485484525246042112931387165388716878326312406730230382661774296838317917753531675064571445986341722037903832217911893648031388'));
      // console.log(`encrypted beta0 ${pk.encrypt(beta0)}`)
      shareToBeSend.alpha = bigIntToBufferBE(alpha, 32).toString('hex');

      const nu0 = BigInt(
        '824226066149645702064230038293810933955973094828518000340755041111927102768983375918540631497527180534719960188421007276689875189682062694575120800911125468598257368966410236996041385568949153576237133732131621349278924650608315749452519252743490758875821415192009986677373692484404960491483370605123566811815380685586020344429253915315316455710106105484629811389831798936024728836584025941628193409711583998955749444972548025927097977944588018694130039569825541819300903602278957995398858271803779759478310645525654333697944035019551852119107010053859331051125679417260838183776717284429876199902954038790175093698014263056831385372338504245051396582838241101025183842471454192806830173903965666112516604543286482422228399270158358803473735740138427208087444467772554967431945754330208764083104692788507359650923485549611479503462714622766473724457953382500448963161617897425189996179475828019061576647267657440380096350752'
      ); // bigintCryptoUtils.randBetween(n / _3n - _1n);
      // console.log(`nu0 ${nu0}`);
      shareParticipant.nu = bigIntToBufferBE(Ecdsa.curve.scalarNegate(Ecdsa.curve.scalarReduce(nu0)), 32).toString(
        'hex'
      );
      // const mu = pk.addition(pk.multiply(k, hexToBigInt(shareParticipant.w)), BigInt('5903940414172703876358286358777485172874817807303868588979192449207067978111807102385672684220907464364111371946602889615059598626925407086522198667314627773554110908329340653727566508949975383837097746381491235328289416033509658406996994557601582295175962273517762338028389982932790981146295511607682151656843613092018173889183879877904812102649459783183069162362552598372980348223378833655052652279848350494874647839033428053225153483093136679559181398609219290233698104192371732183699217329972487381747521047490416489183601330623289672412317611771417298661364985838490462350318950391598612724539907644130881924750191539627059241830641680153478585833973219426996752541340178096346895856390797835148010257352219366252330682685726647765083328627794187439457062647160068105138658988049553144944370499666447456575006356912317689361622474643166976280371159452484106481575952935759951991852163551619775140777337608286344468006879313782880458310059531896998063401966404609628896417458962963713919801967020172653938423117666881233902307569173456075458982848338181587501506856833273635855023211594051033928822842235840079469485721809370757178145627726422071817208888424845368501491233663029425717765488428876338018070753363265415722970980252134882465392818262706342705592552922823141776951602181752771070449496615125363506073932686366619938176295114371171092341831084437012242410258376103689489054028957919721872397723339940242201894592295285632190708858703358824641285311245386366791411867740021394434096760832956824466046406732809807310815361984266228908960970397841130403063833188417355938841200754506043912898999185463896823812830036068894573774735216744050855397996409652831125148552873483780723423761086967957630064614573596409571657768146819941344544562996727884013583355297554373406803905471866618821519667875254295615745891085415394587963295671058'));
      const mu = pk.addition(pk.multiply(k, hexToBigInt(shareParticipant.w)), pk.encrypt(nu0));
      // console.log(`encrypted nu0 ${pk.encrypt(nu0)}`)
      shareToBeSend.mu = bigIntToBufferBE(mu, 32).toString('hex');
      if (shareParticipant['alpha']) {
        delete shareToBeSend['n'];
        delete shareToBeSend['k'];
      } else {
        pk = getPaillierPublicKey(hexToBigInt(shareParticipant.n));
        shareToBeSend['n'] = pk.n.toString(16);
        shareToBeSend['k'] = bigIntToBufferBE(pk.encrypt(hexToBigInt(shareParticipant.k)), 32).toString('hex');
        // shareToBeSend['k'] = bigIntToBufferBE(BigInt('8685668450623044164175720199840905955047525511441601669805354500428876406114661099176705966859299435540356826174500855249581397207448094795932246818482939423783011773327163607508986480119920385665681941698212709893479573874249525451362148254862215576517080938979904576536182756380066143708819358812362446510768630001572885487679764352124454196171242726780122146625378855562492341791774260893520306916290329693334230063925992711062996936625926621614486947721785115698896440264701744544295004103174142162795637115140866917361519083816288099262609731683730458900909967833205612362424766003305384233080823653541753376740752775691570294580628365988188834925058537279570986541213857768051483990304039877068259983032031772026591794407519247252845749671937681662526414326332752921757318929740179046389689933845376706869114341784332324717380693902248088530509965651083065576177431358493774350591816574086135091040485540816624925451350905960532443052490733222503149325330921930356368333684037973607399886107080494834691032824382442465174611713434150999432279881273237537919409523966173115832799168848903322399233918018155767874704517073023605833234274248847255552508347099161462403074859369551129591694458394679259047101814895136013900577958091105987718157705097635850420630138717873440353917090586105184629260130036656103714397677257967703264798615582827904562774216301360433760452420519942210495949256796655267671923465469058000918508612435696891250100089722082098639898432496128700044908000543864020180042313817146885679091958654712493197070100655920576901491441273124915954009412839746432723499607275128387953619537744303486608108640606872684295176908856319249861944895256408879681787220468132683073755909240804591038482168880297752536425672701892506210480678818350553795488941339598214240273472186972704445299398070757972701790208220061907277217349786637'), 32).toString('hex');
        // console.log(`encrypted k ${pk.encrypt(hexToBigInt(shareParticipant.k))}`);
      }
    }
    if (!('alpha' in shareToBeSend) && !('k' in shareToBeSend)) {
      shareToBeSend = {
        i: shareToBeSend['i'],
        j: shareToBeSend['j'],
      };
    }
    [shareToBeSend['i'], shareToBeSend['j']] = [shareToBeSend['j'], shareToBeSend['i']];
    if (isGammaShare) {
      return {
        muShare: shareToBeSend as MUShare,
        gShare: shareParticipant as GShare,
      };
    }
    return {
      aShare: shareToBeSend,
      bShare: shareParticipant as BShare,
    };
  }

  /**
   * Combine gamma shares to get the private omicron / delta shares
   * @param {SignCombine} shares
   * @returns {SignCombineRT}
   */
  signCombine(shares: SignCombine): SignCombineRT {
    const gShare = shares.gShare;
    const S = shares.signIndex;
    const gamma = hexToBigInt(gShare.gamma);
    const alpha = hexToBigInt(gShare.alpha);
    const beta = hexToBigInt(gShare.beta);
    const mu = hexToBigInt(gShare.mu);
    const nu = hexToBigInt(gShare.nu);
    const k = hexToBigInt(gShare.k);
    const w = hexToBigInt(gShare.w);

    const delta = Ecdsa.curve.scalarAdd(Ecdsa.curve.scalarMult(k, gamma), Ecdsa.curve.scalarAdd(alpha, beta));
    const omicron = Ecdsa.curve.scalarAdd(Ecdsa.curve.scalarMult(k, w), Ecdsa.curve.scalarAdd(mu, nu));
    const Gamma = Ecdsa.curve.basePointMult(gamma);

    return {
      oShare: {
        i: gShare.i,
        y: gShare.y,
        k: bigIntToBufferBE(k, 32).toString('hex'),
        omicron: bigIntToBufferBE(omicron, 32).toString('hex'),
        delta: bigIntToBufferBE(delta, 32).toString('hex'),
        Gamma: bigIntToBufferBE(Gamma, 33).toString('hex'),
      },
      dShare: {
        i: S.i,
        j: gShare.i,
        delta: bigIntToBufferBE(delta, 32).toString('hex'),
        Gamma: bigIntToBufferBE(Gamma, 33).toString('hex'),
      },
    };
  }

  /**
   * Sign a message.
   * @param {Buffer} M Message to be signed
   * @param {OShare} oShare private omicron share of current participant
   * @param {DShare} dShare delta share received from the other participant
   * @param {Hash} hash hashing algorithm implementing Node`s standard crypto hash interface
   * @param {boolean} shouldHash if true, we hash the provided buffer before signing
   * @returns {SShare}
   */
  sign(M: Buffer, oShare: OShare, dShare: DShare, hash?: Hash, shouldHash = true): SShare {
    const m = shouldHash ? (hash || createHash('sha256')).update(M).digest() : M;

    const delta = Ecdsa.curve.scalarAdd(hexToBigInt(oShare.delta), hexToBigInt(dShare.delta));

    const R = Ecdsa.curve.pointMultiply(
      Ecdsa.curve.pointAdd(hexToBigInt(oShare.Gamma), hexToBigInt(dShare.Gamma)),
      Ecdsa.curve.scalarInvert(delta)
    );
    const pointR = secp.Point.fromHex(bigIntToBufferBE(R, 32));
    const r = pointR.x;

    const s = Ecdsa.curve.scalarAdd(
      Ecdsa.curve.scalarMult(bigIntFromU8ABE(m), hexToBigInt(oShare.k)),
      Ecdsa.curve.scalarMult(r, hexToBigInt(oShare.omicron))
    );
    return {
      i: oShare.i,
      y: oShare.y,
      R: pointR.toHex(true),
      s: bigIntToBufferBE(s, 32).toString('hex'),
    };
  }

  /**
   * Construct full signature by combining Sign Shares
   * @param {SShare[]} shares
   * @returns {Signature}
   */
  constructSignature(shares: SShare[]): Signature {
    // Every R must match.
    const R = shares[0]['R'];
    const isRMatching = shares.map((share) => share['R'] === R).reduce((a, b) => a && b);
    if (!isRMatching) {
      throw new Error('R value should be consistent across all shares');
    }

    let s = shares.map((share) => hexToBigInt(share['s'])).reduce(Ecdsa.curve.scalarAdd);
    const recid = (R.slice(0, 2) === '03' ? 1 : 0) ^ (s > Ecdsa.curve.order() / BigInt(2) ? 1 : 0);

    // Normalize s.
    s = s > Ecdsa.curve.order() / BigInt(2) ? Ecdsa.curve.order() - s : s;
    return {
      y: shares[0]['y'],
      r: R.slice(2),
      s: bigIntToBufferBE(s, 32).toString('hex'),
      recid: recid,
    };
  }

  /**
   * Verify ecdsa signatures
   * @param {Buffer} message
   * @param {Signature } signature
   * @param {Hash} hash hashing algorithm implementing Node`s standard crypto hash interface
   * @param {boolean} shouldHash if true, we hash the provided buffer before verifying
   * @returns {boolean} True if signature is valid; False otherwise
   */
  verify(message: Buffer, signature: Signature, hash?: Hash, shouldHash = true): boolean {
    const messageToVerify = shouldHash ? (hash || createHash('sha256')).update(message).digest() : message;
    return Ecdsa.curve.verify(
      messageToVerify,
      Buffer.concat([
        Buffer.from([signature['recid']]),
        bigIntToBufferBE(hexToBigInt(signature['r']), 32),
        bigIntToBufferBE(hexToBigInt(signature['s']), 32),
      ]),
      hexToBigInt(signature['y'])
    );
  }
}
