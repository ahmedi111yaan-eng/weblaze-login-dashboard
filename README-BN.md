# Web Blaze Login Dashboard — বাংলা নির্দেশনা

এটি Vite + Supabase Auth দিয়ে তৈরি একটি প্রাথমিক login/dashboard starter। এতে email signup/login, sign out, নিজের store তৈরি করার RPC call, এবং RLS-নিয়ন্ত্রিত নিজের store-এর order দেখানোর UI আছে।

## GitHub ও Vercel-এ deploy
1. ZIP Extract করো।
2. GitHub-এ নতুন repository তৈরি করো, যেমন `weblaze-login-dashboard`।
3. Extract করা ফাইলগুলো repository-তে upload করো; `src` ফোল্ডারের ভেতরের ফাইলগুলো `src`-তেই থাকবে। তারপর Commit changes।
4. Vercel-এ GitHub দিয়ে sign in → Add New → Project → repository Import।
5. Framework preset Vite, Build command `npm run build`, Output directory `dist` রাখো।
6. Environment Variables যোগ করো:
   - `VITE_SUPABASE_URL` = Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = Supabase publishable key (`sb_publishable_...`) অথবা legacy anon key
7. Deploy করো।

## Supabase থেকে URL/key
Project Settings → API Keys / Data API-তে Project URL ও publishable/anon key পাওয়া যায়। শুধু publishable/anon key ব্যবহার করবে। `service_role` বা `sb_secret_...` কখনো frontend বা GitHub-এ দেবে না।

## Email confirmation
Supabase → Authentication → URL Configuration-এ Vercel deployment URL-কে Site URL এবং Redirect URL হিসেবে যোগ করো। Email confirmation চালু থাকলে email থেকে confirm করে sign in করো।

## সীমাবদ্ধতা ও নিরাপত্তা
- Customer order ingestion API এবং WooCommerce integration এখনো যুক্ত হয়নি।
- বাস্তব customer data নেওয়ার আগে security review করতে হবে।
- Existing SQL policies are an MVP starting point; production-এ order update permissions আরও সীমিত করতে হবে।
- `.env` ফাইল GitHub-এ commit কোরো না।