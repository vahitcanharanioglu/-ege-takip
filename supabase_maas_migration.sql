-- ============================================================
-- EGE TAKİP SİSTEMİ — MAAŞ MODÜLÜ MIGRATION
-- Supabase SQL Editor'de bir kez çalıştırın.
-- ============================================================

-- 1) Personel tablosu
create table if not exists public.employees (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  base_salary numeric not null default 0,
  start_month int  not null default 6,   -- 6=Haziran
  end_month   int,                        -- null = aktif, değer = çıkış ayı (dahil)
  sort_order  int  not null default 0,
  created_by  uuid references public.users(id),
  created_at  timestamptz not null default now()
);

-- 2) Aylık maaş tahakkuku (sadece base'den FARKLI olan aylar için kayıt tutulur)
create table if not exists public.salary_items (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  year        int  not null,
  month       int  not null,            -- 6..9
  amount      numeric not null default 0,
  created_at  timestamptz not null default now(),
  unique (employee_id, year, month)
);

-- 3) Parçalı ödemeler
create table if not exists public.salary_payments (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  year        int  not null,
  month       int  not null,            -- 6..9
  amount      numeric not null,
  note        text,
  created_by  uuid references public.users(id),
  created_at  timestamptz not null default now()
);

create index if not exists idx_salary_items_emp    on public.salary_items(employee_id, year);
create index if not exists idx_salary_payments_emp on public.salary_payments(employee_id, year);

-- ============================================================
-- 4) BAŞLANGIÇ PERSONEL LİSTESİ (16 kişi, hepsi Haziran'dan itibaren)
--    Tekrar çalıştırmamak için önce kontrol: liste boşsa ekler.
-- ============================================================
insert into public.employees (name, base_salary, start_month, sort_order)
select * from (values
  ('Emre',     70000, 6,  1),
  ('Özgür',    45000, 6,  2),
  ('Ahmet',    70000, 6,  3),
  ('Ali',      70000, 6,  4),
  ('Zeynep',   50000, 6,  5),
  ('Leyla',    40000, 6,  6),
  ('Zafer',    40000, 6,  7),
  ('Tolga',    70000, 6,  8),
  ('Yiğit',    55000, 6,  9),
  ('Hakan',    75000, 6, 10),
  ('Altan',    75000, 6, 11),
  ('Egemen',   60000, 6, 12),
  ('K.Ali',    35000, 6, 13),
  ('Hüsmen',   90000, 6, 14),
  ('Mustafa',  60000, 6, 15),
  ('İsmail',  110000, 6, 16)
) as v(name, base_salary, start_month, sort_order)
where not exists (select 1 from public.employees);

-- ============================================================
-- NOT (RLS): Diğer tablolarınızla aynı erişim modelini kullanın.
-- Maaş verisi yalnızca admin tarafından görülmeli. Uygulama
-- katmanında 'maas' ekranı zaten user.role === 'admin' ile korunuyor.
-- Daha sıkı güvenlik için RLS politikaları ekleyebilirsiniz.
-- ============================================================
