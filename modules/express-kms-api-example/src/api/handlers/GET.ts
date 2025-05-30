import { NextFunction, Request, Response } from 'express';
import db from '../../db';

type GetParamsType = {
  pub: string;
};

/**
 * @openapi
 * /key/{pub}:
 *   get:
 *     summary: Retrieve a private key stored
 *     tags:
 *       - key management service
 *     parameters:
 *       - in: path
 *         name: pub
 *         required: true
 *         schema:
 *           type: string
 *         description: Public key related to the priv key to retrieve
 *       - in: query
 *         name: source
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - user
 *             - backup
 *         description: The kind of key to retrieve
 *     responses:
 *       200:
 *         description: Private key retrieved
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
 *                 prv:
 *                   type: string
 *                 pub:
 *                   type: string
 *                 source:
 *                   type: string
 *                   enum:
 *                    - user
 *                    - backup
 *                 type:
 *                   type: string
 *                   enum:
 *                    - user
 *                    - backup
 *             example:
 *               prv: "MIICXAIBAAKBgH3D4WKfdvhhj9TSGrI0FxAmdfiyfOphuM/kmLMIMKdahZLE5b8YoPL5oIE5NT+157iyQptb7q7qY9nA1jw86Br79FIsi6hLOuAne+1u4jVyJi4PLFAK5gM0c9klGjiunJ+OSH7fX+HQDwykZm20bdEa2fRU4dqT/sRm4Ta1iwAfAgMBAAEC"
 *               pub: "MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgH3D4WKfdvhhj9TSGrI0FxAmdfiyfOphuM/kmLMIMKdahZLE5b8YoPL5oIE5NT+157iyQptb7q7qY9nA1jw86Br79FIsi6hLOuAne+1u4jVyJi4PLFAU4dqT/sRm4Ta1iwAfAgMBAAE="
 *               source: "user"
 *               type: "independent"
 *       404:
 *         description: Private key not found
 *       500:
 *         description: Internal server error
 */
export async function GET(req: Request<GetParamsType>, res: Response, next: NextFunction): Promise<void> {
  //TODO: fix type, it says that the prop doesn't exists
  //      but in fact it's a incorect type declaration
  const userKeyProvider = req.body.userKeyProvider;

  const { pub } = req.params;

  // fetch from DB
  const source = req.query.source;
  const data = await db.fetchOne('SELECT encryptedPrv, kmsKey, type FROM PRIVATE_KEY WHERE pub = ? AND source = ?', [
    pub,
    source,
  ]);

  if (!data) {
    res.status(404);
    res.send({ message: `Not Found` });
    return;
  }

  const { encryptedPrv, kmsKey, type } = data;

  const kmsRes = await userKeyProvider.getKey(kmsKey, encryptedPrv, {});
  if ('code' in kmsRes) {
    res.status(500);
    res.send({ message: 'Internal server error' });
    return;
  }
  const { prv } = kmsRes;

  res.status(200);
  res.json({ prv, pub, source, type });
  next();
}
