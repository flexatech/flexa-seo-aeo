# Phân tích tính năng plugin SEOPress (wp-seopress)

> Nguồn: `wp-content/plugins/wp-seopress` — Version **10.1**, Requires PHP 7.4, Requires WP 6.5.
> Tác giả: The SEO Guys at SEOPress (Benjamin Denis). License GPLv3.
> Định vị: WordPress SEO plugin all-in-one, **privacy-first**, **white-label**, và **AI-ready** (AEO/GEO). 350.000+ site đang dùng.

---

## 1. Tổng quan định vị sản phẩm

- **All-in-one**: schema, redirect, XML sitemap, Google Search Console, image SEO, breadcrumbs, broken links… gộp trong 1 plugin → ít plugin, ít xung đột.
- **Modular**: bật/tắt từng feature không mất settings.
- **White label mặc định**: thay tên plugin, logo, link, màn hình — dành cho agency/freelancer.
- **Privacy by design / GDPR-friendly**: không tracking, không data footprint, không upsell trong admin.
- **AI-ready**: hỗ trợ AEO (Answer Engine Optimization) và GEO (Generative Engine Optimization) cho ChatGPT, Claude, Perplexity, Gemini.
- **Universal metabox**: hoạt động với mọi page builder (Gutenberg, Elementor, Divi, Bricks, Oxygen, Breakdance, WPBakery, Avada, Kadence, Beaver Builder, WP Fusion).
- **Đa ngôn ngữ**: 27+ ngôn ngữ; tương thích Polylang, WPML, TranslatePress.

---

## 2. Tính năng bản FREE

### 2.1 Metadata & On-page SEO
- **Universal SEO metabox**: chỉnh title, meta description, Open Graph, X (Twitter) Cards, schema, robots, canonical từ bất kỳ editor nào.
- **Titles & meta descriptions** với **dynamic variables** (custom fields, terms, taxonomies).
- **Content analysis** với **unlimited target keywords** (không giới hạn số keyword/post).
- **Google preview** cho Mobile & Desktop (xem trước SERP snippet).
- **Social preview** Facebook & X (Twitter) để tối ưu CTR.
- **Open Graph & X Cards** cho Facebook, LinkedIn, Instagram, Pinterest, WhatsApp, Threads…
- **Custom canonical URLs** và **meta robots** (noindex, nofollow, noimageindex, nosnippet).

### 2.2 Structured Data & AI
- **Google Knowledge Graph**: dữ liệu Organization kèm address & legal fields.
- **llms.txt & Agent Readiness**: publish bản plain-text nội dung + file chuẩn `/llms.txt` để AI hiểu cấu trúc site (AEO/GEO).

### 2.3 Sitemaps
- **XML sitemaps**: posts, pages, CPTs, taxonomies, images, authors.
- **HTML sitemap** phục vụ accessibility & điều hướng.
- **Image XML sitemap** cho Google Images.

### 2.4 Redirect & URL
- **Redirections** ở cấp post / page / CPT.
- **URL clean-up**: bỏ `/category/`, `/product-category/`, `?replytocom`; redirect attachment page về parent hoặc file URL.

### 2.5 Analytics & Tracking
- **Google Analytics 4 & Matomo**: downloads tracking, custom dimensions, IP anonymization, remarketing, demographics, cross-domain, GDPR-friendly.
- **Microsoft Clarity**: heatmaps & session recordings miễn phí.
- **Custom tracking**: chèn code GTM / script vào [HEAD] và [BODY].

### 2.6 Indexing & Image SEO
- **Image SEO**: tự set image title, alt, caption, description.
- **Google Indexing API & IndexNow** (Bing/Yandex) để index tức thì.

### 2.7 Tiện ích & Onboarding
- **Installation wizard**: cấu hình trong vài phút.
- **Command palette (Cmd/Ctrl+K)**: nhảy tới bất kỳ setting nào.
- **Import/export settings** giữa các site; **portable config** (export cấu hình không kèm dữ liệu riêng của site).
- **One-click migration** từ: Yoast, Rank Math, AIOSEO, The SEO Framework, SureRank, Slim SEO, SmartCrawl, Squirrly, SEO Ultimate, WP Meta SEO, Premium SEO Pack, SiteSEO.

---

## 3. Tính năng bản PRO

### 3.1 AI SEO
- **AI metadata**: tự tạo title, description, OG/X tags, image alt text **hàng loạt** qua OpenAI, Google Gemini (Gemini 3 Flash & 3.1 Pro), Anthropic Claude, MistralAI, DeepSeek (V4).
- **AI on autopilot**: tự sinh meta title/description khi publish post — và cho cả **taxonomy terms** (categories, tags).
- **AI under control**: giới hạn tính năng AI theo user role, xem AI credits balance ngay trên dashboard.

### 3.2 Site Audit & Alerts
- **Site Audit** (React + DataViews): recommendation dựa trên GSC, scan history, live progress, one-click fix AI alt text, CSV export; **tab Technical** kiểm tra site-wide cho homepage.
- **SEO alerts**: cảnh báo trước khi regression SEO lên production.

### 3.3 Google Search Console & Keyword
- **Google Search Console**: clicks, impressions, CTR, average position ngay trong post list.
- **Google Suggestions** trong content analysis để tìm long-tail keyword.

### 3.4 Redirect Manager
- Unlimited redirects **301/302/307/410/451**, hỗ trợ **regex**, URL tester modal, categories, import/export CSV & .htaccess.
- **404 monitoring & auto-redirect** kèm email notification.
- **Broken link checker**: quét batch bằng CRON, chạy được trên site lớn.

