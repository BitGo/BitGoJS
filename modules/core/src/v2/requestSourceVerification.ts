import { URL } from 'url';

const getRequestSourceError = err => {
  const { response } = err;
  if (!response) {
    return;
  }

  const { body } = response;
  if (!body) {
    return;
  }

  const { code, error } = body;
  if (code !== 401) {
    return;
  }

  if (!error.match(/^request_source/)) {
    return;
  }

  return error;
};

const decodeVerifySourceUrl = (
  urlstring: string,
  { unwrapMandrill = true }: { unwrapMandrill?: boolean } = {}
): { host: string; userId: string; nonce: string } => {
  const u = new URL(urlstring);

  if (u.host === 'mandrillapp.com' && unwrapMandrill) {
    const base64 = u.searchParams.get('p');
    if (!base64) {
      throw new Error(`expected searchParam 'p'`);
    }
    const decode = JSON.parse(Buffer.from(base64, 'base64').toString());
    const decode1 = JSON.parse(decode.p);
    return decodeVerifySourceUrl(decode1.url, { unwrapMandrill: false });
  }

  if (u.host.match(/bitgo.com$/)) {
    if (!u.pathname.match(/verifysource$/)) {
      throw new Error(`invalid url ${urlstring}`);
    }
    const userId = u.searchParams.get('userId');
    const nonce = u.searchParams.get('nonce');
    if (!userId) {
      throw new Error(`expected searchParam 'userId'`);
    }
    if (!nonce) {
      throw new Error(`expected searchParam 'nonce'`);
    }
    return {
      host: u.host,
      userId,
      nonce,
    };
  }

  throw new Error(`unexpected host ${u.host}`);
};

export const isRequestSourceError = err => getRequestSourceError(err) !== undefined;

export const isRequestSourceUnverified = err => getRequestSourceError(err) === 'request_source_unverified';

export const isRequestSourceVerificationPendingError = err =>
  getRequestSourceError(err) === 'request_source_verification_pending';

export const tryVerifyRequestSource = async (bitGo: any, err: Error): Promise<boolean> => {
  const envvar = 'BITGOJS_VERIFY_REQUEST_SOURCE_URL';

  if (!isRequestSourceError(err)) {
    return false;
  }

  if (isRequestSourceUnverified(err)) {
    console.error(
      `Unverified request source. ` +
        `Please check your email inbox, set the envvar ${envvar} to the verification link and try again.`
    );
    return false;
  }

  if (!isRequestSourceVerificationPendingError(err)) {
    console.error(`unknown request source error ${getRequestSourceError(err)}`);
    return false;
  }

  const url = process.env[envvar];
  if (url === undefined) {
    console.error(`Unverified request source. Please set envvar ${envvar} to verification link`);
    return false;
  }

  const { userId, nonce } = decodeVerifySourceUrl(url);
  await bitGo.verifyRequestSource(userId, nonce);
  return true;
};
