# SEOPress vs Rank Math → Plan phát triển `flexa-seo-aeo`

> Mục tiêu: đối chiếu 2 plugin SEO lớn để rút ra **định vị + lộ trình** cho `flexa-seo-aeo`.
> Trạng thái hiện tại: `flexa-seo-aeo` **greenfield** (thư mục trống, chưa có code) → build from scratch theo **quy ước Flexa lineage**.
> Phiên bản đối chiếu: SEOPress 10.1 · Rank Math 1.0.270.

---

## PHẦN 1 — So sánh SEOPress vs Rank Math

### 1.1 Định vị & triết lý

| Tiêu chí | SEOPress | Rank Math |
|---|---|---|
| Slogan | Privacy-first, white-label, AI-ready | "Best WordPress SEO plugin" — nhồi nhiều tool + AI |
| Cài đặt active | ~350.000+ | ~4.000.000+ |
| Triết lý | Gọn, không upsell trong admin, GDPR-first | Nhiều feature, module-based, đẩy account cloud (Content AI, Analytics cần login) |
| White label | ✅ mặc định, miễn phí | ⚠️ chỉ bản trả phí, giới hạn |
| Phụ thuộc cloud | Thấp (AI dùng API key của bạn) | Cao (Content AI, 30 SEO tests, Analytics đều cần tài khoản RankMath) |
| Kiến trúc code | PSR-4 mới (`src/`) + legacy (`inc/`) | Module-based (`includes/modules/`), custom autoload, CMB2 |

### 1.2 Tính năng FREE — đối chiếu trực tiếp

| Nhóm | SEOPress Free | Rank Math Free |
|---|---|---|
| Meta title/description + variables | ✅ | ✅ |
| Focus keyword | ✅ **unlimited** | ✅ 5 (unlimited qua filter) |
| Content analysis | ✅ | ✅ + 30 SEO tests (cần account) |
| Google preview (SERP) | ✅ mobile+desktop | ✅ |
| Social (OG + Twitter Card) | ✅ + social preview | ✅ |
| Schema / JSON-LD | ⚠️ cơ bản (Knowledge Graph) | ✅ **16+ loại** ngay bản free |
| XML sitemap | ✅ | ✅ |
| HTML sitemap | ✅ | ❌ (chỉ Pro-ish) |
| Redirections | ✅ cấp post | ✅ **Redirection module + 404 monitor** ở free |
| 404 monitor | ❌ (PRO) | ✅ free |
| Image SEO (auto alt/title) | ✅ | ✅ |
| Breadcrumbs | ⚠️ (PRO đầy đủ) | ✅ free |
| Local SEO | ❌ (PRO) | ✅ free (1 location) |
| Instant Indexing (IndexNow/Google API) | ✅ | ✅ |
| Analytics (GA4/Matomo/Clarity) | ✅ | ✅ (GA cần connect account) |
| Role Manager | ❌ | ✅ free |
| Internal linking suggestions | ❌ (PRO) | ✅ free |
| **llms.txt / AI (AEO/GEO)** | ✅ Agent Readiness + llms.txt | ✅ module `llms` |
| Migration (1-click) | ✅ 11 nguồn | ✅ (kể cả từ SEOPress) |
| Module bật/tắt | ✅ | ✅ |
| Command palette (Cmd+K) | ✅ | ❌ |

**Kết luận Free:** Rank Math "hào phóng" hơn ở bản free (Schema 16+, 404, breadcrumbs, local, role manager, internal linking) nhưng **đánh đổi bằng phụ thuộc account cloud**. SEOPress tinh gọn, tự chủ dữ liệu hơn, có Command palette + white label miễn phí.

### 1.3 Tính năng PRO — đối chiếu

| Nhóm | SEOPress PRO | Rank Math PRO |
|---|---|---|
| AI metadata hàng loạt | ✅ OpenAI/Gemini/Claude/Mistral/DeepSeek (API key của bạn) | ✅ Content AI (credits qua RankMath account) |
| AI on autopilot | ✅ khi publish + taxonomy | ✅ |
| Schema editor + auto conditions | ✅ live preview | ✅ + templates |
| Redirect manager (regex, 301–451) | ✅ | ✅ |
| Broken link checker | ✅ CRON batch | ⚠️ (dựa link module) |
| Google Search Console trong post list | ✅ | ✅ (Analytics module) |
| Site Audit | ✅ React + DataViews | ✅ SEO Analysis + tracking |
| WooCommerce SEO | ✅ ProductGroup, GTIN/MPN, Enhanced Ecommerce | ✅ "most advanced" |
| Local SEO multi-store | ✅ | ✅ (Pro multi-location) |
| Video/News sitemap | ✅ | ✅ |
| Rank tracking / backlinks | ✅ (Insights — sản phẩm riêng) | ✅ (Analytics Pro) |
| robots.txt + revision history | ✅ | ✅ (version-control module) |

