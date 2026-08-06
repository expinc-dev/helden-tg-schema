# CLAUDE.md — @helden-inc/tg-schema

Konteks kerja untuk AI agent di repo **tg-schema**. Instruksional & ringkas. Penjelasan untuk manusia ada di [`../README.md`](../README.md); desain/alasan mendalam di [`../../BLUEPRINT_schema.md`](../../BLUEPRINT_schema.md).

## Apa repo ini

Kontrak data **tunggal** untuk seluruh Training Game: tipe TypeScript + validator Zod + `SCHEMA_VERSION`. Dikonsumsi `tg-runtime` (game) & `tg-cms` (authoring) sebagai paket `@helden-inc/tg-schema`.

**Hanya bentuk data + validasi.** Tidak ada UI, tidak ada kode Firebase, tidak ada logika bisnis.

## Cara schema bekerja (yang wajib dipahami sebelum mengubah)

1. **Zod dulu, tipe menyusul.** Setiap bentuk ditulis sekali sebagai skema Zod, tipenya diturunkan `export type X = z.infer<typeof xSchema>`. **Jangan pernah** menulis `interface`/`type` domain secara manual — nanti tipe & validator bisa menyimpang. Ubah skema Zod → tipe ikut otomatis.
2. **`Phase` adalah inti polimorfik.** `phaseSchema` punya field `content: PhaseContent`, sebuah `z.discriminatedUnion('type', [...])` dari 9 tipe konten di `src/content/*`.
3. **`Block` adalah material bersama** (`src/blocks.ts`), dipakai ulang microlearning, content page, dan prompt `Question`. Perubahan di sini merembet ke banyak tipe konten — hati-hati.
4. **Semua export lewat `src/index.ts`.** Tipe/skema baru harus di-re-export di sana, kalau tidak konsumen tak bisa mengimpornya.

## Struktur

```
src/
├─ version.ts     # SCHEMA_VERSION
├─ blocks.ts      # Block, Question, Choice
├─ phase.ts       # Phase + PhaseContent union + Timer/Scoring/Role config
├─ content/       # 9 file, satu per PhaseContent (microlearning, quiz, video,
│                 #   content-page, codepiece, codeinput, presentation, idle, minigame)
├─ published.ts   # GameDraft (mutable), PublishedGame (immutable bundle)
├─ rtdb.ts        # bentuk node live RTDB
├─ results.ts     # PlayerResult (durable Firestore)
└─ index.ts       # re-export semua
```

## Cara mengubah schema (workflow wajib)

1. Ubah/ tambah skema **Zod** di file `src/` yang relevan. Turunkan tipe dengan `z.infer`.
2. Kalau tipe/skema itu baru, **re-export dari `src/index.ts`**.
3. Kalau menambah `PhaseContent` baru: buat file di `src/content/`, lalu daftarkan skemanya ke `phaseContentSchema` (union di `src/phase.ts`) **dan** tambahkan nilai ke `phaseTypeSchema` enum.
4. **Naikkan `SCHEMA_VERSION`** (lihat bawah).
5. `npm run check` (cek tipe) lalu `npm run build` (emit `dist/`). Keduanya harus lolos.
6. Pastikan contoh di `src/__examples__/` masih lolos `phaseSchema.parse(...)`; tambah contoh untuk bentuk baru.

## Cara update versi (SCHEMA_VERSION di `src/version.ts`)

Semver. Aturan praktis: **data lama masih lolos `parse` dengan schema baru → MINOR/PATCH; jadi invalid → MAJOR.**

- **MAJOR** — breaking: hapus/rename field wajib, ubah tipe, ubah makna. (`1.x.x` → `2.0.0`)
- **MINOR** — additive backward-compatible: field opsional baru, `PhaseType` baru. (`1.0.x` → `1.1.0`)
- **PATCH** — perketat/perbaiki aturan Zod tanpa mengubah bentuk. (`1.0.0` → `1.0.1`)

Konsumen: CMS men-*stamp* `SCHEMA_VERSION` ke `PublishedGame` (immutable — publish ulang = `gameVersionId` baru); runtime `parse` bundle lalu cek MAJOR sebelum render. Detail + contoh kode di [README §SCHEMA_VERSION](../README.md).

## Definisi Selesai

- `npm run build` sukses; `dist/` berisi `.js` + `.d.ts`.
- `import { Phase, phaseSchema, SCHEMA_VERSION } from '@helden-inc/tg-schema'` bisa dipakai dari luar.
- Semua contoh fase di `src/__examples__/` lolos `phaseSchema.parse(...)`.
- `SCHEMA_VERSION` sudah dinaikkan bila bentuk berubah.

## Jangan lakukan

- **Jangan** menulis tipe domain manual — selalu turunkan dari Zod (`z.infer`).
- **Jangan** `import 'firebase'`, taruh UI, atau logika bisnis di sini.
- **Jangan** taruh default/seed data konten (itu urusan runtime/cms).
- **Jangan** pakai `any` / `Record<string,unknown>` sembarangan — kecuali `MiniGameContent.config`, yang sengaja longgar dan divalidasi Zod milik tiap template di runtime.
- **Jangan** biarkan `tg-runtime`/`tg-cms` mendefinisikan ulang bentuk domain. Butuh bentuk baru → ubah di sini.
