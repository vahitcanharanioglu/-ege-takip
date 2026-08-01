// app/api/adisyo/route.js
// Adisyo'dan TEK SAYFA çeker ve o sayfadaki ödemeleri döndürür.
// Frontend sayfa sayfa çağırır (page=1,2,3...), arada bekler, limite takılmaz.
// API secret tarayıcıya HİÇ gitmez; sadece burada (sunucuda) kullanılır.
//
// İstek: GET /api/adisyo?date=2026-07-28&page=1
// Cevap: { ok, page, pageCount, totalCount, payments, rateLimited }
//   rateLimited=true => bu sayfa limit yedi, frontend bekleyip AYNI sayfayı tekrar istemeli.

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ADISYO_BASE = 'https://ext.adisyo.com/api/External/v2';

function trDayToUtcRange(dateStr) {
  // Adisyo tarihleri Türkiye saatinde yorumluyor (UTC'ye çevirmiyoruz!).
  // startDate'i UTC'ye kaydırmak, bir önceki günün akşam saatlerini de kapsıyordu.
  const startStr = `${dateStr} 00:00:00`;
  // Günün üst sınırı: TR 23:59:59
  const endUtcMs = Date.parse(`${dateStr}T23:59:59+03:00`);
  return { startStr, endUtcMs };
}

export async function GET(request) {
  try {
    const key = process.env.ADISYO_API_KEY;
    const secret = process.env.ADISYO_API_SECRET;
    const consumer = process.env.ADISYO_CONSUMER;

    if (!key || !secret || !consumer) {
      return Response.json(
        { ok: false, error: 'Adisyo API bilgileri sunucuda tanımlı değil (ADISYO_API_KEY / ADISYO_API_SECRET / ADISYO_CONSUMER).' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1', 10);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ ok: false, error: 'Geçersiz tarih. Format: YYYY-MM-DD' }, { status: 400 });
    }

    const { startStr, endUtcMs } = trDayToUtcRange(date);
    const headers = {
      'x-api-key': key,
      'x-api-secret': secret,
      'x-api-consumer': consumer,
      'Accept': 'application/json',
    };

    const url = `${ADISYO_BASE}/CompletedOrders?page=${page}&startDate=${encodeURIComponent(startStr)}&includeCancelled=false`;
    const res = await fetch(url, { headers, cache: 'no-store' });
    let data = null;
    try { data = await res.json(); } catch { data = null; }

    const isRateLimited = (data && data.status === 601) || res.status === 429;
    if (isRateLimited) {
      return Response.json({ ok: true, rateLimited: true, page });
    }

    if (!res.ok) {
      const text = data ? JSON.stringify(data).slice(0, 200) : '';
      return Response.json({ ok: false, error: `Adisyo isteği başarısız (HTTP ${res.status}). ${text}` }, { status: 502 });
    }
    if (data && data.status && data.status !== 100) {
      return Response.json({ ok: false, error: `Adisyo: ${data.message || 'bilinmeyen hata'}` }, { status: 502 });
    }

    const orders = Array.isArray(data.orders) ? data.orders : [];
    const totalCount = data.totalCount || orders.length;
    const pageCount = data.pageCount || 1;

    const totals = {};
    for (const order of orders) {
      // Adisyo sipariş tarihleri Türkiye saatinde gelir (UTC değil!)
      const ins = order.insertDate ? Date.parse(order.insertDate + '+03:00') : null;
      if (ins && ins > endUtcMs) continue;
      const pays = Array.isArray(order.payments) ? order.payments : [];
      for (const p of pays) {
        const id = p.paymentTypeId ?? p.paymentName ?? 'other';
        if (!totals[id]) {
          totals[id] = {
            paymentTypeId: p.paymentTypeId ?? 0,
            name: p.paymentName || 'Diğer',
            amount: 0,
            isMealCard: !!p.isMealCard,
            isDebit: !!p.isDebit,
          };
        }
        totals[id].amount += Number(p.amount) || 0;
      }
    }
    const payments = Object.values(totals).map((x) => ({ ...x, amount: Math.round(x.amount * 100) / 100 }));

    return Response.json({ ok: true, rateLimited: false, page, pageCount, totalCount, payments });
  } catch (e) {
    return Response.json({ ok: false, error: 'Sunucu hatası: ' + (e?.message || String(e)) }, { status: 500 });
  }
}
