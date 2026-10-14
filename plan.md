# G.I APK Creator — အကောင်အထည်ဖော်မှုအစီအစဉ်

## ရည်ရွယ်ချက်နှင့် လက်ရှိအကန့်အသတ်

G.I APK Creator သည် Android app စိတ်ကူးကို Project အဖြစ်သိမ်း၊ AI ဖြင့် starter source files ဖန်တီး၊ ZIP Project archive ကို import/export လုပ်ပြီး build အခြေအနေကိုကြည့်နိုင်ရန် ရည်ရွယ်သော mobile app ဖြစ်သည်။ App သည် မြန်မာဘာသာကို အဓိကသုံးသည်။ AI source generation သည် server background queue ပေါ်တွင်လုပ်ဆောင်ပြီး task အခြေအနေ၊ ရလဒ်နှင့် project metadata ကို managed MySQL တွင်သိမ်းမည်။ Project ZIP archive များကို managed object storage တွင်ထားမည်။

ဤအဆင့်တွင် **AI-generated source bundle** ကို ဖန်တီး/ပြန်စစ်နိုင်သည်။ Android SDK/Gradle compile လုပ်သည့် native build service ကို app အတွင်း မချိတ်ဆက်ရသေးသောကြောင့် **install လုပ်နိုင်သော APK ကို ထုတ်ပြီးပြီဟု မဆိုရ**။ App UI က AI task progress နှင့် APK build readiness ကို သီးခြားခွဲပြမည်။

## Design direction

- **Design Movement:** Tech-noir / restrained cyber-console — developer tool အဖြစ် တိကျပြီး ရှင်းလင်းစေမည်။
- **Core Principles:** (1) အခြေအနေကို ချက်ချင်းနားလည်စေခြင်း၊ (2) အဓိကလုပ်ဆောင်ချက်များကို လက်တစ်ဖက်ဖြင့်နှိပ်လွယ်စေခြင်း၊ (3) neon ကို အချက်ပြအတွက်သာသုံးခြင်း၊ (4) key နှင့် build data ကို မလိုအပ်ဘဲ မဖော်ပြခြင်း။
- **Color Philosophy:** နက်ပြာ/အနက် `#080B14` က အာရုံစိုက်မှုကို တည်ငြိမ်စေသည်။ Card `#111827` နှင့် border `#223044` က အလွှာကိုဖော်ပြသည်။ Brand cyan `#36E2FF` ကို action/progress အတွက်၊ violet `#9A6BFF` ကို AI cue အတွက် သုံးမည်။ စာသား `#F3F6FC`, secondary `#9AA8BC`; success `#40D99A`, warning `#FFC15C`, error `#FF647C`။
- **Layout Paradigm:** Portrait-first, vertical command dashboard. ထိပ်မှာ brand/status, အောက်မှာ AI setup သို့မဟုတ် active task, ထို့နောက် New/Import action, Recent Projects, Activity အစဉ်လိုက်ထားမည်။
- **Signature Elements:** (1) လိုင်းပါး neon-cyan card border၊ (2) AI အတွက် violet pulse dot၊ (3) အဆင့်တစ်ဆင့်ချင်းကို အလင်းရောင်ပြသော segmented rail။
- **Interaction & Animation:** 48dp ဝန်းကျင် touch targets၊ ခလုတ်နှိပ်ချိန် haptic feedback၊ screen transition 180–240ms၊ progress pulse သည် active အချိန်တွင်သာ လှုပ်ရှားမည်။ Reduced-motion/အားနည်းဖုန်းများတွင် animation မပြင်းစေရ။
- **Typography:** Native system sans ကို body/မြန်မာစာအတွက်သုံးပြီး glyph coverage ကို ထိန်းထားမည်။ English technical micro-labels, package/version/status များတွင် system monospace သုံးမည်။ Headline 24–28sp, section 16–18sp, body 14–16sp, metadata 11–12sp။
- **Brand Essence:** “စိတ်ကူးကနေ Android source နှင့် universal APK build လုပ်ငန်းစဉ်အထိ တစ်နေရာတည်းက စီမံနိုင်သော AI-assisted studio” — တိကျ၊ လုံခြုံ၊ အဆင်သင့်။
- **Brand Voice:** အားပေးသော်လည်း တိကျသော စကားသံ။ ဥပမာ “စိတ်ကူးကို Project အဖြစ်စတင်ပါ” နှင့် “AI source ကို review လုပ်ရန်အသင့်ဖြစ်ပါပြီ”။
- **Wordmark & Logo:** G ပုံစံ circuit လမ်းကြောင်းနှင့် အလယ်က vertical I ကိုပေါင်းထားသော ရိုးရှင်းသည့် geometric mark; launcher icon တွင်စာလုံးမထည့်ဘဲ shape တစ်ခုတည်းထားမည်။
- **Signature Brand Color:** Neon cyan `#36E2FF`။

## App flow နှင့် data behavior

