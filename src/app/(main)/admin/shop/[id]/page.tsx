import ShopItemForm from "@/components/admin/ShopItemForm";

export default async function EditShopItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shop Management</h1>
        <p className="text-gray-400">Edit shop item</p>
      </div>
      <ShopItemForm shopItemId={id} />
    </div>
  );
}
