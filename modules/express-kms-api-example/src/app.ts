import bodyParser from 'body-parser';
import express from 'express';
import { GET as keyGET } from './controllers/key/GET';
import { POST as keyPOST } from './controllers/key/POST';
import { checkApiKeyMiddleware } from './middlewares/authApiKeys';

// TODO: move to proper .env
// Add note about the port to the README
// Or hardcode it
const PORT = '3000';

const app = express();
app.use(bodyParser.json());
app.use(checkApiKeyMiddleware);

// TODO: create router for keys controllers,
//       I added the controllers calls directly here.
app.post('key', keyPOST);
app.get('/key/:pub', keyGET);

app.listen(PORT, () => {
  console.log(`KMS API example listening on port ${PORT}`);
});
