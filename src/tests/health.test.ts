import test from 'node:test';
import assert from 'node:assert/strict';
import express, {Request, Response} from 'express';
import {healthResponse} from '../routes/public/health.js';

const TEST_PORT = 3200;

test('GET /health returns expected payload', async () => {
  const app = express();
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).type('application/json').send(healthResponse());
  });

  const server = app.listen(TEST_PORT);

  const response = await fetch(`http://127.0.0.1:${TEST_PORT}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {ok: true, app: 'winshirt-raffle-shopify-app'});

  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => (error ? reject(error) : resolve()));
  });
});
