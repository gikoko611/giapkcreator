# G.I APK Creator — Android APK build လမ်းညွှန်

## Build profile များ

- **Universal (default):** `EXPO_ANDROID_ABI_PROFILE` မသတ်မှတ်ထားပါက `armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64` လေးမျိုးလုံးပါသော APK တစ်ဖိုင် ထုတ်သည်။
- **Redmi 9A 32-bit:** `EXPO_ANDROID_ABI_PROFILE=armeabi-v7a` သတ်မှတ်လျှင် `armeabi-v7a` တစ်မျိုးတည်းသာပါသော APK ထုတ်သည်။ Universal default ကို မပြောင်းပါ။

Gradle ABI split APK များထုတ်မည့်အစား ရွေးထားသော ABI များကို APK တစ်ဖိုင်တည်းထဲတွင် ထည့်သည်။ Redmi 9A workflow က build config နှင့် APK အတွင်း native library ABI ကို `armeabi-v7a` တစ်မျိုးတည်းဖြစ်ကြောင်း စစ်သည်။

## GitHub Actions workflow များ

- `.github/workflows/android-universal-apk.yml` — universal debug APK ကို manual dispatch လုပ်ရန်။
- `.github/workflows/android-redmi9a-armv7.yml` — Redmi 9A အတွက် 32-bit `armeabi-v7a` တစ်မျိုးတည်းပါသော debug APK ကို manual dispatch လုပ်ရန်။

Workflow နှစ်ခုလုံးတွင် HTTPS API origin ကို run လုပ်ချိန် input အဖြစ်ပေးသည်။ လက်ရှိ G.I APK Creator Preview API URL သည် ယာယီဖြစ်သောကြောင့် production အသုံးပြုမည့် APK အတွက် stable production API URL သတ်မှတ်ပြီးမှ build လုပ်ပါ။

## Signing နှင့် အသုံးပြုမှု

ယခု workflows များသည် installable **debug-signed testing APK** များထုတ်သည်။ Play Store တင်မည့် release APK မဟုတ်ပါ။ Release signing အတွက် keystore နှင့် protected build configuration သီးခြားလိုအပ်သည်။

တူညီသော package ကို အခြား debug keystore ဖြင့် sign လုပ်ထားသော build တစ်ခုရှိပြီးသားဆိုလျှင် APK အသစ် install လုပ်ရာတွင် signature conflict ဖြစ်နိုင်သည်။ APK အဟောင်းကို uninstall လုပ်ပါက app ထဲရှိ local data ပျောက်နိုင်သောကြောင့် လိုအပ်သည့် data များကို ကြိုတင် backup လုပ်ပါ။

## App ထဲတွင် မချိတ်ဆက်ရသေးသော လုပ်ဆောင်ချက်

G.I APK Creator သည် AI ဖြင့် Android source files ဖန်တီးပြီး project/archive များကို စီမံနိုင်သည်။ သို့သော် app အတွင်းမှ အသုံးပြုသူ၏ project ကို APK အဖြစ် compile လုပ်ပေးမည့် remote/native build service ကို မချိတ်ဆက်ရသေးပါ။

## Data backup သတိပြုရန်

Cloud project/task records သည် random token ဖြင့် **app installation တစ်ခုချင်းစီ** ကိုခွဲထားသည်။ Android တွင် token ကို SecureStore ထဲတွင်သိမ်းထားသော်လည်း app ကို uninstall လုပ်လျှင် token ပြန်မရနိုင်သဖြင့် cloud data ချိတ်ဆက်မှု ဆုံးရှုံးနိုင်သည်။ အရေးကြီးသော imported Project များကို ZIP အဖြစ် ကြိုတင်ရယူပြီး backup လုပ်ပါ။ Web Preview token သည် browser tab/session အတွင်းသာ အလုပ်လုပ်သည်။
