import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id) {
    return NextResponse.json({ error: "Missing Product ID" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.tcgthailand.com/api/v1/member/products/${id}/stocks?page=1&page_size=50`, {
      method: 'GET',
      headers: {
        'x-api-key': 'b3f1c8d7-7c8e-4a1f-bc89-4fd0d8c216f3'
      },
      next: { revalidate: 3600 } // cache for 1 hour to prevent hitting rate limits
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch from TCG Thailand" }, { status: response.status });
    }

    const data = await response.json();
    
    // Find cheapest price
    const stocks = data?.data?.stocks || [];
    
    if (stocks.length === 0) {
      return NextResponse.json({ price: null, message: "Out of stock" });
    }

    // Sort by price to get the minimum
    // Prices are strings like "5.00"
    const cheapestStock = stocks.reduce((min: any, stock: any) => {
      const stockPrice = parseFloat(stock.price);
      const minPrice = parseFloat(min.price);
      return stockPrice < minPrice ? stock : min;
    }, stocks[0]);

    return NextResponse.json({ 
      price: parseFloat(cheapestStock.price).toFixed(2),
      currency: "THB"
    });

  } catch (error) {
    console.error("TCG Thailand API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
