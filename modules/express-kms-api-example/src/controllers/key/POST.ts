import { NextFunction, Request, Response } from 'express';
import db from '../../db';
import { ZodPostKeySchema } from './schemas';

export function POST(req: Request, res: Response, next: NextFunction) {
  try {
    ZodPostKeySchema.parse(req.body);
  } catch (e) {
    res.status(400);
    res.send({ message: 'Invalid data provided from client' });
  }

  const { prv, pub, coin, source, type } = req.body;

  // TODO:
  // check duplicated using the prv/pub key?
  // exploitable if we show an error?
  const keyObject = db.query('SELECT * from PRIVATE_KEYS WHERE prv = ? AND pub = ?', [prv, pub]);

  // priv + pub should be unique so we raise an error
  if (keyObject) {
    res.status(409); // It could be also 403 but 409 is specific for dupplicates.
    // TODO: I could return the prv and pub in the error but seems exploitable as hell
    res.send({ message: `Error: Duplicated Key` });
    return;
  }

  // From what i got on the TDD, as store you mean create a new entry right?
  // not sure about the note that says "for MPC pub would be the commonKeyChain
  // does "pub" comes empty at some point?
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
