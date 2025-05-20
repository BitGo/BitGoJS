import bodyParser from 'body-parser';
import express from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { GET as keyGET } from './api/handlers/GET';
import { POST as keyPOST } from './api/handlers/POST';
import { checkApiKeyMiddleware } from './middlewares/authApiKeys';
import { swaggerOptions } from './swagger';

// TODO: move to proper .env
// Add note about the port to the README
// Or hardcode it
const app = express();
const PORT = '3000';

const swaggerSpec = swaggerJSDoc(swaggerOptions);

app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(checkApiKeyMiddleware);

// TODO: create router for keys controllers,
//       I added the controllers calls directly here.
app.post('/key', keyPOST);
app.get('/key/:pub', keyGET);
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.listen(PORT, () => {
  console.log(`KMS API example listening on port ${PORT}`);
});
