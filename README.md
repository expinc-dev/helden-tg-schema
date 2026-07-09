# @helden-inc/tg-schema

**Kontrak data tunggal** untuk seluruh sistem Training Game. Paket ini adalah satu-satunya tempat bentuk data domain didefinisikan, lalu dikonsumsi oleh `tg-runtime` (aplikasi game) dan `tg-cms` (authoring) sebagai paket `@helden-inc/tg-schema`.

Isinya hanya tiga hal: **tipe TypeScript + validator Zod + konstanta `SCHEMA_VERSION`**. Tidak ada UI, tidak ada kode Firebase, tidak ada logika bisnis — cuma *bentuk data* dan *validasinya*.

## Kenapa ada paket ini

Proyek Training Game punya dua repo yang bekerja atas data yang sama:

- **CMS** menulis/menyusun konten game (Firestore, durable).
- **Runtime** menjalankan sesi live (RTDB, low-latency).

Kalau masing-masing repo mendefinisikan sendiri bentuk `Phase`, `PhaseContent`, dll., cepat atau lambat keduanya menyimpang dan proyek membusuk. Paket ini mencegahnya: **ubah bentuk data di sini, kedua repo ikut berubah.** Perubahan divers-ikan lewat `SCHEMA_VERSION`.

## Cara kerja

### 1. Zod sebagai sumber kebenaran, tipe diturunkan darinya

Setiap bentuk data ditulis sekali sebagai skema Zod, lalu tipe TypeScript-nya **diturunkan** dengan `z.infer`. Tipe dan validator tidak mungkin menyimpang karena keduanya berasal dari objek yang sama:

```ts
export const phaseSchema = z.object({
  id: z.string(),
  type: phaseTypeSchema,
  title: z.string(),
  syncMode: syncModeSchema,
  roles: rolesSchema,
  timer: timerConfigSchema.optional(),
  scoring: scoringConfigSchema.optional(),
  content: phaseContentSchema,
})
export type Phase = z.infer<typeof phaseSchema>   // tipe = bentuk skema, otomatis
```

Pemakaian di runtime/cms:

```ts
import { phaseSchema, type Phase, SCHEMA_VERSION } from '@helden-inc/tg-schema'

const phase: Phase = phaseSchema.parse(dataDariFirestore) // lempar error kalau bentuk salah
```

### 2. `Phase` — inti polimorfik

Segala sesuatu yang dirender runtime adalah sebuah `Phase`. Sebuah fase punya `type`, `syncMode` (siapa yang menggerakkan langkah), `roles` (peran mana yang ikut: `player` / `central` / `host`), `timer`, `scoring`, dan sebuah `content`.

`content` bertipe **discriminated union** `PhaseContent`, dibedakan lewat field `type`. Zod-nya memakai `z.discriminatedUnion('type', [...])` sehingga hanya bentuk yang cocok dengan `type`-nya yang lolos validasi. Ada **9 tipe konten**:

| type | Konten |
|------|--------|
| `microlearning` | Materi berlangkah, bisa `sequential` (gated) atau `free` |
| `quiz` | Kuis, mode `on_device` atau `central_prompt` (ala Kahoot) |
| `video` | Video, ditonton bareng di central atau di device |
| `content` | Halaman teks + gambar |
| `codepiece` | Tiap pemain dapat potongan kode |
| `codeinput` | Central mengumpulkan kode gabungan (collaborative lock) |
| `presentation` | Deck slide di layar central |
| `idle` | Layar tunggu (animasi Lottie) |
| `minigame` | Template mini-game yang bisa dipasang (config divalidasi runtime) |

### 3. `Block` — material bersama

`microlearning`, `content`, dan prompt pertanyaan memakai `Block` yang sama (`text` / `image` / `video` / `question`), dan `Question` mencakup 5 tipe (`single_choice`, `multi_choice`, `open_text`, `scale`, `short_answer`). Satu material, dipakai ulang di banyak tempat.

## Struktur

```
src/
├─ version.ts        # SCHEMA_VERSION (semver)
├─ blocks.ts         # Block, Question, Choice + Zod
├─ phase.ts          # Phase, PhaseType, SyncMode, RoleView, HostView, TimerConfig, ScoringConfig
├─ content/          # satu file per PhaseContent (9 tipe)
│  ├─ microlearning.ts  quiz.ts  video.ts  content-page.ts
│  └─ codepiece.ts  codeinput.ts  presentation.ts  idle.ts  minigame.ts
├─ published.ts      # GameDraft (mutable), PublishedGame (immutable bundle)
├─ rtdb.ts           # bentuk node live RTDB (session/presence/live/aggregates/teams)
├─ results.ts        # PlayerResult (durable, Firestore)
└─ index.ts          # re-export semua
```

Firestore = data authoring/durable (draft, arsip, hasil). RTDB = state sesi live (presence, pointer fase, timer, hitung jawaban). Runtime **tidak** membaca konten Firestore saat sesi berjalan — CMS "menerbitkan" `PublishedGame` immutable yang di-*snapshot* runtime. Detail desain lengkap ada di [`../BLUEPRINT_schema.md`](../BLUEPRINT_schema.md).

## SCHEMA_VERSION

```ts
export const SCHEMA_VERSION = '1.1.0'   // src/version.ts
```

