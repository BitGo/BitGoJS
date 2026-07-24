import { Request, Response, NextFunction } from 'express';
import express = require('express');
const app = express();
const { createProxyMiddleware } = require('http-proxy-middleware');

// This *must* match the environment you are using in the create-wallet script
const bitgoApi = 'https://app.bitgo-test.com';
// TODO: replace with your access token
const secretAccessToken = 'yourAccessToken';

app.all('*', function (req: Request, res: Response, next: NextFunction) {
  console.log(`received: ${req.method} ${req.url} ${JSON.stringify(req.body)}`);
  console.log(`headers: ${JSON.stringify(req.headers)}`);
  req.headers.authorization = `Bearer ${secretAccessToken}`;
  console.log(`new headers: ${JSON.stringify(req.headers)}`);
  next();
});

app.use(
  '/',
  createProxyMiddleware({
    target: bitgoApi,
    changeOrigin: true,
  })
);
const port = 3000;
app.listen(port, function () {
  console.log(`Proxy POC listening at http://localhost:${port}`);
});
