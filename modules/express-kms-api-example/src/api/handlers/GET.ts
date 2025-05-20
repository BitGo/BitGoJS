import { Request, Response } from 'express';
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
export function GET(req: Request<GetParamsType>, res: Response) {
  const { pub } = req.params;
  //TODO: what happens if source comes empty? should we return an error? an empty result?
  const source = req.query.source;
  const data = db.query('SELECT (prv, type) FROM PRIVATE_KEY WHERE pub = ? AND source = ?', [pub, source]);

  // TODO: not sure how to type this
  const { prv, type } = data;

  // TODO: i know that we could chain res.status() with .json but what's the preferred way?
  res.status(200);
  return res.json({ prv, pub, source, type });
}
