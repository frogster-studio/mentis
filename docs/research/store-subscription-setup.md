# Store subscription setup: zero → purchasable 2,99 €/month

Resolves [#40](https://github.com/frogster-studio/mentis/issues/40). Starting state, 2026-08-21 —
Apple: individual Apple Developer Program membership active (Frogster Studio, French
micro-entreprise), Paid Applications agreement not signed, no banking/tax on file. Google: no Play
Console account. Every source below is a primary Apple/Google page, **all accessed 2026-08-21**.

## Apple — from member to sandbox-purchasable subscription

Feeds [#41](https://github.com/frogster-studio/mentis/issues/41) (steps 1–4) and
[#43](https://github.com/frogster-studio/mentis/issues/43) (steps 5–12).

1. **Sign the Paid Applications agreement.** App Store Connect → **Business** → **Agreements** tab →
   *Paid Apps* row → **View and Agree to Terms** (expect a 2FA prompt; accepting is irreversible).
   Account Holder only — on an individual membership that is Hugo. Why: tax forms can only be filed
   after it is signed, so it heads the whole money chain.
   ([Sign and update agreements](https://developer.apple.com/help/app-store-connect/manage-agreements/sign-and-update-agreements/))
2. **File the US tax form (W-8BEN).** Business → Agreements → **Tax Forms** → **Add Tax Info**. "All
   developers must complete a US tax form"; non-US accounts answer a question interview that routes
   a French individual to the electronic W-8BEN (certificate of foreign status). No French-domestic
   form exists in the console; the interview lists any extra country-specific forms it wants. Why:
   "You must submit all required tax forms … in order for us to process banking information."
   Gotcha: once submitted, the form can't be edited in App Store Connect — corrections go through
   Apple support.
   ([Provide tax information](https://developer.apple.com/help/app-store-connect/manage-tax-information/provide-tax-information/))
3. **Add the bank account (French IBAN).** Business → Agreements → **Bank Accounts** → **Add Bank
   Account**: bank country France, account currency EUR, account number + IBAN, account holder name
   and address of the enrolled individual. Added by the Account Holder it goes straight in; entered
   by an Admin/Finance user it waits for Account Holder approval, then processes within 24 h.
   ([Enter banking information](https://developer.apple.com/help/app-store-connect/manage-banking-information/enter-banking-information/))
4. **Wait for the agreement to flip Active.** Status walks *Pending User Info → Processing →
   (Verifying) → Active*; Apple publishes no SLA for the walk — plan days, poll the Agreements tab.
   Gate: "The agreement must be Active to test In-App Purchases in the sandbox environment", and
   Active to submit paid apps or In-App Purchases at all. **Done-check for #41.**
   ([View agreements status](https://developer.apple.com/help/app-store-connect/manage-agreements/view-agreements-status/),
   [Overview for configuring In-App Purchases](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases/))
5. **Register the explicit App ID.** developer.apple.com → Certificates, Identifiers & Profiles →
   Identifiers → **+**, explicit bundle id from `app.config.ts`. In-App Purchase capability is
   enabled by default on explicit App IDs. Why: the New App dialog consumes a registered bundle ID
   (EAS would register it at first build; doing it by hand removes the ordering surprise).
   ([Register an App ID](https://developer.apple.com/help/account/identifiers/register-an-app-id/))
6. **Create the app record.** App Store Connect → Apps → **+** → **New App**: platform iOS, app
   name, primary language, bundle ID, SKU. Needs the latest *membership* agreement signed — not the
   Paid Apps one — and no build; the record lands in *Prepare for Submission*. Steps 5–11 therefore
   run in parallel with the 1–4 chain.
   ([Add a new app](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/))
7. **Create the subscription group.** App page → **Monetization** → **Subscriptions** → **+** →
   reference name. Users hold one subscription per group; one group is all Mentis needs.
   ([Offer auto-renewable subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/))
8. **Create the auto-renewable subscription.** In the group: reference name + **product ID**
   (immutable, ships into the app code), duration **1 month**. Same source as step 7.
9. **Price it 2,99 € and set availability.** Subscription Prices → **Add Subscription Price** →
   country France → 2,99 € (one of 800 price points per currency); App Store Connect then generates
   comparable prices for all 175 storefronts, which you can accept as-is. Pick availability
   countries under Availability.
   ([Manage pricing for auto-renewable subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-pricing-for-auto-renewable-subscriptions/))
10. **Add one localization.** Display name + description. Why: the sandbox minimum is "a product
    reference name, product ID, a localized name, and a price" — no review, no screenshot, no
    submission needed for sandbox.
    ([Testing In-App Purchases with sandbox](https://developer.apple.com/documentation/storekit/testing-in-app-purchases-with-sandbox))
11. **Create a sandbox tester.** App Store Connect → **Users and Access** → **Sandbox** → **+**.
    The email must never have been an Apple Account; name/email/password are frozen after creation;
    the account is pinned to one storefront — make it France to see 2,99 €.
    ([Create a Sandbox Apple Account](https://developer.apple.com/help/app-store-connect/test-in-app-purchases/create-a-sandbox-apple-account/),
    [Manage Sandbox Apple Account settings](https://developer.apple.com/help/app-store-connect/test-in-app-purchases/manage-sandbox-apple-account-settings/))
12. **Buy it in sandbox.** Development-signed build on a device (Expo: `expo run:ios` / EAS
    development profile; Developer Mode on) — "you don't need to upload your app binary to App Store
    Connect to test it in the sandbox environment". Sign in with the sandbox account when the
    purchase sheet asks. Sandbox monthly renews every 5 minutes by default and auto-renews 12 times
    before switching off; tester purchase history is clearable for re-runs. **Done-check for #43**:
    the StoreKit/RevenueCat fetch returns the product and a sandbox purchase completes.
    (Same StoreKit source as step 10, plus
    [Manage Sandbox Apple Account settings](https://developer.apple.com/help/app-store-connect/test-in-app-purchases/manage-sandbox-apple-account-settings/))
13. **Build the paywall to App Review spec — later, but right the first time.** The first
    auto-renewable subscription (and its group) must be submitted with a **new app version**. The
    sign-up screen must show the subscription name and duration, what it provides, and the **full
    renewal price as the most prominent price element**, plus "a way for current subscribers to sign
    in or restore purchases"; the app **and** its App Store metadata must carry functional Terms of
    Use and privacy policy links. Guidelines: 3.1.2(a) ongoing value, ≥7-day period, available on
    all the user's devices; 3.1.1 restore mechanism for restorable purchases; 3.1.2(c) describe
    what the user gets for the price.
    ([Auto-renewable subscriptions page](https://developer.apple.com/app-store/subscriptions/),
    [App Review Guidelines §3.1](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase),
    [Offer auto-renewable subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/))

**Gates:** 1 → 2 → 3 → 4; 5 → 6 → 7 → 8 → 9–10 run parallel to it; 11 anytime. Sandbox purchase
(12) = 4 ∧ 10 ∧ 11. Step 13 gates only the eventual store release, not sandbox.

## Google — from nothing to license-tester-purchasable subscription

Feeds [#42](https://github.com/frogster-studio/mentis/issues/42) (steps 1–4) and
[#44](https://github.com/frogster-studio/mentis/issues/44) (steps 5–8).

1. **Pick the account type — the first real decision.** *Personal*: registers today, but personal
   accounts created after 2023-11-13 must run a **closed test with ≥12 testers opted in
   continuously for 14 days** before they may apply for production access (internal testing does
   not count). *Organization*: exempt from that rule, but "you will not be able to create a
   developer account for an organization without" a **D-U-N-S number** — up to 30 days to obtain
   (a micro-entreprise has a SIREN, so it can get one). The 12/14 rule gates going **live** only;
   license-tester purchases in a closed track work without it, so personal + starting the closed
   test early is the fast path, organization the patient one.
   ([App testing requirements for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465),
   [Required information for a developer account](https://support.google.com/googleplay/android-developer/answer/13628312))
2. **Register the developer account.** play.google.com/console signup with a Google Account, accept
   the Developer Distribution Agreement, pay the **US$25 one-time fee** (credit/debit card, no
   prepaid).
   ([Get started with Play Console](https://support.google.com/googleplay/android-developer/answer/6112435))
3. **Verify identity — the long pole, start the same day.** Legal name and address come from the
   Google Payments profile linked at creation; expect an official government ID under that name,
   email + phone OTP codes, and — new personal accounts — proof of access to a real Android device
   via the Play Console app. Google states no completion SLA (you're emailed when it's done);
   payment-method verification alone "can take up to 5 days". **Verification gates publishing
   anything**, so everything downstream queues behind it.
   ([Verify your developer identity information](https://support.google.com/googleplay/android-developer/answer/10841920),
   [Required information for a developer account](https://support.google.com/googleplay/android-developer/answer/13628312))
4. **Create the payments profile.** Play Console → Settings → **Payments profile** → *Create
   payments profile*: legal name, physical address (no PO box), support email, the label for card
   statements. France is a supported merchant-registration country (EUR). The business location
   country is immutable afterwards. Why: no paid products of any kind without it. **Done-check for
   #42.**
   ([Create a payments profile](https://support.google.com/googleplay/android-developer/answer/7161426),
   [Supported locations for merchant registration](https://support.google.com/googleplay/android-developer/table/3539140))
5. **Create the app and put a billing-capable build on a track.** Create the app record (package
   name from `app.config.ts`), upload an AAB whose manifest declares `com.android.vending.BILLING`
   (react-native-purchases brings it in) to **internal testing** first: live "within minutes", ≤100
   testers, and internal tests "might not be subject to standard Play policy or security reviews".
   The first test link can take several hours; the opt-in link only appears once the release status
   is Published. Open the **closed track** as soon as the 12 testers exist — closed releases go
   through review (up to 7 days or longer for some accounts) and its 14-day clock only runs while
   testers stay opted in. Why: license testing requires the app "published to the open, closed,
   internal test, or production track".
   ([Set up an open, closed, or internal test](https://support.google.com/googleplay/android-developer/answer/9845334),
   [Create an in-app product](https://support.google.com/googleplay/android-developer/answer/1153481),
   [Test in-app billing with application licensing](https://support.google.com/googleplay/android-developer/answer/6062777),
   [Publish your app](https://support.google.com/googleplay/android-developer/answer/9859751))
6. **Create the subscription and its base plan, then activate.** **Monetize with Play → Products →
   Subscriptions** → Create: product ID (≤40 chars, starts with a number or lowercase letter — it
   ships into the app code), name ≤55 chars. **Add base plan**: auto-renewing, **monthly** billing
   period, price **2,99 €** (regional prices are converted automatically), Save → **Activate**.
   Why: "Before they can be tested, your one-time products and subscriptions need to be published"
   — i.e. active. Gotcha: once a base plan is activated the subscription can never be deleted.
   ([Create and manage subscriptions](https://support.google.com/googleplay/android-developer/answer/140504),
   [Test in-app billing with application licensing](https://support.google.com/googleplay/android-developer/answer/6062777))
7. **Add license testers.** Play Console (account level) → Settings → **License testing** → email
   list (≤2,000 addresses). License testers "purchase one-time products and subscriptions without
   charging their accounts"; the owner account is always a license tester.
   ([Test in-app billing with application licensing](https://support.google.com/googleplay/android-developer/answer/6062777))
8. **Test the purchase.** The tester opens the track's opt-in link, installs from Play, and the
   purchase sheet offers test payment methods. **Done-check for #44**: a license-tester account
   sees and buys the 2,99 € base plan.
   (Same sources as steps 5 and 7)
9. **Going live, later.** Personal-account path: after 12 testers × 14 continuous days on the
   closed track, apply for **production access** from the dashboard and answer the questionnaire
   about the test, the app, and production readiness.
   ([App testing requirements for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465))

**Gates:** 1 → 2 → 3 (verification gates all publishing) → 5; 4 gates 6; 5 → 6 → 7 → 8; 9 gates
production only.

## Lead times at a glance

| Wait | Duration | Source |
| --- | --- | --- |
| Apple: Paid Apps agreement → Active | no published SLA — plan days | [statuses](https://developer.apple.com/help/app-store-connect/manage-agreements/view-agreements-status/) |
| Apple: bank details after Account Holder approval | ≤ 24 h | [banking](https://developer.apple.com/help/app-store-connect/manage-banking-information/enter-banking-information/) |
| Google: identity verification | no published SLA — email on completion; the long pole | [verify identity](https://support.google.com/googleplay/android-developer/answer/10841920) |
| Google: payment-method verification | ≤ 5 days | [required info](https://support.google.com/googleplay/android-developer/answer/13628312) |
| Google: D-U-N-S number (organization accounts only) | ≤ 30 days | [required info](https://support.google.com/googleplay/android-developer/answer/13628312) |
| Google: first test link on a new track | several hours | [testing tracks](https://support.google.com/googleplay/android-developer/answer/9845334) |
| Google: app review on tracked releases | up to 7 days, sometimes longer | [publish your app](https://support.google.com/googleplay/android-developer/answer/9859751) |
| Google: production gate (personal accounts) | 12 testers × 14 continuous days | [testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465) |
