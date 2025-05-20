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
export async function POST(req: Request, res: Response, next: NextFunction, kms: KmsInterface) {
  // parse request
  try {
    ZodPostKeySchema.parse(req.body);
  } catch (e) {
    res.status(400);
    res.send({ message: 'Invalid data provided from client' });
  }

  const { prv, pub, coin, source, type } = req.body;

  // check for duplicates
  const keyObject = db.query('SELECT * from PRIVATE_KEYS WHERE pub = ? AND source = ?', [prv, pub]);
  if (keyObject) {
    res.status(409);
    res.send({ message: `Error: Duplicated Key for source: ${source} and pub: ${pub}` });
    return;
  }

  // db script to fetch master key from DB if necessary
  const kmsKey = '';

  // send to kms
  const kmsRes: PostKeyKmsRes | KmsErrorRes = await kms.postKey(kmsKey, prv, {});
  if ('code' in kmsRes) {
    // TODO: type guard
    res.status(kmsRes.code);
    res.send({ message: 'Internal server error. Failed to encrypt prvaite key in KMS' });
    return;
  }

  // From what i got on the TDD, as store you mean create a new entry right?
  // not sure about the note that says "for MPC pub would be the commonKeyChain
  // does "pub" comes empty at some point?

  // store into database
  try {
    // TODO: check how to type the queries???
    const data = db.query('INSERT INTO PRIVATE_KEYS(prv, pub, coin, source, type) values (?, ?, ?, ?, ?)', [
      prv,
      pub,
      coin,
      source,
      type,
    ]);
    const { id: keyId } = data;
    res.status(200);
    return res.json({ keyId, coin, source, type, pub });
  } catch (e) {
    res.status(500);
    res.send({ message: 'Internal server error' }); // some unexpected error on DB, needs better login tho
    return;
  }
}
