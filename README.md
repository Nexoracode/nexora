# نکسورا: پنل لایسنس سایت‌های فروخته‌شده

پنل مخصوص مالک برای ثبت سایت هر مشتری، انتخاب قابلیت‌ها بر اساس مبلغ قرارداد و دیدن وضعیت همهٔ سایت‌ها.

## راه‌اندازی

```bash
npm install
cp .env.example .env      # مقادیر را پر کنید
npm run keys:generate     # جفت‌کلید Ed25519 بسازید
npm run db:deploy         # migration
npm run db:seed           # کاتالوگ اولیهٔ قابلیت‌ها (قیمت‌ها صفر شروع می‌شوند)
npm run dev
```

کلید خصوصی (`LICENSE_PRIVATE_KEY`) فقط در `.env` همین پنل می‌ماند. کلید عمومی در `.env` هر سایت مشتری گذاشته می‌شود.

## اتصال سایت مشتری (پروژهٔ tala)

در `.env` سایت مشتری:

```
LICENSE_ENFORCE=true
LICENSE_SERVER_URL=https://<آدرس این پنل>
LICENSE_KEY=<کلیدی که هنگام ثبت سایت نشان داده شد>
LICENSE_PUBLIC_KEY=<خروجی keys:generate>
```

سایت مشتری با cron `GET /api/cron/license-sync` (هدر `Authorization: Bearer $CRON_SECRET`) هر چند ساعت یک‌بار توکن امضاشده می‌گیرد. اگر این پنل در دسترس نباشد، آخرین توکن تا انقضای خودش (پیش‌فرض ۷ روز، `LICENSE_TOKEN_DAYS`) کار می‌کند.

## نکته‌ها

- کلید لایسنس فقط یک‌بار نمایش داده می‌شود؛ فقط هش آن ذخیره می‌شود.
- سایت تعلیق‌شده یا منقضی، توکن بدون قابلیت اختیاری می‌گیرد.
- استعلام از دامنهٔ نامطابق رد و در تاریخچهٔ سایت ثبت می‌شود.
- کلیدهای قابلیت باید با `LICENSE_FEATURES` در پروژهٔ فروشگاه یکی باشند (`src/lib/catalog.ts` در اینجا).

## خرید قابلیت توسط مشتری

- اطلاعات حساب خودتان را در صفحهٔ «اطلاعات حساب» وارد کنید.
- ادمین سایت مشتری روی قابلیت قفل‌شده که کلیک کند، به‌جای باز شدن آن، صفحهٔ «این قابلیت قفل است» را می‌بیند: قیمت، مشخصات حساب شما و فرم ثبت کد پیگیری.
- درخواست در «درخواست‌های خرید» می‌آید؛ با تأیید، قابلیت به سایت اضافه می‌شود و با دکمهٔ «بررسی وضعیت خرید» (یا cron بعدی) روی سایت مشتری فعال می‌شود.

## پرداخت آنلاین (زرین‌پال)

- شناسهٔ پذیرنده در `.env` است: `ZARINPAL_MERCHANT_ID` (خالی یعنی پرداخت آنلاین خاموش است).
- حالت درگاه از `NODE_ENV` می‌آید: در `production` درگاه زنده، در بقیه (dev و test) sandbox.
- `APP_URL` باید آدرس عمومی همین پنل باشد، چون درگاه کاربر را به آن برمی‌گرداند.

## API مالک (`/api/owner/*`)

یک API JSON برای ابزارهای خودکار مثل سرور MCP. با کوکی پنل کار نمی‌کند؛ فقط با هدر `Authorization: Bearer <OWNER_API_TOKEN>`. اگر `OWNER_API_TOKEN` (حداقل ۳۲ نویسه) در `.env` خالی باشد، این API خاموش است و ۴۰۴ می‌دهد.

| مسیر | کار |
|---|---|
| `GET /summary` | تعداد سایت‌ها، خریدهای در انتظار، شارژهای در انتظار، تیکت‌های باز |
| `GET /sites?q=&status=&limit=&offset=` · `GET /sites/:id` | فهرست و جزئیات سایت (بدون کلید لایسنس) |
| `PATCH /sites/:id` | `status`، `contractPrice`، `supportFreeMonths`، `notes`، `addFeatures`، `removeFeatures` |
| `GET /sites/:id/wallet` · `POST /sites/:id/wallet` | تاریخچهٔ کیف پول · `{direction: credit\|debit, amount, description}` |
| `GET /features` · `PATCH /features/:key` | کاتالوگ · `title`، `group`، `description`، `price`، `isActive` |
| `GET /packages` · `POST /packages` · `PATCH /packages/:id` | بسته‌ها · `{name, price, featureKeys}` |
| `GET /purchases?status=` · `POST /purchases/:id/approve` · `POST /purchases/:id/reject` | درخواست‌های خرید · رد با `{reason}` |
| `GET /topups?status=` · `POST /topups/:id/approve` · `POST /topups/:id/reject` | شارژ کیف پول |
| `GET /tickets?status=&q=` · `GET /tickets/:id` · `POST /tickets/:id/reply` · `POST /tickets/:id/close` | پشتیبانی · پاسخ با `{body}` |
| `GET /ratings` | امتیازها |

عمداً وجود ندارد: ساخت/حذف سایت و بازتولید کلید لایسنس (کلید نباید از مسیر چت عبور کند)، حذف بسته، تنظیمات حساب بانکی/درگاه/پیامک و ارسال پیامک.
منطق همان توابع پنل است (`grantPurchase`، `grantTopup`، `creditWallet`، `debitWallet`، `notifySites`) و در `src/lib/owner-ops.ts` قرار دارد.

## دستیار هوشمند (`/ai`)

صفحه‌ی چت داخل پنل با هر API سازگار با OpenAI. برای استفاده‌ی رایگان در `.env` یکی از نمونه‌های OpenRouter / Groq / Gemini (کلید رایگان) یا Ollama (محلی، بدون کلید) را از `.env.example` بردارید و `AI_API_KEY`، `AI_BASE_URL` و `AI_MODEL` را بگذارید. DeepSeek هم با `DEEPSEEK_API_KEY` کار می‌کند. خالی = خاموش.

- ابزارهای خواندن (سایت‌ها، خریدها، تیکت‌ها، کیف پول …) بلافاصله اجرا می‌شوند.
- ابزارهای نوشتن (تأیید/رد خرید و شارژ، پاسخ و بستن تیکت، تعدیل کیف پول، ویرایش سایت/قابلیت/بسته) **هرگز بدون کلیک شما اجرا نمی‌شوند**: مدل فقط یک کارت «تأیید و اجرا / رد» می‌سازد.
- ابزارها همان عملیات `/api/owner` هستند (`src/lib/owner-ops.ts`)، پس قوانین پنل رعایت می‌شود. کلید لایسنس، حذف، تنظیمات بانکی/درگاه/پیامک و ارسال پیامک در دسترس دستیار نیست.
- مسیر `POST /api/ai/chat` فقط با نشست مالک کار می‌کند. گفتگو در مرورگر نگه داشته می‌شود و ذخیره نمی‌شود.