### 1.4 Kiến trúc — bài học kỹ thuật

| | SEOPress | Rank Math |
|---|---|---|
| Autoload | Composer PSR-4 + fallback | Custom + CMB2 |
| Tổ chức | `src/Actions|Services|Models` (DDD-ish) | `includes/modules/<feature>/` (module runner interface) |
| Settings UI | React (DataViews) cho phần mới | CMB2 + React (Content AI) |
| Frontend output | `src/Actions/Front/{Metas,Schemas}` | `includes/frontend/`, `opengraph/` |
| REST | `src/Actions/Api/*` | `includes/rest/` |
| Điểm hay để học | Tách **Service (logic) ↔ Action (I/O)** rõ ràng | **Module runner + on/off** cực sạch cho bật/tắt feature |

---

## PHẦN 2 — Bài học rút ra cho `flexa-seo-aeo`

1. **Đừng đua feature-parity.** Cả hai đã phủ kín SEO cơ bản. Đối đầu trực diện = thua về độ chín.
2. **Khác biệt hóa bằng AEO/GEO.** Cả 2 mới chỉ *bolt-on* llms.txt. Tên plugin đã là **AEO** (Answer Engine Optimization) → đây là **core value proposition**, không phải add-on.
3. **Học Rank Math về kiến trúc module on/off**, học SEOPress về **tách Service/Action + privacy-first + white label**.
4. **Tự chủ dữ liệu là điểm bán.** Không ép account cloud; AI dùng API key của người dùng (như SEOPress) → hợp "privacy-first" và hợp quy ước Flexa (settings tự chứa).
5. **Nền tảng phải vững trước khi làm feature**: một `Metas` engine + `Settings` schema + REST + React admin đúng chuẩn Flexa unblock mọi thứ.

---

## PHẦN 3 — Định vị đề xuất cho `flexa-seo-aeo`

**Positioning:** *"SEO plugin gọn nhẹ, privacy-first, sinh ra cho kỷ nguyên AI search — AEO/GEO là hạng nhất, không phải phụ kiện."*

**3 trụ khác biệt:**
- **AEO Core**: `llms.txt` đa cấp + Answer-ready content export (markdown/plain), Agent Readiness, schema tối ưu cho AI answer engines (ChatGPT/Claude/Perplexity/Gemini), FAQ/QA schema tự động.
- **SEO nền tảng đủ dùng**: meta, OG/Twitter, canonical/robots, XML/HTML sitemap, breadcrumbs, image SEO — không cần cạnh tranh về số lượng, chỉ cần chắc và nhanh.
- **Flexa DX/UX**: admin React đẹp (design system Flexa), white-label, module on/off, WP-CLI + REST, tự chủ dữ liệu.

**Ranh giới Free/Pro gợi ý:**
- *Free*: meta + sitemap + robots/canonical + OG + llms.txt cơ bản + Agent Readiness + AEO content export.
- *Pro* (`src-pro/`): AI metadata hàng loạt (API key user), schema editor nâng cao cho AEO, multi-language llms.txt, WooCommerce AEO (product schema cho AI shopping), analytics AEO (theo dõi AI referral traffic).

---

## PHẦN 4 — Lộ trình phát triển (phased, core-first, theo quy ước Flexa)

### Substitution vocabulary (khóa cứng, ghi vào MEMORY.md)

