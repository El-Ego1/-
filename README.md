# حسابتي ERP — بناء تطبيق أندرويد

## المتطلبات
- Node.js 20+
- Android Studio (فيه الـ SDK و Gradle) و JDK 21

## الخطوات
```bash
npm install
npm run cap:add      # مرة واحدة بس — بيعمل فولدر android/
npm run android      # بيزامن الملفات ويفتح Android Studio
```
من Android Studio: Build > Build APK(s) — أو من الترمنال:
```bash
npm run build:apk    # الناتج: android/app/build/outputs/apk/debug/app-debug.apk
```

## بعد أي تعديل على www/
```bash
npm run cap:sync
```

## تجربة سريعة على الكمبيوتر
```bash
npm run serve        # http://localhost:8080
```

## للنشر على Play Store
```bash
npm run build:release   # بيطلع AAB — لازم تعمل keystore وتوقّعه
```

## ملاحظات
- التطبيق بيشتغل من `https://localhost` جوه الـ WebView، فالـ Service Worker و localStorage شغالين.
- الخطوط (Cairo) و Chart.js و xlsx بتتحمل من النت أول مرة وبعدين بتتخزن في الكاش. لو عايزه أوفلاين 100% من أول تشغيل، نزّلهم جوه `www/libs/` واربطهم محلياً.
- البيانات في localStorage: صدّر نسخة JSON احتياطية دورياً.
