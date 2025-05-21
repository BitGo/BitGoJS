import bodyParser from 'body-parser';
import express from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { GET as keyGET } from './api/handlers/GET';
import { POST as keyPOST } from './api/handlers/POST';
import { checkApiKeyMiddleware } from './middlewares/authApiKeys';
import { swaggerOptions } from './swagger';
import { mockKmsProvider } from './providers/mock/mock-kms';
import db from './db';

// TODO: move to proper .env
// Add note about the port to the README
// Or hardcode it
const app = express();
const PORT = '3000';
const kmsInterface = new mockKmsProvider();    // TODO: use a config file to determine the provider, perhaps globally?

const swaggerSpec = swaggerJSDoc(swaggerOptions);

app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(checkApiKeyMiddleware);

// TODO: create router for keys controllers,
//       I added the controllers calls directly here.
app.post('/key', (req, res, next) => keyPOST(req, res, next, kmsInterface));
app.get('/key/:pub', (req, res, next) => keyGET(req, res, next, kmsInterface));
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.listen(PORT, () => {
  db.setup();
  console.log(`KMS API example listening on port ${PORT}`);
});
