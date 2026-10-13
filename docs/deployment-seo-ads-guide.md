# Centre Dentaire Sefrou — Deployment, SEO & Advertising Guide

Last updated: 11 October 2026

This guide covers four things, in order:

1. The codebase health check
2. How to deploy the site
3. What has been done for SEO, and what you still need to do outside the code
4. Advertising (Google Ads and others): **read the legal section first**

---

## 1. Codebase health check

| Check | Result |
|---|---|
| TypeScript / Astro check (`npx astro check`) | 0 errors, 0 warnings, 0 hints |
| Production build (`npm run build`) | 41 pages, plus `robots.txt` and the sitemap |
| Security audit (`npm audit --omit=dev`) | 0 vulnerabilities |
| Outdated packages | Astro 7.3.5 → 7.3.8 (minor, safe to update with `npm update astro`) |
| JSON-LD structured data | 135 blocks, all valid JSON |
| Automated browser tests | All pages: no JS errors, no horizontal overflow at 360px and 1440px; menus, slider, carousel, form, map, video and booking links all pass |
| Lighthouse (mobile) | Home 94 · treatment pages 98 · accessibility 100 · best practices 100 · SEO 100 |

**Placeholders still to fill** (they're marked `TODO` in the code):

| What | Where |
|---|---|
| Clinic e-mail | `src/data/site.ts` → `email` |
| Opening hours (please confirm) | `src/data/site.ts` → `hours` |
| Instagram / Facebook / TikTok links | `src/data/site.ts` → `social`. Placeholder links are automatically left out of the structured data. |
| GPS coordinates | `src/data/site.ts` → `geo`. See SEO step 1 below. |
| ~~Doctor's portrait~~ | Done: real photos added |
| Legal notice: Ordre registration number, hosting provider | `src/views/LegalPage.astro` |
| Medical texts reviewed by the doctor | `src/data/treatments.ts` |
| Final domain | Set the `SITE_URL` environment variable on the host (see section 2) |

---

## 2. Deployment

The site is fully **static**: `npm run build` produces a `dist/` folder of plain HTML, CSS, JS and images. It needs no server, no database and no PHP, so almost any host works.

### Options compared

| Option | Cost | Speed in Morocco | Effort | Notes |
|---|---|---|---|---|
| **Cloudflare Pages** ⭐ recommended | Free | Very good (global CDN with nearby points of presence) | Low | Automatic HTTPS. Redeploys on every Git push. Reads `public/_headers`. Commercial use is allowed on the free plan. |
| **Netlify** | Free tier | Good | Low | Same workflow. `netlify.toml` is already in the repo. |
| **Moroccan shared hosting** (cPanel/Plesk) | Paid | Good | Medium | Upload `dist/` by FTP after each change. `public/.htaccess` is already included. |
| Vercel | — | Good | Low | ⚠ The free "Hobby" plan is for non-commercial use only, so a clinic needs the paid plan. |

### Recommended: Cloudflare Pages + the `.com` domain

**Step 1. Domain**
- Chosen domain: **`centredentairesefrou.com`**.
- At the registrar:
  - Don't add hosting, the registrar's DNS service or its email forwarding: Cloudflare replaces all three.
  - Keep the default nameservers until Step 4.
  - Turn on auto-renew, and buy it **in the clinic's or the doctor's name**. Keep the login details.
- **Optional:** also buy `centredentairesefrou.ma` (through an ANRT-accredited registrar) to protect the name. Redirect it with a 301 to the .com using a Cloudflare Redirect Rule, so only one domain is ever indexed.
- **Email:** in Cloudflare → **Email Routing**, create `contact@centredentairesefrou.com` and forward it to the doctor's mailbox (free).

**Step 2. Put the code on GitHub** (free private repository):
```bash
git init
git add .
git commit -m "Centre Dentaire Sefrou website"
git branch -M main
git remote add origin https://github.com/<account>/centre-dentaire-sefrou.git
git push -u origin main
```
`node_modules/` and `dist/` are already excluded by `.gitignore`.

**Step 3. Create the Cloudflare project**
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository** → select `Houssam1998/CentreDentaireSefrou`.
2. Enter the settings:
   - Project name: `centredentairesefrou`. It must match `name` in `wrangler.jsonc`.
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`. `wrangler.jsonc` in the repo tells it to publish `dist/`.
   - Build variables (under *Advanced settings*):
     - `SITE_URL` = `https://www.centredentairesefrou.com`
     - Node 24 is picked up from `.nvmrc`. If needed, add `NODE_VERSION` = `24` as well.
3. Click **Deploy**. You get a test URL like `centredentairesefrou.<account>.workers.dev`. Click through it on a phone.
4. *(The older "Pages" flow also works: build command `npm run build`, output directory `dist`, same variables.)*

**Step 4. Connect the domain**
1. Easiest: in Cloudflare, **Add a site** with your domain, then change the domain's nameservers at the registrar to the two Cloudflare nameservers.
2. In the Pages project → **Custom domains**, add `www.centredentairesefrou.com` and the bare domain.
3. HTTPS certificates are issued automatically.
4. Pick one main version (`www.`) and redirect the other to it: Cloudflare → Rules → Redirect Rules → 301.

**Step 5. Updates from now on**
- Edit content in `src/data/*.ts`, then `git commit` and `git push`.
- Cloudflare rebuilds and publishes in about a minute.

**Shared hosting instead?**
1. Run `npm run build` locally.
2. Upload the **contents** of `dist/` into `public_html/` by FTP. That includes the hidden `.htaccess` file, so enable "show hidden files" in your FTP client.

### Go-live checklist
- [ ] `SITE_URL` set to the real domain, and the site rebuilt
- [ ] Opening `http://` redirects to `https://`, and only one version (www or not) is used
- [ ] `https://<domain>/robots.txt` and `/sitemap-index.xml` both open
- [ ] On a real phone, test the call button, WhatsApp, Dentisto, the map and the video
- [ ] Remaining placeholders filled in (section 1)
- [ ] Google Search Console and Google Business Profile set up (section 3)

---

## 3. SEO — getting found for "dentiste Sefrou"

### 3.1 Already done in the code

- **One page per treatment** (13 in French and 13 in English). Each has a title and description targeting "… à Sefrou".
- **French/English versions linked to each other** (`hreflang`), so Google shows the right language.
- **Each page declares its preferred address** (canonical URL). URLs always end with `/`, so there are no duplicates.
- **Sitemap** with a last-updated date, and a `robots.txt` that points to it.
- **Structured data** describing the practice to Google:
  - `Dentist` (address, phone, hours, area served, link to the Maps listing, Dentisto booking action, rating, founding date, list of treatments)
  - `Physician` (the doctor)
  - `MedicalProcedure` on each treatment page
  - `FAQPage`
  - `BreadcrumbList`
- **Local signals:** the towns served (Sefrou, Bhalil, Imouzzer Kandar, El Menzel, Aïn Cheggag, Fès) and the Arabic name «مركز طب و جراحة الأسنان صفرو — طبيب أسنان في صفرو» are now real text in the footer, not just inside the logo image.
- **Social sharing:** full preview tags for WhatsApp, Facebook and X.
- **The 404 page is excluded from search results.**
- **Speed and mobile quality** (both are ranking factors): Lighthouse SEO 100, performance 94–98.
- **Ready for Search Console and Bing:** paste the verification code into `site.ts` (`googleSiteVerification`, `bingSiteVerification`).

### 3.2 Off-site actions, in order of impact

**1. Google Business Profile (GBP).** This matters most: for a local search like "dentiste Sefrou", the map results are shown above the ordinary ones.
- Claim and verify the existing listing (it's the one behind the Maps link already on the site).
- **Primary category:** *Dentiste*. **Secondary:** *Clinique dentaire*, *Centre de soins dentaires*.
- **Name, address and phone must be exactly the same as on the website:**
  - Centre Dentaire Sefrou
  - N464 Derb El Miter, Sefrou 31000
  - 05 35 68 20 56
- **Website:** the site's home page. **Booking link:** the Dentisto URL.
- **Services:** add the same treatment names as the website (implants, facettes, aligneurs, blanchiment, détartrage, bruxisme, ronflement…).
- **Photos:** upload the real clinic photos (front of the building, reception, rooms, X-ray unit). Listings with photos get more clicks.
- **Hours:** keep them exact, including holidays.
- **Description:** a factual summary of the services, in French. You can add Arabic too.
- **GPS coordinates for the site:** open the listing on Google Maps on a computer, right-click the pin, and click the coordinates to copy them. Paste them into `site.ts` → `geo: { lat: …, lng: … }`.
- **Reviews:**
  - Keep replying to every review, as you already do.
  - Ask satisfied patients to leave one, for example with a QR code at reception.
  - **Never offer anything in exchange**: that breaks Google's rules, and Art. 16 of the dental code (no advantages to patients).

**2. Google Search Console**
1. Add a property for the domain. The easiest verification is a DNS TXT record (one click if the domain is on Cloudflare). The alternative is the meta tag via `googleSiteVerification`.
2. Submit `https://<domain>/sitemap-index.xml`.
3. Use **URL inspection → Request indexing** for the home page, the contact page and the main treatment pages.
4. Check **Performance** monthly to see which searches bring visitors.

**3. Bing Webmaster Tools.** Import the site directly from Search Console; it takes two minutes.

**4. Consistent directory listings.** Listing the clinic in directories is explicitly allowed by Art. 12 of the code: name, address, phone and hours only. Use exactly the same details everywhere:
- Dentisto (done)
- Moroccan health directories (DabaDoc, Med.ma, Telecontact…)
- Apple Business Connect (Apple Maps)
- Bing Places
- A Facebook page

**5. An Arabic version of the site.** Many local searches are in Arabic or Darija (طبيب أسنان صفرو, tbib snan sefrou). An Arabic (right-to-left) version of the main pages is the biggest content win still available. The site structure supports adding a third language.

**6. Helpful content, about one article a month (FR, ideally also AR).** Answer real patient questions, for example:
- "Implant ou bridge : que choisir ?"
- "Dents sensibles après un blanchiment : est-ce normal ?"
- "Ronflement : quand consulter ?"
- "Comment se passe une première consultation ?"

Keep it **informational and educational**. Article 11.3 allows communication with an educational purpose; no promotions, no prices to attract patients.

**7. Fill the remaining placeholders**: e-mail, social links, the doctor's photo. Pages that look complete and trustworthy perform better.

### 3.3 Keywords and the pages that target them

| Search (FR) | Target page |
|---|---|
| dentiste Sefrou · cabinet / centre dentaire Sefrou | Home |
| implant dentaire Sefrou | `/soins/implants-dentaires/` |
| facettes dentaires Sefrou | `/soins/facettes-dentaires/` |
| blanchiment dentaire Sefrou | `/soins/blanchiment-dentaire/` |
| aligneurs / appareil invisible Sefrou | `/soins/traitement-par-aligneurs/` |
| détartrage Sefrou | `/soins/detartrage-controle/` |
| dent de sagesse Sefrou | `/soins/extraction-dents-de-sagesse/` |
| ronflement / apnée du sommeil Sefrou | `/soins/ronflement-apnee-du-sommeil/` |
| bruxisme / grincement des dents Sefrou | `/soins/bruxisme/` |
| طبيب أسنان صفرو · مركز طب الأسنان صفرو | Future Arabic home page |

**Realistic expectations:** competition for "dentiste Sefrou" is modest. With a verified GBP listing, consistent directory listings, regular reviews and this site indexed, reaching the **top 3 map results and the first page within a few weeks to a few months** is realistic. No one can honestly guarantee position #1. Competitive searches in Fès ("implant dentaire Fès") take longer and need content.

### 3.4 What to monitor (monthly)
- **Search Console:** impressions, clicks, average position for "dentiste Sefrou" and the treatment searches.
- **GBP Insights:** calls, direction requests, website clicks, booking clicks.
- **Dentisto:** online bookings. Ask new patients "how did you find us?"
- **Optional:** GA4 (see 4.3) for visits and contact clicks.

---

## 4. Advertising (Google Ads, Facebook / Instagram)

### 4.1 ⚠ Read first: the legal framework in Morocco

The **Code de déontologie des médecins-dentistes** (Décret n° 2-96-989 du 5 janvier 1999, B.O. n° 4662) applies to every registered dentist:

- **Art. 11** — the profession "ne doit pas être pratiquée comme un commerce". It forbids in particular "**tous procédés directs ou indirects de réclame ou de publicité**".
- **Art. 19** — "Sont également interdites **toute publicité, toute réclame personnelle**…"
- **Art. 14** — announcements of a **cabinet opening** must first be approved by the **Conseil supérieur de l'Ordre**.
- **Art. 16 / Art. 35** — no advantages or discounts to patients, and no lowering fees to compete. So no promotions, "offers" or price-led ads.
- **Art. 4** — patients must not be identifiable in publications. Before/after photos need the patient's consent, and identifying features should be avoided.

**In practice:**
- Paid campaigns (Google Ads, sponsored Facebook/Instagram posts) are very likely to count as "publicité" under Art. 11 and 19. Running them without approval exposes the doctor to **disciplinary action by the Ordre**.
- Some competitors do run Google Ads (their sites contain Google Ads conversion tags), but that doesn't make it compliant.
- **Before spending anything:** the doctor should send a written request to the **Conseil régional de l'Ordre des médecins dentistes** (Fès region) and/or the national council, describing what is planned. Ideally include the website itself, since it shows testimonials, before/after photos and the opening date.
- **What stays within the rules** and is your main growth lever: the SEO actions in section 3. That means a GBP listing, directory entries (Art. 12), an informative website and educational content.

The rest of this section explains **how** to run Google Ads properly **if and when the Ordre authorises it**, or for any campaign format it approves.

### 4.2 Google Ads, step by step (only after the Ordre's approval)

**A. Account setup**
1. Go to ads.google.com and sign in with the **clinic's** Google account (the same one as the GBP listing).
2. Switch to **Expert mode** and create the account **without a campaign**. This avoids "Smart" campaigns, which give little control.
3. Set the billing country to Morocco, currency MAD, and the time zone to Casablanca.
4. Link **Google Business Profile** (for the location asset) and **GA4** (Tools → Linked accounts).

**B. Conversion tracking** (already wired in the site; you only add the IDs)
1. Go to Tools → Conversions → **New conversion** → Website → **Set up manually**. Create three actions:
   - "Réservation Dentisto (clic)", category *Book appointment*
   - "WhatsApp (clic)", category *Contact*
   - "Appel depuis le site (clic)", category *Phone call lead*
2. Also create **"Calls from ads"** for the call asset.
3. Copy the tag ID (`AW-XXXXXXXXXX`) and each **conversion label** into `src/data/site.ts`:
   ```ts
   analytics: {
     ga4: 'G-XXXXXXXXXX',          // optional, from Google Analytics
     googleAds: 'AW-XXXXXXXXXX',
     conversions: { booking: 'abcDEF123', whatsapp: 'ghiJKL456', call: 'mnoPQR789' },
   },
   ```
4. Push the change. The site then loads the Google tag automatically, counts every booking, WhatsApp and call button click as a conversion, and updates the cookie paragraph of the legal notice. While the IDs are empty, **nothing is loaded**.
5. Check it with **Google Tag Assistant** (tagassistant.google.com).

**C. First campaign**
- **Type:** Search. Goal: Leads. **Networks: untick Display and Search partners.**
- **Location:** radius around Sefrou (about 20–25 km), optionally Fès as a separate campaign later. Under Location options, choose **"Presence: people in or regularly in your locations"**.
- **Languages:** French, Arabic (English optional).
- **Schedule:** opening hours, plus evenings for WhatsApp and Dentisto bookings.
- **Bidding:**
  - Start with **Maximise clicks** with a max CPC cap.
  - Switch to **Maximise conversions** once you have about 30 conversions.
- **Budget:** start small, e.g. 50–80 MAD/day (about 1,500–2,500 MAD/month). Adjust after 4–6 weeks of data.

**D. Ad groups.** One per treatment, each sending visitors to the matching page:

| Ad group | Example keywords (phrase/exact match) | Landing page |
|---|---|---|
| Dentiste | "dentiste sefrou", "cabinet dentaire sefrou", [طبيب أسنان صفرو] | Home |
| Implants | "implant dentaire sefrou", "implant dentaire fès" | Implants |
| Esthétique | "facettes dentaires sefrou", "blanchiment dentaire sefrou" | Facettes / Blanchiment |
| Aligneurs | "aligneurs dentaires", "appareil dentaire invisible sefrou" | Aligneurs |
| Urgence | "urgence dentaire sefrou", "mal de dent sefrou" | Contact |
| Sommeil | "ronflement traitement sefrou", "gouttière bruxisme" | Ronflement / Bruxisme |

**Negative keywords** (to avoid paying for useless clicks):
- emploi, stage, recrutement, salaire, formation, cours, faculté, pdf, définition, gratuit
- vétérinaire, prothésiste, matériel dentaire
- city names you don't serve

**E. Ads** (Responsive Search Ads)
- **Rules:** factual and informational; no prices, promotions or superlatives ("le meilleur…"); no guarantees of results.
- **Example headlines** (30 characters max):
  - Centre Dentaire Sefrou
  - Dr Amine El Omari
  - Radiographie 3D sur place
  - Rendez-vous en ligne
  - Implants et prothèses
  - Scanner intra-oral
- **Example descriptions** (90 characters max):
  - "Cabinet moderne à Sefrou : soins, implants, esthétique. Prenez rendez-vous en ligne."
  - "Consultation, diagnostic et devis détaillé. Équipe à l'écoute. Ouvert du lundi au samedi."
- **Assets:**
  - **Sitelinks:** Implants, Facettes, Aligneurs, Contact
  - **Callouts:** "Radiographie 3D (CBCT)", "Empreinte numérique", "Accès WhatsApp"
  - **Call asset:** 05 35 68 20 56
  - **Location asset:** from GBP

**F. Weekly optimisation (15 minutes)**
- **Search terms report:** add irrelevant searches as negatives.
- Pause keywords with spend but no conversions after a reasonable number of clicks.
- Move budget toward the ad groups that bring bookings.
- Compare with Dentisto bookings and phone calls.

**Google's own policies:** dental services can be advertised. Ads must not make misleading health claims, and before/after imagery is restricted. Google also expects advertisers to respect local law, which takes us back to section 4.1.

### 4.3 Analytics without advertising (allowed, useful)
You can enable **GA4 alone**: fill `analytics.ga4` and leave `googleAds` empty. You'll see visits, the most-viewed treatments and contact-button clicks. The legal notice updates itself to mention measurement cookies.

### 4.4 Facebook / Instagram
- **Same legal caveat:** a sponsored post is advertising under Art. 11 and 19.
- **Organic content is the safer path:** educational posts (oral hygiene tips, how a scan works, the clinic and team) with no promotion. Share them on the clinic's page, and on GBP as "updates".
- **If the Ordre allows ads:**
  - Meta's health-ad policies apply: no targeting based on health conditions, and no "before/after" implying guaranteed results.
  - A Meta Pixel can be added to the site the same way as the Google tag. Ask if needed.

---

## Summary: what to do, in order

1. Fill the remaining placeholders (section 1).
2. Buy the domain and deploy on Cloudflare Pages (section 2).
3. Verify Google Business Profile, then Search Console and Bing, and submit the sitemap (section 3.2).
4. Add the coordinates, collect reviews, and list the clinic in directories with identical details.
5. Ask the Ordre for a written opinion on advertising, and on the site's testimonials and before/after content.
6. Only once that's clear: Google Ads, using the ready-made tracking (section 4.2).
7. Consider an Arabic version and a monthly educational article.
