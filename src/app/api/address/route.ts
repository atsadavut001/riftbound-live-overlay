import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { getDataSource } from "@/lib/db";
import { Address } from "@/lib/entities/Address";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const db = await getDataSource();
    const addressRepo = db.getRepository(Address);
    
    const address = await addressRepo.findOne({
      where: { userId: (session.user as any).id }
    });
    
    return NextResponse.json(address || {});
  } catch (error) {
    console.error("Address GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const body = await req.json();
    const { name, phone, address, province, district, subDistrict, zipCode } = body;
    
    const db = await getDataSource();
    const addressRepo = db.getRepository(Address);
    
    let userAddress = await addressRepo.findOne({
      where: { userId: (session.user as any).id }
    });
    
    if (userAddress) {
      userAddress.name = name;
      userAddress.phone = phone;
      userAddress.address = address;
      userAddress.province = province;
      userAddress.district = district;
      userAddress.subDistrict = subDistrict;
      userAddress.zipCode = zipCode;
      await addressRepo.save(userAddress);
    } else {
      userAddress = addressRepo.create({
        userId: (session.user as any).id,
        name,
        phone,
        address,
        province,
        district,
        subDistrict,
        zipCode
      });
      await addressRepo.save(userAddress);
    }
    
    return NextResponse.json({ success: true, address: userAddress });
  } catch (error) {
    console.error("Address POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
