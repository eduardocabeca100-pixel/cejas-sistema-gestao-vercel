import { NextResponse } from "next/server";
import { getFinanceEntries } from "@/lib/server/data";
export async function GET() { return NextResponse.json(await getFinanceEntries()); }
