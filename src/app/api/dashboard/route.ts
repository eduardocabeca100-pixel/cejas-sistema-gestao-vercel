import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/server/data";
export async function GET() { return NextResponse.json(await getDashboardSummary()); }
