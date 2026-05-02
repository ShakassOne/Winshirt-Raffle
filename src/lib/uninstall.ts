type ShopDelegate = {
  updateMany(args: {
    where: {shopDomain: string};
    data: {isInstalled: boolean; uninstalledAt: Date};
  }): Promise<unknown>;
};

type SessionDelegate = {
  deleteMany(args: {where: {shop: string}}): Promise<unknown>;
};

export async function handleAppUninstalled(
  shopDomain: string,
  delegates: {shop: ShopDelegate; session: SessionDelegate}
): Promise<void> {
  const now = new Date();
  await delegates.shop.updateMany({
    where: {shopDomain},
    data: {
      isInstalled: false,
      uninstalledAt: now
    }
  });
  await delegates.session.deleteMany({where: {shop: shopDomain}});
}
