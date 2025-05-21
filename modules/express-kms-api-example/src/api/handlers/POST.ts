import { NextFunction, Request, Response } from 'express';
import db from '../../db';
import { KmsErrorRes, KmsInterface, PostKeyKmsRes } from '../../providers/kms-interface/kmsInterface';
import { ZodPostKeySchema } from '../schemas/postKeySchema';

/**
 * @openapi
 * /key:
 *   post:
 *     summary: Store a new private key
 *     tags:
 *       - key management service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prv
 *               - pub
 *               - coin
 *               - source
 *               - type
 *             properties:
 *               prv:
 *                 type: string
 *               pub:
 *                 type: string
 *               coin:
 *                 type: string
 *               source:
 *                 type: string
 *                 enum:
 *                   - user
 *                   - backup
 *               type:
 *                 type: string
 *                 enum:
 *                  - independent
 *                  - mpc
 *     responses:
 *       200:
 *         description: Successfully stored key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - prv
 *                 - pub
 *                 - coin
 *                 - source
 *                 - type
 *               properties:
 *                 keyId:
 *                   type: string
 *                 coin:
 *                   type: string
 *                 source:
 *                   type: string
 *                   enum:
 *                     - user
 *                     - backup
 *                 type:
 *                   type: string
 *                   enum:
 *                     - independent
 *                     - mpc
 *                 pub:
 *                   type: string
 *             example:
 *               keyId: "MIICXAIBAAKBgH3D4WKfdvhhj9TSGrI0FxAmdfiyfOphuM/kmLMIMKdahZLE5b8YoPL5oIE5NT+157iyQptb7q7qY9nA1jw86Br79FIsi6hLOuAne+1u4jVyJi4PLFAK5gM0c9klGjiunJ+OSH7fX+HQDwykZm20bdEa2fRU4dqT/sRm4Ta1iwAfAgMBAAEC"
 *               coin: "sol"
 *               source: "user"
 *               type: "tss"
 *               pub: "MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgH3D4WKfdvhhj9TSGrI0FxAmdfiyfOphuM/kmLMIMKdahZLE5b8YoPL5oIE5NT+157iyQptb7q7qY9nA1jw86Br79FIsi6hLOuAne+1u4jVyJi4PLFAU4dqT/sRm4Ta1iwAfAgMBAAE="
 *       400:
 *         description: Invalid data
 *       409:
 *         description: Duplicate key
 *       500:
 *         description: Internal server error
 */
export async function POST(req: Request, res: Response, next: NextFunction, kms: KmsInterface): Promise<void> {
  // parse request
  try {
    ZodPostKeySchema.parse(req.body);
  } catch (e) {
    res.status(400);
    res.send({ message: 'Invalid data provided from client' });
  }

  const { prv, pub, coin, source, type } = req.body;

  // check for duplicates
  const keyObject = await db.fetchAll('SELECT * from PRIVATE_KEYS WHERE pub = ? AND source = ?', [pub, source]);
  if (keyObject.length != 0) {
    res.status(409);
    res.send({ message: `Error: Duplicated Key for source: ${source} and pub: ${pub}` });
    return;
  }

  // db script to fetch kms key from the database, if any exist
  let kmsKey = await db.fetchOne('SELECT kmsKey from PRIVATE_KEYS WHERE provider = ? LIMIT 1', ['mock'])
  if (!kmsKey) {
    kmsKey = await kms.createKmsKey({}).then((kmsRes) => {
      if ('code' in kmsRes) {
        res.status(kmsRes.code);
        res.send({ message: 'Internal server error. Failed to create top-level kms key in KMS' });
        return;
      }
      return kmsRes.kmsKey;
    })
  }
  
  // send to kms
  const kmsRes: PostKeyKmsRes | KmsErrorRes = await kms.postKey("", prv, {});
  if ('code' in kmsRes) { // TODO: type guard
    res.status(kmsRes.code);
    res.send({ message: 'Internal server error. Failed to encrypt prvaite key in KMS' });
    return;
  }

  // insert into database
  // TODO: better catching
  await db.run('INSERT INTO PRIVATE_KEYS values (?, ?, ?, ?, ?, ?, ?)', [
    pub,
    source,
    kmsRes.encryptedPrv,
    kms.providerName,
    kmsRes.topLevelKeyId,
    coin,
    type,
  ]).catch((err) => {
    res.status(500);
    res.send({ message: 'Internal server error' });
    return;     // TODO: test this
  });

  res.status(200);
  res.json({ coin, source, type, pub });
  next();
}
