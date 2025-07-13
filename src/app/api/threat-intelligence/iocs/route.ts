import { database } from '@/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');

    let iocs = await database.getIOCs(limit);

    // Apply filters
    if (type) {
      iocs = iocs.filter(ioc => ioc.type === type);
    }
    if (severity) {
      iocs = iocs.filter(ioc => ioc.severity === severity);
    }

    return NextResponse.json(iocs);
  } catch (error) {
    console.error('Error fetching IOCs:', error);
    return NextResponse.json({ error: 'Failed to fetch IOCs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newIOC = await database.addIOC(body);
    return NextResponse.json(newIOC);
  } catch (error) {
    console.error('Error creating IOC:', error);
    return NextResponse.json({ error: 'Failed to create IOC' }, { status: 500 });
  }
} 