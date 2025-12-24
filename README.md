# 🏪 Ege Takip Sistemi

Toptancı ödemeleri ve gün sonu takip sistemi - Supabase entegrasyonlu Next.js uygulaması.

## 🚀 Kurulum

### 1. Dosyaları çıkart ve bağımlılıkları yükle

```bash
cd ege-takip
npm install
```

### 2. Uygulamayı başlat

```bash
npm run dev
```

Tarayıcıda http://localhost:3000 adresine git.

### 3. Giriş bilgileri

| Kullanıcı | Şifre | Rol |
|-----------|-------|-----|
| aylincapkur | secmarket2026 | User |
| hasanyuksel | hattusa2025 | User |
| vahitcanharanioglu | vahoking1 | Admin |
| husmenyildiz | bosna123 | User |
| hakancanakcioglu | hakanm123 | User |

## 📱 Vercel'e Deploy

### 1. GitHub'a yükle

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/KULLANICI_ADIN/ege-takip.git
git push -u origin main
```

### 2. Vercel'de deploy et

1. https://vercel.com adresine git
2. GitHub ile giriş yap
3. "New Project" tıkla
4. ege-takip repository'sini seç
5. Environment Variables ekle:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://yppijbipptiydjtqxcop.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `.env.local` dosyasındaki key
6. "Deploy" tıkla

## 📊 Supabase Bilgileri

- **URL**: https://yppijbipptiydjtqxcop.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/yppijbipptiydjtqxcop

## 🎯 Özellikler

- ✅ 5 kullanıcı ile giriş sistemi
- ✅ Admin ve normal kullanıcı yetkileri
- ✅ 3 işletme desteği (Restaurant, Hattuşa Seç, Altınkum Seç)
- ✅ Toptancı ödeme takibi
- ✅ Gün sonu raporları
- ✅ Kasa hareketleri (Admin)
- ✅ Günlük özet (Admin)
- ✅ Gider takibi
- ✅ Nakit fark hesaplama
- ✅ Türkçe arayüz
- ✅ Mobil uyumlu tasarım

## 📁 Proje Yapısı

```
ege-takip/
├── app/
│   ├── globals.css      # Tailwind CSS
│   ├── layout.js        # Ana layout
│   └── page.js          # Ana uygulama
├── lib/
│   └── supabase.js      # Supabase client
├── .env.local           # Environment variables
├── package.json
├── tailwind.config.js
└── README.md
```

## 🔒 Güvenlik Notu

Production'da `.env.local` dosyasını `.gitignore`'a ekleyin ve Vercel'de environment variables olarak ayarlayın.
