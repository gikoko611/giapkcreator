# G.I APK Creator — Implementation Plan

## ရည်ရွယ်ချက်နှင့် နယ်ပယ်

G.I APK Creator သည် AI ကို နောက်ကွယ်တွင်အသုံးပြုပြီး Android project များကို စီမံကာ universal APK build သို့ ဆက်သွားနိုင်ရန် ရည်ရွယ်သော mobile app ဖြစ်သည်။ ဤအဆင့်တွင် မြန်မာဘာသာအဓိက Splash, Dashboard, Projects, Builds နှင့် Settings UI ကို တည်ဆောက်မည်။ Dashboard ကို API key မထည့်ရသေးလည်း အသုံးပြုနိုင်စေမည်။ Settings တွင် Groq, Gemini, Cohere, OpenRouter, Ollama Cloud နှင့် Custom API အတွက် provider/model/endpoint ရွေးချယ်မှုနှင့် encrypted device key storage ကို ထည့်မည်။ Build workflow ကို ဖုန်းပေါ်တွင် Gradle လုပ်သည်ဟု မပြောဘဲ remote native build အတွက် ချိတ်ဆက်နိုင်သည့် အခြေခံအဖြစ်ထားမည်။

## Design direction

- **Design Movement:** Tech-noir / restrained cyber-console — developer tool အဖြစ် တိကျပြီး ရှင်းလင်းစေမည်။
- **Core Principles:** (1) အခြေအနေကို ချက်ချင်းနားလည်စေခြင်း၊ (2) အဓိကလုပ်ဆောင်ချက်များကို လက်တစ်ဖက်ဖြင့်နှိပ်လွယ်စေခြင်း၊ (3) neon ကို အချက်ပြအတွက်သာသုံးခြင်း၊ (4) key နှင့် build data ကို မလိုအပ်ဘဲ မဖော်ပြခြင်း။
- **Color Philosophy:** နက်ပြာ/အနက် `#080B14` က အာရုံစိုက်မှုကို တည်ငြိမ်စေသည်။ Card `#111827` နှင့် border `#223044` က အလွှာကိုဖော်ပြသည်။ Brand cyan `#36E2FF` ကို action/progress အတွက်၊ violet `#9A6BFF` ကို AI cue အတွက် သုံးမည်။ စာသား `#F3F6FC`, secondary `#9AA8BC`; success `#40D99A`, warning `#FFC15C`, error `#FF647C`။
- **Layout Paradigm:** Portrait-first, vertical command dashboard. ထိပ်မှာ brand/status, အောက်မှာ AI setup သို့မဟုတ် active build, ထို့နောက် New/Import action, Recent Projects, Build Activity အစဉ်လိုက်ထားမည်။ Card များကို တစ်ကော်လံအဖြစ်ထားပြီး screen ကျယ်လျှင် action နှစ်ခုကို ဘေးချင်းယှဉ်မည်။
- **Signature Elements:** (1) လိုင်းပါး neon-cyan card border၊ (2) AI အတွက် violet pulse dot၊ (3) build stage တစ်ဆင့်ချင်းကို အလင်းရောင်ပြသော segmented rail။
- **Interaction & Animation:** 48dp ဝန်းကျင် touch targets၊ ခလုတ်နှိပ်ချိန် haptic feedback၊ screen transition 180–240ms၊ progress pulse သည် active အချိန်တွင်သာ လှုပ်ရှားမည်။ Reduced-motion/အားနည်းဖုန်းများတွင် animation မပြင်းစေရ။
- **Typography:** Native system sans ကို body/မြန်မာစာအတွက်သုံးပြီး glyph coverage ကို ထိန်းထားမည်။ English technical micro-labels, package/version/status များတွင် system monospace သုံးမည်။ Headline 24–28sp, section 16–18sp, body 14–16sp, metadata 11–12sp။
- **Brand Essence:** “စိတ်ကူးကနေ APK build အထိ တစ်နေရာတည်းက စီမံနိုင်သော AI-assisted Android studio” — တိကျ၊ လုံခြုံ၊ အဆင်သင့်။
- **Brand Voice:** အားပေးသော်လည်း တိကျသော စကားသံ။ ဥပမာ “စိတ်ကူးကို project အဖြစ်စတင်ပါ” နှင့် “Build progress ကို ဒီနေရာမှာ ဆက်ကြည့်နိုင်ပါတယ်”။
- **Wordmark & Logo:** G ပုံစံ circuit လမ်းကြောင်းနှင့် အလယ်က vertical I ကိုပေါင်းထားသော ရိုးရှင်းသည့် geometric mark; launcher icon တွင်စာလုံးမထည့်ဘဲ shape တစ်ခုတည်းထားမည်။
- **Signature Brand Color:** Neon cyan `#36E2FF`။

## App flow

1. Native Splash/brief animated brand route → Dashboard.
2. Dashboard မှ New Project/Import Project, Recent Projects, AI setup, Build Activity руу шилжих.
3. Bottom tabs: Home, Projects, Builds, Settings.
4. Settings တွင် provider ရွေး၊ model/endpoint ပြင်၊ key ထည့်/ဖျက်၊ saved key ကို masked status ဖြင့်သာပြ။ Key ကို SecureStore တွင် သိမ်းပြီး managed database ထဲမသိမ်းရ။
5. Build UI တွင် `Queued`, `Working`, `Needs review`, `Completed`, `Failed` states နှင့် `Preparing`, `Resolving dependencies`, `Compiling`, `Packaging APK`, `Verifying` stages ကိုဖော်ပြ။ Fake percentage မပြ; backend progress မရလျှင် stage/indeterminate progress ကိုသာပြ။

## Project structure

- `app/index.tsx`: in-app Splash နှင့် tab entry သို့ကူးပြောင်းခြင်း။
- `app/(tabs)/index.tsx`: Dashboard.
- `app/(tabs)/projects.tsx`: project list/empty state.
- `app/(tabs)/builds.tsx`: build activity/history.
- `app/(tabs)/settings.tsx`: AI provider/key settings.
- `components/gi/`: shared cyber cards, section headers, status chips, buttons, progress stages.
- `lib/ai/providers.ts`: supported provider identifiers/default model/endpoint metadata.
- `lib/ai/secure-key-store.ts`: Expo SecureStore wrapper; secret values are never logged or sent to DB.
- `lib/projects/`: local project state and storage adapters; later managed DB API integration.
- `types/`: project/build/provider data types.
- `drizzle/schema.ts`: user-owned project/build metadata tables when remote persistence is implemented; no API key column.
- `assets/images/`: app/adaptive/splash branding variants.

## Build boundary

Android SDK/Gradle release builds are not run inside this Sandbox for the managed Expo starter. Configure a single APK build profile with supported Android ABIs and retain the Dashboard native-build handoff. Actual APK creation is complete only after the managed native build reports a downloadable artifact. APK should be one universal package, not per-ABI split artifacts; verify the generated profile/config and report the release build limitation accurately if the Dashboard action is not available in this session.
