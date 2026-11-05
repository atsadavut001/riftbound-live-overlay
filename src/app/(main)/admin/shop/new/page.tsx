import ShopItemForm from "@/components/admin/ShopItemForm";

export default async function NewShopItemPage({ searchParams }: { searchParams: Promise<{ cardId?: string }> }) {
  const { cardId } = await searchParams;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shop Management</h1>
        <p className="text-gray-400">Add a new card to the shop</p>
      </div>
      <ShopItemForm initialCardId={cardId} />
    </div>
  );
}
