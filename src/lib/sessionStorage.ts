import type {SessionStorage} from '@shopify/shopify-api';
import type {Session} from '@shopify/shopify-api';

const store = new Map<string, Session>();

export const inMemorySessionStorage: SessionStorage = {
  async storeSession(session: Session): Promise<boolean> {
    store.set(session.id, session);
    return true;
  },
  async loadSession(id: string): Promise<Session | undefined> {
    return store.get(id);
  },
  async deleteSession(id: string): Promise<boolean> {
    return store.delete(id);
  },
  async deleteSessions(ids: string[]): Promise<boolean> {
    for (const id of ids) store.delete(id);
    return true;
  },
  async findSessionsByShop(shop: string): Promise<Session[]> {
    return Array.from(store.values()).filter((session) => session.shop === shop);
  },
};
