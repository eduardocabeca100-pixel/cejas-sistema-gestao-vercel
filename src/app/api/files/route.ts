import { NextResponse } from "next/server";
import { getServerFiles } from "@/lib/server/data";
export async function GET() { return NextResponse.json(await getServerFiles()); }