| Token | Giá trị |
|---|---|
| `<plugin-slug>` / text-domain | `flexa-seo-aeo` |
| `<Product>` (namespace) | `SeoAeo` → `Flexa\SeoAeo\` → `src/` |
| `<CONST>` | `FLEXA_SEO_AEO` (`_VERSION/_FILE/_PATH/_URL/_BASENAME/_REST_NAMESPACE/_TEXT_DOMAIN`) |
| `<rest-base>` | `flexa-seo-aeo/v1` |
| `<hook-prefix>` | `flexa_seo_aeo/` (slash — cố ý) |
| `<option-prefix>` | `flexa_seo_aeo_` (option chính: `flexa_seo_aeo_settings`) |
| `<js-global>` | `flexaSeoAeo` |
| `<mount-id>` | `flexa-seo-aeo-admin-root` |
| `<tw-prefix>` | `fsa` |
| `<store-key>` | `flexa-seo-aeo:ui` |

> Canonical reference để soi từng file: `flexa-media-folders-pro/` (mature) và `flexa-cache/` (docs/CODE_STYLE_AND_UI.md).

### Phase 0 — Scaffold & nền tảng (unblock mọi thứ)
- [ ] Bootstrap `flexa-seo-aeo.php`: `define()` block `FLEXA_SEO_AEO_*`, PSR-4 (composer + `spl_autoload_register` fallback), ABSPATH guard.
- [ ] `Install\Activator::activate()` → `Migrator::migrate()` (DB_VERSION, `maybe_upgrade` trên `admin_init`) + seed `Support\Settings::defaults()`.
- [ ] `Support\Settings`: schema/defaults/sanitize/merge một option `flexa_seo_aeo_settings`, fire `flexa_seo_aeo/settings/updated`.
- [ ] `Support\Capabilities` + `Rest\RegisterFacade` (đăng ký **mọi** controller) + `Rest\BaseRestController` (permission_callback bắt buộc).
- [ ] `Support\Resetter::reset_all()` dùng chung REST danger-zone + WP-CLI.
- [ ] `docs/CODE_STYLE_AND_UI.md` + `docs/IMPLEMENTATION_PLAN.md` (copy từ flexa-cache, re-substitute).
- [ ] phpstan level 6 clean; `php -l` pass.

### Phase 1 — SEO Metadata Engine (frontend core)
- [ ] `Services\Metas` + `Actions\Front\Metas`: title, meta description, canonical, meta robots (noindex/nofollow…), dynamic variables.
- [ ] Open Graph + Twitter/X Cards output.
- [ ] Universal metabox (Gutenberg trước; page-builder sau) qua REST + React.
- [ ] Import/export settings; migration reader tối thiểu (Yoast/RankMath/SEOPress meta keys).

### Phase 2 — Sitemaps & Indexing
- [ ] XML sitemap (posts, pages, CPT, taxonomies, images) — `Services\Sitemap` + template.
- [ ] HTML sitemap.
- [ ] robots.txt editor + IndexNow/Google Indexing API.

### Phase 3 — AEO Core (điểm khác biệt — ưu tiên cao)
- [ ] `llms.txt` generator (đa cấp, đa ngôn ngữ-ready) + `Actions\Front` route.
- [ ] Agent Readiness toggle + plain-text/markdown content export cho AI crawlers.
- [ ] AEO schema: FAQ/QAPage/HowTo/Article tối ưu answer engines, JSON-LD.
- [ ] (Pro seed) AI metadata generator dùng **API key của user** — Claude/OpenAI/Gemini (mặc định Claude models mới nhất).

### Phase 4 — Admin App (React) & polish
- [ ] Switch sang skill **flexa-plugin-ui**: dashboard, settings, module on/off (học Rank Math), TanStack Query + Zustand, Tailwind `fsa:` prefix, mount `flexa-seo-aeo-admin-root`.
- [ ] Command palette (điểm cộng học từ SEOPress).
- [ ] White-label options.

### Phase 5 — Pro split & release
- [ ] `Flexa\SeoAeoPro\` → `src-pro/` (boot Free rồi Pro; gate qua `flexa_seo_aeo/pro/is_licensed`).
- [ ] WooCommerce AEO (product schema cho AI shopping).
- [ ] Trước release tag: chạy **wp-plugin-review**, regenerate `.pot`, phpcs reconciliation toàn codebase.

### Nguyên tắc bám suốt dự án
- Mọi SQL trong `Domain/*Repository` + `$wpdb->prepare()`.
- Hook slash-separated; không "sửa" thành underscore.
- Controller không add vào `RegisterFacade` = code chết.
- `update_settings` phải sanitize theo schema **và merge lên bản đã lưu** (partial update).
- Pro dựa vào **file absence**, không phải runtime flag.

---

## Tóm tắt 1 dòng
> Rank Math thắng về *độ phủ free* (đổi bằng phụ thuộc cloud), SEOPress thắng về *privacy + kiến trúc sạch*. `flexa-seo-aeo` **không đua feature** — chọn **AEO/GEO làm core**, nền SEO đủ-chắc, DX/UX chuẩn Flexa, tự chủ dữ liệu; build core-first theo 5 phase ở trên.
