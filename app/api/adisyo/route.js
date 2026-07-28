// app/api/adisyo/route.js
// Adisyo'dan gün sonu ödeme toplamlarını güvenli şekilde çeken sunucu aracısı.
// API secret tarayıcıya HİÇ gitmez; sadece burada (sunucuda) kullanılır.
//
// Kimlik bilgileri Vercel Environment Variables'tan okunur:
//   ADISYO_API_KEY, ADISYO_API_SECRET, ADISYO_CONSUMER
//
// İstek: GET /api/adisyo?date=2026-07-28
//   date = Türkiye yerel tarihi (YYYY-MM-DD). O günün 00:00–24:00 (TR) aralığı çekilir.
// Cevap: { ok, payments: [{ paymentTypeId, name, amount, isMealCard, isDebit }], totalCount, raw? }

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // saniye — çok sayfalı günlerde beklemeler için

const ADISYO_BASE = 'https://ext.adisyo.com/api/External/v2';

// TR yerel tarihini, Adisyo'nun beklediği UTC "yyyy-MM-dd HH:mm:ss" formatına çevirir.
// TR = UTC+3. O günün başlangıcı TR 00:00 => UTC bir önceki gün 21:00.
function trDayToUtcRange(dateStr) {
  // dateStr: "2026-07-28"
  const [y, m, d] = dateStr.split('-').map(Number);
  // TR 00:00:00 = UTC 21:00:00 (önceki gün)
  const startUtc = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 3 * 3600 * 1000);
  const endUtc = new Date(Date.UTC(y, m - 1, d, 23, 59, 59) - 3 * 3600 * 1000);
  const fmt = (dt) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())} ${p(dt.getUTCHours())}:${p(dt.getUTCMinutes())}:${p(dt.getUTCSeconds())}`;
  };
  return { startStr: fmt(startUtc), endUtc };
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
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ ok: false, error: 'Geçersiz tarih. Format: YYYY-MM-DD' }, { status: 400 });
    }

    const { startStr, endUtc } = trDayToUtcRange(date);

    const headers = {
      'x-api-key': key,
      'x-api-secret': secret,
      'x-api-consumer': consumer,
      'Accept': 'application/json',
    };

    // Ödeme türü bazında toplamları biriktir
    const totals = new Map(); // paymentTypeId -> { paymentTypeId, name, amount, isMealCard, isDebit }
    let page = 1;
    let totalCount = 0;
    let safety = 0; // sonsuz döngü koruması

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // Bir sayfayı çeker; Adisyo limit hatası (601) verirse bekleyip tekrar dener.
    async function fetchPageWithRetry(pageNo) {
      const url = `${ADISYO_BASE}/CompletedOrders?page=${pageNo}&startDate=${encodeURIComponent(startStr)}&includeCancelled=false`;
      let attempt = 0;
      while (attempt < 5) {
        attempt++;
        const res = await fetch(url, { headers, cache: 'no-store' });
        // HTTP başarılıysa gövdeyi oku
        let data = null;
        try { data = await res.json(); } catch { data = null; }

        // Adisyo limit aşımı: status 601 (HTTP 400 gövdesinde de gelebiliyor)
        const isRateLimited = (data && data.status === 601) || res.status === 429;
        if (isRateLimited) {
          // artan bekleme: 2sn, 4sn, 6sn, 8sn
          await sleep(2000 * attempt);
          continue;
        }

        if (!res.ok) {
          const text = data ? JSON.stringify(data).slice(0, 200) : '';
          throw new Error(`Adisyo isteği başarısız (HTTP ${res.status}). ${text}`);
        }
        if (data && data.status && data.status !== 100) {
          throw new Error(`Adisyo: ${data.message || 'bilinmeyen hata'}`);
        }
        return data;
      }
      // 5 denemeye rağmen limit sürüyorsa
      throw new Error('Adisyo istek limiti aşıldı. Lütfen birkaç dakika sonra tekrar deneyin.');
    }

    while (safety < 60) {
      safety++;
      const data = await fetchPageWithRetry(page);

      const orders = Array.isArray(data.orders) ? data.orders : [];
      totalCount = data.totalCount || orders.length;

      for (const order of orders) {
        const ins = order.insertDate ? new Date(order.insertDate + 'Z') : null;
        if (ins && ins > endUtc) continue;

        const pays = Array.isArray(order.payments) ? order.payments : [];
        for (const p of pays) {
          const id = p.paymentTypeId ?? p.paymentName ?? 'other';
          const prev = totals.get(id) || {
            paymentTypeId: p.paymentTypeId ?? 0,
            name: p.paymentName || 'Diğer',
            amount: 0,
            isMealCard: !!p.isMealCard,
            isDebit: !!p.isDebit,
          };
          prev.amount += Number(p.amount) || 0;
          totals.set(id, prev);
        }
      }

      const pageCount = data.pageCount || 1;
      if (page >= pageCount) break;
      page++;
      // Sonraki sayfadan önce kısa bekleme — limite takılmayı önler
      await sleep(1200);
    }

    const payments = Array.from(totals.values())
      .map((x) => ({ ...x, amount: Math.round(x.amount * 100) / 100 }))
      .filter((x) => x.amount !== 0)
      .sort((a, b) => b.amount - a.amount);

    return Response.json({ ok: true, date, payments, totalCount });
  } catch (e) {
    return Response.json({ ok: false, error: 'Sunucu hatası: ' + (e?.message || String(e)) }, { status: 500 });
  }
}
