import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { GET as keyGET } from './api/handlers/GET';
import { POST as keyPOST } from './api/handlers/POST';
import db from './db';
import { checkApiKeyMiddleware } from './middlewares/authApiKeys';
import keyProviderMiddleware from './middlewares/keyProvider';
import { swaggerOptions } from './swagger';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = '3000';

const swaggerSpec = swaggerJSDoc(swaggerOptions);
// -- MIDDLEWARES --
app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(checkApiKeyMiddleware);
app.use(keyProviderMiddleware);

app.post('/key', keyPOST);
app.get('/key/:pub', keyGET);
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.listen(PORT, () => {
  db.setup();
  console.log(`KMS API example listening on port ${PORT}`);
});
