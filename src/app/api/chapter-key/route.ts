import { NextRequest, NextResponse } from 'next/server';
import { putChapterKey } from '@/lib/server/kv';

export async function POST(request: NextRequest) {
	try {
		const { bookId, chapId, key } = await request.json();
		if (!bookId || !chapId || !key) {
			return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
		}
		await putChapterKey(bookId, chapId, key);
		return NextResponse.json({ ok: true });
	} catch (err) {
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
	}
}