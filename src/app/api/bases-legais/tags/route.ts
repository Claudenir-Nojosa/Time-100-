// app/api/bases-legais/tags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const bases = await db.baseLegal.findMany({
      select: {
        tags: true
      }
    });

    const todasTags = Array.from(
      new Set(bases.flatMap(base => base.tags))
    ).filter(tag => tag);

    return NextResponse.json(todasTags);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao carregar tags' },
      { status: 500 }
    );
  }
}