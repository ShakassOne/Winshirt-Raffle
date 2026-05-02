import {Session} from '@shopify/shopify-api';

type SessionRecord = {
  id: string;
  shop: string;
  state: string;
  isOnline: boolean;
  scope: string | null;
  expires: Date | null;
  accessToken: string;
  userId: bigint | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  accountOwner: boolean;
  locale: string | null;
  collaborator: boolean | null;
  emailVerified: boolean | null;
};

type SessionDelegate = {
  upsert(args: {where: {id: string}; update: SessionRecord; create: SessionRecord}): Promise<unknown>;
  findUnique(args: {where: {id: string}}): Promise<SessionRecord | null>;
  delete(args: {where: {id: string}}): Promise<unknown>;
  findMany(args: {where: {shop: string}; select: {id: true}}): Promise<Array<{id: string}>>;
  deleteMany(args: {where: {shop: string}}): Promise<unknown>;
};

export class PrismaSessionStorage {
  constructor(private readonly delegate: SessionDelegate) {}

  public async storeSession(session: Session): Promise<boolean> {
    const payload = this.toRecord(session);
    await this.delegate.upsert({where: {id: session.id}, update: payload, create: payload});
    return true;
  }

  public async loadSession(id: string): Promise<Session | undefined> {
    const record = await this.delegate.findUnique({where: {id}});
    return record ? this.toSession(record) : undefined;
  }

  public async deleteSession(id: string): Promise<boolean> {
    await this.delegate.delete({where: {id}});
    return true;
  }

  public async findSessionsByShop(shop: string): Promise<string[]> {
    const sessions = await this.delegate.findMany({where: {shop}, select: {id: true}});
    return sessions.map((session) => session.id);
  }

  public async deleteSessionsByShop(shop: string): Promise<boolean> {
    await this.delegate.deleteMany({where: {shop}});
    return true;
  }

  private toRecord(session: Session): SessionRecord {
    return {
      id: session.id,
      shop: session.shop,
      state: session.state,
      isOnline: session.isOnline,
      scope: session.scope ?? null,
      expires: session.expires ?? null,
      accessToken: session.accessToken ?? '',
      userId: session.onlineAccessInfo?.associated_user?.id ? BigInt(session.onlineAccessInfo.associated_user.id) : null,
      firstName: session.onlineAccessInfo?.associated_user?.first_name ?? null,
      lastName: session.onlineAccessInfo?.associated_user?.last_name ?? null,
      email: session.onlineAccessInfo?.associated_user?.email ?? null,
      accountOwner: session.onlineAccessInfo?.associated_user?.account_owner ?? false,
      locale: session.onlineAccessInfo?.associated_user?.locale ?? null,
      collaborator: session.onlineAccessInfo?.associated_user?.collaborator ?? null,
      emailVerified: session.onlineAccessInfo?.associated_user?.email_verified ?? null
    };
  }

  private toSession(record: SessionRecord): Session {
    const session = new Session({
      id: record.id,
      shop: record.shop,
      state: record.state,
      isOnline: record.isOnline
    });

    session.scope = record.scope ?? undefined;
    session.expires = record.expires ?? undefined;
    session.accessToken = record.accessToken;

    if (record.userId) {
      session.onlineAccessInfo = {
        expires_in: 0,
        associated_user_scope: record.scope ?? '',
        associated_user: {
          id: Number(record.userId),
          first_name: record.firstName ?? '',
          last_name: record.lastName ?? '',
          email: record.email ?? '',
          account_owner: record.accountOwner,
          locale: record.locale ?? '',
          collaborator: record.collaborator ?? false,
          email_verified: record.emailVerified ?? false
        }
      };
    }

    return session;
  }
}