1. Native Splash/brief animated brand route → Dashboard.
2. Dashboard မှ Draft Project ဖန်တီးခြင်း၊ AI source generation စတင်ခြင်း၊ သို့မဟုတ် ZIP import ပြုလုပ်ခြင်း။
3. Bottom tabs: Home, Projects, Builds/Activity, Settings.
4. Settings တွင် Manus AI built-in default သို့မဟုတ် Groq, Gemini, Cohere, OpenRouter, Ollama Cloud, Custom API ရွေးချယ်နိုင်သည်။ External provider များအတွက် API key ကို provider အလိုက် Android SecureStore တွင် သိမ်းမည်။
5. External API key ကို DB ထဲမသိမ်းပါ။ အသုံးပြုသူက AI task ကို စတင်သည့်အခါမှသာ HTTPS ဖြင့် backend သို့ ယာယီပို့ပြီး server memory ထဲတွင် provider request ပြီးဆုံးချိန်အထိသာ သုံးမည်။ Custom API သည် public DNS/IP သာလက်ခံပြီး စစ်ပြီးသား IP သို့ connection ကို pin လုပ်မည်။ Log မရေး၊ task ပြန်စတင်ရန် key ကို persistent queue ထဲမသိမ်းပါ။ Manus AI built-in model ကိုအသုံးပြုရာတွင် project ၏ AI quota သုံးစွဲနိုင်ကြောင်း UI တွင် ကြိုတင်ဖော်ပြမည်။
6. Cloud project/task data ကို app installation တစ်ခုစီအတွက် cryptographic random token ဖြင့် ခွဲထားပြီး Android SecureStore တွင်ထားမည်; server ဘက်တွင် token ကို SHA-256 hash ပုံစံဖြင့်သာ အသုံးပြုသည်။ Account/login မလိုဘဲ local mode ဆက်သုံးနိုင်သည်။ App ကိုဖျက်ပြီးပြန်တင်လျှင် token ပြန်မရနိုင်သဖြင့် cloud project များနှင့် ချိတ်ဆက်မှု ပျောက်နိုင်သည်; ZIP backup ကိုကြိုတင်ရယူပါ။ Web Preview token သည် browser tab/session အတွင်းသာရှိသည်။
7. ZIP import သည် `.zip` archive 8 MB အထိသာလက်ခံပြီး magic bytes ကိုစစ်ကာ managed storage သို့တင်သည်။ Archive ကို extract/execute မလုပ်ပါ။ `archiveKey` ကို Project row တွင်သိမ်းပြီး download link အတွက် တစ်နာရီအထိ သက်တမ်းရှိသော signed URL ကိုသာ ပြန်ပေးသည်။
8. AI queue status များ: `queued`, `running`, `completed`, `failed`, `cancelled`; task restart ကြောင့် server restart ဖြစ်လျှင် failed/interrupted ဟု အမှန်အတိုင်းပြပြီး API key မရှိဘဲ auto replay မလုပ်ပါ။ Progress သည် server က အမှန်တကယ်မှတ်တမ်းတင်သော stage များသာ ပြမည်။
9. APK build status/stage UI သည် native builder မချိတ်ဆက်မချင်း placeholder/handoff ဖြစ်သည်; AI progress ကို APK progress ဟု မတင်ပြပါ။

## Project structure

- `app/index.tsx`: in-app Splash နှင့် tab entry သို့ကူးပြောင်းခြင်း။
- `app/(tabs)/index.tsx`: Dashboard, Project ဖန်တီးခြင်း, AI source task စတင်ခြင်း, ZIP Import.
- `app/(tabs)/projects.tsx`: local/cloud Project list နှင့် archive download.
- `app/(tabs)/builds.tsx`: persistent AI task queue/history, cancel, source review, native builder limitation.
- `app/(tabs)/settings.tsx`: AI provider/model/endpoint/key settings, connection test, quota/key/storage notices.
- `components/gi/`: shared cyber cards, section headers, status chips, buttons, progress stages.
- `lib/installation-token.ts`: random per-installation credential; native SecureStore, web tab session.
- `lib/ai/`: provider definitions, per-provider SecureStore keys, AI preferences.
- `lib/projects/` + `hooks/use-projects.ts`: local offline fallback and managed API synchronization.
- `server/features/projects.ts`: owner-scoped project metadata, ZIP upload/download authorization.
- `server/features/ai.ts` + `server/ai-provider.ts`: persistent background task queue, provider adapters, output validation, progress/status recovery.
- `drizzle/schema.ts`: additive project/task metadata tables; API key column intentionally မပါ။
- `assets/images/`: app/adaptive/splash branding variants.
- `app.config.ts` + `eas.json`: branded app configuration and one universal APK profile with supported Android ABIs.

## Universal APK build boundary

Android SDK/Gradle release builds are not run inside the managed Expo Sandbox. One APK profile သည် `armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64` ကို ပါဝင်စေရန်သတ်မှတ်ပြီး per-ABI split artifact မလုပ်ရန် ရည်ရွယ်ထားသည်။ EAS CLI login မရှိသည့်အပြင် local Android SDK/Gradle မရှိသေးသောကြောင့် APK artifact မထုတ်ရသေးပါ။ APK အစစ်အတည်ပြုရန် user ကရွေးချယ်သော authenticated native builder သို့ source ပေးပို့ပြီး downloadable `.apk` artifact အောင်မြင်ရရှိမှသာ completion ကို အတည်ပြုနိုင်သည်။
