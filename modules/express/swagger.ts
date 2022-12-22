import * as pjson from './package.json';
import 'dotenv/config';

const swaggerAutogen = require('swagger-autogen')();

const bind = process.env.BITGO_BIND;
const port = process.env.BITGO_PORT;

const host = bind ? `${bind}${port ? `:${port}` : ''}` : 'localhost:3080';

export const swaggerDefinition = {
  info: {
    version: pjson.version,
    title: pjson.name,
    description: pjson.description,
  },
  host,
  basePath: '/',
  schemes: ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
  securityDefinitions: {
    api_key: {
      type: 'apiKey',
      name: 'api_key',
      in: 'header',
    },
  // petstore_auth: {
  //     type: "oauth2",
  //     authorizationUrl: "https://petstore.swagger.io/oauth/authorize",
  //     flow: "implicit",
  //     scopes: {
  //         read_pets: "read your pets",
  //         write_pets: "modify pets in your account"
  //     }
  // }
  },
};

const outputFile = './src/swagger-output.json';
const endpointsFiles = ['./src/clientRoutes.ts'];

swaggerAutogen(outputFile, endpointsFiles, swaggerDefinition).then(() => {
  require('./src/expressApp.ts');
});
