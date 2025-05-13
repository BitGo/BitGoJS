import { Request, Response } from 'express';
import db from '../../db';

type GetParamsType = {
  pub: string;
};

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
