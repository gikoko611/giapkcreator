# G.I APK Creator — Universal APK လမ်းညွှန်

## ပြင်ဆင်ပြီးသောအရာများ

`app.config.ts` တွင် Android ABI လေးမျိုး—`armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`—ကို သတ်မှတ်ထားပြီး ABI တစ်မျိုးချင်းစီအတွက် split APK သီးခြားထုတ်မည့်ပုံစံမဟုတ်ဘဲ တစ်ဖိုင်တည်းထုတ်ရန် ရည်ရွယ်ထားသည်။ `eas.json` တွင် `universal` build profile ကို APK artifact အဖြစ် သတ်မှတ်ထားသည်။

## APK အစစ်ထုတ်ရန်

ဤ managed Expo project ၏ လမ်းညွှန်ын дагуу native Android release build-ийг Sandbox shell дотор ажиллуулахгүй; project Dashboard-ийн native build workflow ашиглана။ Source өөрчлөлтийг checkpoint-д хадгалပြီးနောက် project Dashboard-оос Android native build ကိုစတင်ပါ။ Build option တွင် artifact type ရွေးခွင့်ရှိပါက **APK** ကိုရွေးပါ (AAB မဟုတ်ပါ); profile ရွေးခွင့်ရှိပါက **universal** ကိုရွေးပါ။ Build အောင်မြင်ပြီး downloadable APK ရရှိမှသာ APK ထုတ်ပြီးပြီဟု အတည်ပြုနိုင်သည်။

## ယခုအခြေအနေ

ဒီ sandbox session ထဲမှာ Android SDK/Gradle native release build မလုပ်ထားပါ။ ထို့ကြောင့် ယခု folder ထဲတွင် install လုပ်နိုင်သော `.apk` ဖိုင် မရှိသေးပါ။ Universal ABI/APK source configuration ကိုစစ်ဆေးပြီးဖြစ်သော်လည်း နောက်ဆုံး APK artifact ကို Dashboard build အောင်မြင်ကြောင်းပြသမှသာ အတည်ပြုနိုင်သည်။

## Feature အကန့်အသတ်

ဒီ milestone မှာ Splash, Dashboard, Projects, Builds, Settings UI၊ API provider configuration/key storage နှင့် local project draft persistence ကိုထည့်ထားသည်။ Remote AI task runner, server-side background queue, import/archive upload, managed database ထဲရှိ project/build history နှင့် APK artifact storage သည် နောက်ထပ် backend implementation လိုအပ်နေသေးသည်။ API key ကို SecureStore ဖြင့် device ပေါ်မှာသိမ်းထားပြီး managed database ထဲမသိမ်းပါ။