`SCHEMA_VERSION` adalah satu angka semver (`MAJOR.MINOR.PATCH`) yang menandai versi kontrak data. Angka ini **di-stamp** ke setiap game yang diterbitkan (`GameDraft.schemaVersion` dan `PublishedGame.schemaVersion` — lihat `src/published.ts`), sehingga setiap bundle membawa jejak "dibangun dengan schema versi berapa".

### Kapan menaikkan versi

Naikkan saat bentuk data berubah, sesuai jenis perubahannya:

| Naikkan | Kapan | Contoh |
|---------|-------|--------|
| **MAJOR** (`1.0.0` → `2.0.0`) | Perubahan **breaking**: hapus/rename field wajib, ubah tipe, atau ubah makna field | `Phase.title` dihapus; `syncMode` ganti nilai enum |
| **MINOR** (`1.0.0` → `1.1.0`) | Tambahan **backward-compatible**: field opsional baru, tipe konten baru | Team Mode (`1.1.0`): `SessionConfig.allowTeams?`, `PlayerPresence.teamId?`, node `Team` baru — semua opsional/aditif |
| **PATCH** (`1.0.0` → `1.0.1`) | Perbaikan yang tak mengubah bentuk | Perketat aturan Zod (mis. `min`) tanpa merombak field |

Aturan praktis: kalau data lama masih lolos `parse` dengan schema baru → MINOR/PATCH. Kalau data lama jadi invalid → MAJOR.

### Cara update

1. Ubah skema Zod di `src/` (satu-satunya tempat bentuk data hidup).
2. Naikkan `SCHEMA_VERSION` di `src/version.ts` sesuai tabel di atas.
3. `npm run build` → `dist/` terbarui.
4. `tg-runtime` & `tg-cms` menarik versi baru (git dependency / `file:` / `npm link`), lalu build ulang. TypeScript langsung menandai kode yang tak lagi cocok dengan bentuk baru — ini fitur, bukan bug: itulah cara satu perubahan schema "menyebar" ke kedua repo.

### Apa yang terjadi saat versi berubah

- **Published game bersifat immutable.** Menerbitkan ulang dari CMS membuat `gameVersionId` **baru** dengan `schemaVersion` baru; bundle lama (beserta sesi yang sedang berjalan di atasnya) tak tersentuh.
- **Kontrak kompatibilitas:** runtime memuat bundle hanya jika **MAJOR** bundle sama dengan MAJOR yang didukung runtime. MINOR/PATCH lebih tinggi tetap boleh dimuat (field opsional baru diabaikan oleh runtime lama). MAJOR beda → tolak, jangan render setengah-setengah.

> Catatan status: field `schemaVersion` dan konstanta `SCHEMA_VERSION` sudah ada dan di-stamp, tapi *guard* penolakan-berdasar-MAJOR di runtime masih rencana desain (lihat `../BLUEPRINT_schema.md §1`), belum di-wire. Saat ini baru dipakai sebagai stamp (mis. `helden-tg-pilot/src/lib/demoBundle.ts`).

### Cara pakai di game & CMS

**CMS (saat publish):** stamp versi ke bundle dari konstanta paket — jangan hardcode string.

```ts
import { SCHEMA_VERSION, publishedGameSchema } from '@helden-inc/tg-schema'

const bundle = publishedGameSchema.parse({
  id: gameVersionId,
  gameId,
  schemaVersion: SCHEMA_VERSION,   // stamp otomatis dari paket
  title, phaseOrder, phases,
  publishedAt, publishedBy,
})
// tulis bundle immutable ke Firestore /publishedGames/{gameVersionId}
```

**Runtime (saat memuat sesi):** validasi bentuk dengan Zod, lalu cek kompatibilitas MAJOR sebelum render.

```ts
import { SCHEMA_VERSION, publishedGameSchema } from '@helden-inc/tg-schema'

const game = publishedGameSchema.parse(bundleDariFirestore) // bentuk dijamin benar

const bundleMajor = game.schemaVersion.split('.')[0]
const runtimeMajor = SCHEMA_VERSION.split('.')[0]
if (bundleMajor !== runtimeMajor) {
  throw new Error(
    `Bundle schema v${game.schemaVersion} tak didukung runtime v${SCHEMA_VERSION}`,
  )
}
// aman untuk dirender
```

Intinya: **CMS yang menstempel, runtime yang memeriksa**, dan keduanya membaca angka dari paket yang sama sehingga tak mungkin beda.

## Build & pakai

```bash
npm run build   # tsc → dist/ berisi .js + .d.ts
npm run check   # tsc --noEmit, cek tipe tanpa emit
```

Dependency: `zod`. Dikonsumsi repo lain lewat git dependency (belum di-publish ke npm):

```jsonc
"@helden-inc/tg-schema": "github:USERNAME/tg-schema#main"
// saat iterasi intensif: "file:../tg-schema" atau `npm link`
```

## Aturan

- Satu-satunya tempat tipe domain didefinisikan. `tg-runtime` & `tg-cms` **dilarang** mendefinisikan ulang `Phase`, `PhaseContent`, dll.
- Tiap tipe punya validator Zod yang sepadan; turunkan tipe dari Zod (`z.infer`) agar tak bisa beda.
- **Jangan** `import 'firebase'` di sini. Jangan taruh default/seed data. Jangan pakai `any`/`Record<string,unknown>` sembarangan (kecuali `MiniGameContent.config`, yang divalidasi Zod milik tiap template di runtime).