### 3.5 Schema / Structured Data
- **Schema.org / JSON-LD editor** với **live preview**: Article, LocalBusiness, Service, How-to, FAQ, Course, Recipe, SoftwareApplication, Video, Event, Product, JobPosting, Review, ProfilePage, Custom schema.
- **Automatic schemas** với điều kiện nâng cao (AND/OR, post types, taxonomies).
- **Manual tab**: liệt kê mọi nội dung có schema gán thủ công; dynamic variables được resolve trong custom schema fields.

### 3.6 Breadcrumbs & Local SEO
- **Accessible breadcrumbs**: Schema.org, A11Y-ready, live preview, tùy biến theo CPT/term.
- **Local SEO**: Local Business schema với opening hours, multi-store.

### 3.7 WooCommerce & EDD SEO
- **Product schema** với global identifiers (**GTIN, MPN, brand**).
- **ProductGroup schema** cho variable products; hỗ trợ **sale price** & **merchant return policy**.
- **Enhanced Ecommerce** (GA4): purchases, product views, cart events.
- **OG price & currency** cho social share.
- **Centralized noindex** cho cart/checkout/account/thank-you.
- XML sitemap cho products (kèm image galleries); bỏ generator meta tag Woo/EDD.
- **Easy Digital Downloads** integration.

### 3.8 Sitemaps nâng cao
- **Video XML Sitemap** với auto-discovery YouTube + **Google News sitemap**.

### 3.9 Analytics & Performance
- **Google Analytics dashboard** ngay trong WordPress.
- **PageSpeed Insights & Core Web Vitals** reports.

### 3.10 Kỹ thuật & Nội dung
- **robots.txt & .htaccess editor** (multisite/multidomain-ready) + **robots.txt revision history** (so sánh & restore version).
- **Custom RSS feed** options.
- **Internal linking suggestions**.
- **Multilingual llms.txt** với TranslatePress.
- **Command palette quick actions** cho các action PRO.

---

## 4. SEOPress Insights (sản phẩm tách riêng)

- **Keyword rank tracker**: 52 Google Search locations, theo dõi 50 keyword/site/ngày.
- **Competitor tracking**, **Backlinks** (weekly), **Google Trends**.
- **Lifetime data access**: export CSV/PDF/Excel.
- **Email & Slack alerts**.

---

## 5. Dành cho Developer

- **Hàng trăm hooks** (13+ hook mới ở 9.8).
- **REST API** cho headless/static site.
- **WP-CLI commands** để tự động hóa.
- Tương thích WordPress **multisite** (network-wide settings, robots.txt & .htaccess multidomain).

---

## 6. Cấu trúc code (tham chiếu kỹ thuật)

Plugin dùng cả code cũ (`inc/`) lẫn kiến trúc mới namespaced (`src/`).

| Thư mục | Vai trò |
|---|---|
| `seopress.php` | Bootstrap, định nghĩa constants (`SEOPRESS_VERSION`…) |
| `seopress-functions.php` | Helper functions toàn cục |
| `inc/functions/options-*.php` | Từng nhóm settings (titles-metas, social, redirections, robots-txt, analytics, matomo, clarity, instant-indexing, import-export, user-consent, advanced…) |
| `inc/admin/` | Admin UI: metaboxes, wizard, migrate, page-builders, blocks, admin-bar, promotions |
| `src/Actions/Front/` | Output frontend: `Metas`, `Schemas`, `GoogleAnalytics`, `AMP` |
| `src/Actions/Api/` | REST endpoints: ContentAnalysis, TargetKeywords, Diagnostics, PagePreview, TitleDescriptionMeta, Commands… |
| `src/Actions/{Admin,Ajax,Sitemap,Table,Options,Abilities}` | Xử lý theo domain |
| `src/Services/` | Business logic: `ContentAnalysis`, `JsonSchemaGenerator`, `HTMLSitemap`, `Sitemap`, `Metas`, `Social`, `Settings`, `Repository`, `WordPressData` |
| `src/{Models,Tags,Helpers,Data,JsonSchemas,Compose,Thirds}` | Model, dynamic tags, helper, tích hợp bên thứ ba |
| `templates/` | Template sitemap & json-schemas |
| `wpml-config.xml` | Cấu hình WPML |
| `uninstall.php` | Cleanup khi gỡ plugin |

---

## 7. Điểm nổi bật của bản 10.1 (mới nhất)

- 🤖 AI metadata on autopilot khi publish (post + taxonomy terms) — PRO.
- 🔑 Giới hạn AI theo user role + xem AI credits + DeepSeek V4 — PRO.
- 🩺 Site Audit tab **Technical** — PRO.
- 🕘 robots.txt **revision history** — PRO.
- 🛒 **ProductGroup schema** cho variable products + sale price + return policy — PRO.
- 🗂️ Manual tab cho schema + resolve dynamic variables trong custom schema.
- ⚙️ **Portable settings** (export config không kèm dữ liệu site) + import JSON từ wizard.
- ↪️ Import redirect từ Slim SEO; cải thiện migration Yoast & SureRank.
- ⌨️ Command palette quick actions — PRO.

---

## 8. Nhận xét nhanh (đối chiếu để làm plugin tương tự)

**Free vs PRO — ranh giới chính:**
- Free tập trung **metadata + sitemap cơ bản + analytics + migration + llms.txt**.
- PRO khóa các phần **AI hàng loạt, Schema editor đầy đủ, Redirect manager + 404 + broken link, GSC dashboard, Local/WooCommerce SEO, Site Audit**.

**Điểm khác biệt cạnh tranh:**
- Unlimited target keywords (đối thủ thường giới hạn).
- White-label + privacy-first là USP nhắm agency.
- Đầu tư mạnh vào **AEO/GEO** (llms.txt, Agent Readiness) — xu hướng mới, đáng tham khảo cho `flexa-seo-aeo`.
