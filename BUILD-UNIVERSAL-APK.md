# G.I APK Creator — Universal APK လမ်းညွှန်

## ပြင်ဆင်ပြီးသောအရာများ

`app.config.ts` တွင် Android ABI လေးမျိုး—`armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`—ကို သတ်မှတ်ထားသည်။ ရည်ရွယ်ချက်မှာ ABI တစ်မျိုးစီအတွက် split APK ခွဲထုတ်ခြင်းမဟုတ်ဘဲ architecture မျိုးစုံပါဝင်သည့် APK တစ်ဖိုင်ထုတ်ရန်ဖြစ်သည်။ `eas.json` တွင် Android APK artifact အတွက် `universal` profile ကိုပြင်ဆင်ထားသည်။

## APK အစစ်ထုတ်ရန် လိုအပ်သေးသည်

Managed Expo Sandbox ထဲမှာ Android SDK/Gradle release build မလုပ်ထားပါ။ EAS CLI ကိုစစ်ရာ account login မရှိသဖြင့် cloud build ကိုလည်း ယခု session မှ မစတင်နိုင်သေးပါ။ APK အစစ်ထုတ်ရန် authenticated native builder (ဥပမာ EAS cloud build) ကို project source ပေးပို့ခွင့်ပြုပြီး **APK** artifact နှင့် **universal** profile ကိုရွေးပါ (ရွေးချယ်စရာပြသပါက AAB သို့မဟုတ် ABI split မရွေးပါနှင့်)။ Download လုပ်နိုင်သော `.apk` ဖိုင်ရရှိသည့်အခါမှသာ APK build ပြီးကြောင်း အတည်ပြုနိုင်သည်။

## App အတွင်း လက်ရှိရရှိနိုင်သော လုပ်ဆောင်ချက်များ

- Splash, Dashboard, Projects, Activity/Builds, Settings UI.
- Draft Project များကို local storage နှင့် managed database တွင်သိမ်းခြင်း; offline အချိန်တွင် local fallback.
- Manus AI built-in default သို့မဟုတ် Groq, Gemini, Cohere, OpenRouter, Ollama Cloud, Custom API ဖြင့် Android source bundle ဖန်တီးသည့် background AI queue.
- Provider key များကို Android SecureStore တွင် provider အလိုက်ခွဲသိမ်းခြင်း; AI job လုပ်ချိန်တွင်သာ HTTPS ဖြင့် backend memory ထဲသို့ ယာယီပို့ပြီး database/log ထဲမသိမ်းခြင်း.
- `.zip` Project archive 8 MB အထိ import လုပ်၍ managed object storage တွင်သိမ်းခြင်း; signed download ဖြင့် ပြန်ရယူခြင်း. Import လုပ်ထားသော archive ကို server က extract သို့မဟုတ် execute မလုပ်ပါ.
- AI task progress, cancellation, restart ကြောင့် interrupted ဖြစ်သည့်အခြေအနေ, generated source preview.

## မချိတ်ဆက်ရသေးသော အပိုင်း

AI task က project source files ကိုသာ ဖန်တီးပေးသည်; Android SDK/Gradle ဖြင့် APK ကို app အတွင်းမှ compile လုပ်ပေးမည့် native builder service မချိတ်ဆက်ရသေးပါ။ ထို့ကြောင့် Builds tab က AI source task နှင့် APK compilation ကို သီးခြားခွဲပြပြီး native builder မရရှိကြောင်း ရှင်းလင်းဖော်ပြသည်။ ယခု project folder ထဲတွင် install လုပ်နိုင်သော `.apk` ဖိုင် မရှိသေးပါ။

## အချက်အလက် ပြန်ရယူခြင်း

Cloud project/task records သည် random token ဖြင့် **app installation တစ်ခုချင်းစီ** ကိုခွဲထားသည်။ Android တွင် token ကို SecureStore ထဲတွင်သိမ်းထားသော်လည်း app ကို uninstall လုပ်လျှင် token ပြန်မရနိုင်သဖြင့် cloud data ချိတ်ဆက်မှု ဆုံးရှုံးနိုင်သည်။ အရေးကြီးသော imported Project များကို ZIP အဖြစ် ကြိုတင်ရယူပြီး backup လုပ်ပါ။ Web Preview token သည် browser tab/session အတွင်းသာ အလုပ်လုပ်သည်။
