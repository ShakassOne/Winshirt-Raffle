import test from 'node:test';
import assert from 'node:assert/strict';
import {handleAppUninstalled} from '../lib/uninstall.js';

test('handleAppUninstalled marks shop uninstalled and deletes sessions', async () => {
  let shopUpdated = false;
  let sessionsDeleted = false;

  await handleAppUninstalled('unit-test-shop.myshopify.com', {
    shop: {
      updateMany: async ({where, data}) => {
        assert.equal(where.shopDomain, 'unit-test-shop.myshopify.com');
        assert.equal(data.isInstalled, false);
        assert.equal(data.uninstalledAt instanceof Date, true);
        shopUpdated = true;
      }
    },
    session: {
      deleteMany: async ({where}) => {
        assert.equal(where.shop, 'unit-test-shop.myshopify.com');
        sessionsDeleted = true;
      }
    }
  });

  assert.equal(shopUpdated, true);
  assert.equal(sessionsDeleted, true);
});
