# 06 — Store compliance

Read before writing auth or the feed. These are the things that get apps rejected,
and several of them are structural — retrofitting them costs a rewrite.

## The big one: user-generated content (Apple 1.2 / Play UGC policy)

Ratings, remarks, and photos are UGC. This is the **#1 rejection risk for this app**.
Both stores require all five of these, in-app:

| Requirement | Implementation |
|---|---|
| Filter objectionable content | Edge Function `moderate-remarks` on every insert. `moderation_status` starts `pending`; only `approved` rows are publicly readable. |
| Report mechanism | `reports` table. "Report" action on every rating, photo, and profile. Reachable in ≤2 taps from the content. |
| Block abusive users | `blocks` table. Blocked authors' content disappears from the blocker's feed — enforce in the `visible_ratings` view, not per-query. |
| Act on reports within 24h | Moderation queue + a documented SLA. Apple asks about this. Have an answer. |
| Published contact info | Support email in the app AND on the App Store listing AND on the website. |

Add a **terms acceptance gate** before a user's first post, with an explicit
"no objectionable content" agreement. Apple has rejected apps for missing this alone.

## Account deletion — both stores, non-negotiable

- Must be reachable **inside the app**, not a support email or a web form.
- Path: Settings → Account → Delete account → confirm.
- Edge Function `delete-account`: soft-delete `profiles.deleted_at` immediately,
  hard purge after 30 days. Anonymise ratings rather than deleting them (the
  elevator's score history survives, authorship does not).
- Google Play also requires a **publicly reachable web deletion URL** — build
  `/delete-account` on the marketing site.

## Sign in with Apple

If you offer Google, Facebook, or any third-party login, **Sign in with Apple is
mandatory on iOS**. Cheapest path: launch with email magic-link + Apple only, add
Google later if you want it. Supabase Auth supports all three.

## Permissions and purpose strings

Purpose strings must say what the *user* gets, not what you collect. Vague strings
get rejected.

```
NSLocationWhenInUseUsageDescription
  "ElaRater uses your location to find elevators in the building you're standing in."
NSCameraUsageDescription
  "Take a photo of the elevator you're inspecting to attach to your certificate."
NSPhotoLibraryAddUsageDescription
  "Save your certificate to your photo library."
```

Android: `ACCESS_COARSE_LOCATION` is enough — do **not** request `ACCESS_FINE_LOCATION`
unless a feature genuinely needs it, and never request background location. Fine
location triggers extra Play review; you don't need metre accuracy to identify a building.

## Privacy declarations

- **iOS**: `PrivacyInfo.xcprivacy` declaring collected data types (coarse location,
  user content, identifiers) and required-reason API usage. Ship it via the Expo config
  plugin. Missing manifests are auto-rejected at upload.
- **Play**: Data Safety form. Must match what the app actually does — mismatches get
  caught and are painful to unwind.
- Both stores need a hosted privacy policy URL and terms URL before submission.

## Age rating

Rate **12+ / Teen** because of unmoderated-at-write UGC. Rating 4+ with UGC is a
rejection. Set it correctly the first time; changing it later resets review.

## Minimum functionality (Apple 4.2)

A rating app risks reading as "just a form". Defend with:
- Real GPS-based nearby discovery (not a search box)
- Camera capture
- The certificate as a genuine generated artifact
- Offline rating queue

The web export existing does not hurt, but the iOS build must not look like a wrapped
website. Native navigation, native share sheet, native camera.

## Pre-submission checklist

- [ ] Report, block, and terms-gate all shipped and reachable in ≤2 taps
- [ ] In-app account deletion works end to end; web deletion URL live
- [ ] Sign in with Apple present if any third-party login is offered
- [ ] Purpose strings phrased as user benefit
- [ ] `PrivacyInfo.xcprivacy` present; Play Data Safety form matches reality
- [ ] Age rating 12+ / Teen
- [ ] Privacy policy + terms URLs live on the marketing site
- [ ] Support email published in app, on both listings, and on the site
- [ ] Adaptive icon renders correctly in circle, squircle, and rounded-square masks
- [ ] No placeholder or lorem content anywhere in the review build
- [ ] Demo account credentials supplied in App Store Connect review notes
- [ ] Moderation SLA documented and answerable if review asks
