"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CardForm from "@/components/admin/CardForm";

export default function EditCardPage() {
  const params = useParams();
  const id = params.id as string;
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCard();
  }, [id]);

  const fetchCard = async () => {
    try {
      // In this setup, we can fetch all and find, or create a GET /api/admin/cards/[id] route.
      // Let's create a GET route or just fetch it.
      const res = await fetch(`/api/admin/cards/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCard(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading card...</div>;
  if (!card) return <div className="p-8 text-center text-red-400">Card not found.</div>;

  return (
    <div className="h-full w-full">
      <CardForm initialData={card} cardId={id} />
    </div>
  );
}
