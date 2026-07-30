# PMG Embedded — email setup manual (Migadu)

Step-by-step guide to run `@pmgembedded.com` email on **Migadu Micro**
($19/year, whole team). This fixes the v1 spam/reply problems because outgoing
mail is now signed for our own domain (SPF + DKIM + DMARC all pass).

DNS for `pmgembedded.com` is managed in **Cloudflare**, so all DNS records below
are added in the Cloudflare dashboard. Mailboxes and their passwords are managed
in the **Migadu** admin.

---

## Is this the right, normal way to do it?

Yes. Pointing a domain's **MX records** at a dedicated mailbox provider and
signing outbound mail with **DKIM** is the standard way business email works —
Google Workspace, Fastmail, and Microsoft 365 all do the same thing internally.
Migadu is an established Swiss email host. Nothing here is a workaround.

What makes mail land in the inbox is **authentication**, not price:

- **SPF** — DNS record listing which servers may send for our domain.
- **DKIM** — Migadu cryptographically signs each outgoing message as
  `pmgembedded.com`.
- **DMARC** — tells receivers "if SPF/DKIM don't line up with the From address,
  treat it as suspicious," and gives us reports.

With all three passing, low volume (~10 mails/month), and real two-way
conversations, inbox placement is the normal outcome and people can reply
straight back to us.

**Micro plan limits (confirm they fit us):** unlimited addresses, 5 GB shared
storage, **20 outgoing / 200 incoming messages per day**. Fine for our usage.
This is *not* a bulk/marketing-blast tool — it's for targeted, human email,
which is exactly our case. Full detail on how these limits work is in the
[Sending & receiving limits](#sending--receiving-limits) section below.

---

## Sending & receiving limits

**The most important thing to understand: the limits are per whole account —
the combined total of everyone — NOT per user.**

On the Micro plan:

- **20 outgoing / day** = the sum of everything **all** mailboxes send, added
  together. `danilo@`, `nikola@`, `sladjan@`, `zelimir@`, and `info@` **share
  one pool of ~20 sends per day.** It is *not* 20 each. If Danilo sends 15 and
  Nikola sends 5, the account is at 20 for that day.
- **200 incoming / day** = the sum of everything **all** mailboxes receive, added
  together — again shared across everyone, not 200 each.

Why it's built this way: one Micro subscription ($19/yr) covers unlimited
mailboxes and unlimited domains, so the limits are attached to the *account*
(the thing you pay for), not to individual mailboxes.

### Is that enough for us?

Yes, comfortably. We send roughly **10 emails per month** — the Micro plan
allows about **20 per day**, i.e. ~600/month across the whole team. We use a
small fraction. Incoming 200/day is likewise far above our normal traffic.

### It's a soft limit, not a hard wall

Migadu allows **~25% tolerance** over the number (so roughly 25 sends before any
enforcement) and warns you first. Only if you keep going past the tolerance does
it start **rejecting outgoing / deferring incoming** — it does not ban or delete
anything. For our usage we will not reach it.

### If we ever need more — just upgrade the plan

Same account, same addresses, same DNS. No migration, no reconfiguration — only
a plan switch in the Migadu admin (prorated, up or down anytime). Higher tiers
are still **flat price for the whole team**, never per user:

| Plan | Price / year | Outgoing / day (whole account) | Incoming / day (whole account) |
|------|--------------|--------------------------------|--------------------------------|
| **Micro** (ours) | $19 | 20 | 200 |
| Mini | $90 | 100 | 1,000 |
| Standard | $290 | 500 | 3,000 |
| Maxi | $990 | 2,000 | 10,000 |

Start on Micro; only bump to Mini if we ever actually hit the ceiling.

### Important: this is for human email, not bulk campaigns

These limits assume normal person-to-person email. If we ever do real marketing
blasts (hundreds of recipients at once), **do not** just scale Migadu up for it —
use a dedicated bulk sender (Brevo, Mailchimp, Amazon SES) on a **separate
subdomain** (e.g. `news.pmgembedded.com`) so the blast reputation can't damage
inbox placement of our normal `@pmgembedded.com` mail. For our described usage
(~10 targeted mails/month), Micro is plenty and this doesn't apply.

---

## Overview of the steps

1. Create the Migadu account (Micro plan).
2. Add the `pmgembedded.com` domain in Migadu.
3. Add the DNS records Migadu gives you into Cloudflare.
4. Create each person's mailbox.
5. Turn off the old Cloudflare Email Routing rules.
6. Connect each mailbox in the Gmail app (or webmail).
7. Test that SPF/DKIM/DMARC pass.

Do steps 1–5 once (whoever manages the domain). Steps 6 is done by each person.

---

## Step 1 — Create the account

1. Go to **migadu.com** → **Sign up**.
2. Choose the **Micro** plan — **$19/year** (billed yearly; there is no monthly
   option on Micro). Unlimited mailboxes and domains are included, so this one
   subscription covers the whole team.

---

## Step 2 — Add the domain

1. In the Migadu admin: **Email Domains** → **Add Domain**.
2. Enter `pmgembedded.com`.
3. Migadu now shows a **DNS Configuration** page with the exact records to add.
   **Copy the values from your own account** — the DKIM records are unique per
   domain. The values below are the correct *shape*; match them against what
   Migadu shows and use Migadu's if anything differs.

---

## Step 3 — Add DNS records in Cloudflare

Open **Cloudflare → pmgembedded.com → DNS → Records**.

> **Critical Cloudflare setting:** every mail record must be **DNS only**
> (grey cloud, *not* the orange proxied cloud). Proxying breaks mail. MX and TXT
> records are always grey; for the DKIM CNAMEs you must click to make them grey.

### Step 3a — Delete the old email records first

The domain still has records from the old Cloudflare Email Routing setup. Delete
**only** these five — they are being replaced by Migadu:

| Delete | Type | Value |
|--------|------|-------|
| ✅ | MX | `route1.mx.cloudflare.net` |
| ✅ | MX | `route2.mx.cloudflare.net` |
| ✅ | MX | `route3.mx.cloudflare.net` |
| ✅ | TXT | `cf2024-1._domainkey…` (Cloudflare email DKIM) |
| ✅ | TXT | `v=spf1 include:_spf.mx.cloudflare.net ~all` (old SPF) |

**Keep everything else** — these run the website, do NOT touch them:

| Keep | Type | Value |
|------|------|-------|
| ✅ | A ×4 | `185.199.108–111.153` (GitHub Pages) |
| ✅ | CNAME | `www` → `pmgembedded.github.io` |

Then go to **Cloudflare → Email → Email Routing** and **disable** it, so it
doesn't re-create its own MX/DKIM records.

### Step 3b — Add the Migadu records

#### Domain verification — TXT

| Type | Name | Content |
|------|------|---------|
| TXT | `@` | `hosted-email-verify=qxummtlw` |

> Keep this record permanently — Migadu uses it to prove we own the domain.
> Copy the exact value from your Migadu DNS Configuration page.

#### MX (receive mail)

| Type | Name | Mail server / Target | Priority |
|------|------|----------------------|----------|
| MX | `pmgembedded.com` (or `@`) | `aspmx1.migadu.com` | `10` |
| MX | `pmgembedded.com` (or `@`) | `aspmx2.migadu.com` | `20` |

#### SPF (authorize sender) — TXT

| Type | Name | Content |
|------|------|---------|
| TXT | `pmgembedded.com` (or `@`) | `v=spf1 include:spf.migadu.com -all` |

> Use Migadu's `-all` (hard fail). Only **one** SPF (`v=spf1 …`) record may exist
> on the root — you deleted the old Cloudflare one in Step 3a, so there's no
> conflict. Never keep two.

### DKIM (sign outgoing mail) — 3 CNAME records

| Type | Name | Target |
|------|------|--------|
| CNAME | `key1._domainkey` | `key1.pmgembedded.com._domainkey.migadu.com` |
| CNAME | `key2._domainkey` | `key2.pmgembedded.com._domainkey.migadu.com` |
| CNAME | `key3._domainkey` | `key3.pmgembedded.com._domainkey.migadu.com` |

> In Cloudflare, enter the Name as `key1._domainkey` (Cloudflare appends the
> domain automatically). Set each to **DNS only / grey cloud**.

### DMARC (policy + reports) — TXT

| Type | Name | Content |
|------|------|---------|
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:danilo@pmgembedded.com` |

> Optional gentler start: use `p=none` for the first week to just collect
> reports without affecting delivery, then change to `p=quarantine`. Either is
> fine for us.

### Verify

Back in Migadu: **Email Domains → pmgembedded.com → DNS Configuration →
Diagnostics**. It turns each record green once DNS has propagated (usually
minutes, up to ~1 hour). Don't move on until MX, SPF, and DKIM are green.

---

## Step 4 — Create mailboxes

In Migadu: **Mailboxes → New Mailbox**. Create one per person and set a strong
password for each (store in a password manager):

| Address | For |
|---------|-----|
| `danilo@pmgembedded.com` | Danilo |
| `nikola@pmgembedded.com` | Nikola |
| `sladjan@pmgembedded.com` | Sladjan |
| `zelimir@pmgembedded.com` | Zelimir |

For `info@pmgembedded.com`, don't make a whole mailbox — add it as an **alias**
that forwards to whoever should read it: **Aliases → New Alias** →
`info@pmgembedded.com` → destination e.g. `danilo@pmgembedded.com`. (Aliases are
free and unlimited.)

---

## Step 5 — Turn off the old Cloudflare Email Routing

The new Migadu MX records replace Cloudflare's forwarding. Leaving both on makes
them fight over inbound mail.

1. Cloudflare → **Email** → **Email Routing**.
2. Disable the custom-address routing rules (or disable Email Routing entirely).
3. Confirm the **MX records now point to Migadu** (`aspmx1/aspmx2.migadu.com`),
   not to Cloudflare's `route*.mx.cloudflare.net`. If Cloudflare left its own MX
   records behind, delete them so only Migadu's remain.

---

## Step 6 — Connect the mailbox (each person)

You access the mailbox **directly over IMAP** — a mail app on the phone and
`webmail.migadu.com` on the desktop. Both talk to the same Migadu mailbox, so
read/unread, folders, and sent mail stay in sync between them. Company mail lives
in its own account, cleanly separate from personal Gmail.

Everything you send goes through Migadu's SMTP, so it is DKIM-signed and passes
SPF/DKIM/DMARC — **not spam, and clients can reply straight back.** That is true
in every app below; the app choice only affects how fast notifications arrive.

**Server settings — same for every app and every person** (only the
address/password change):

| Purpose | Server | Port | Security | Username | Password |
|---------|--------|------|----------|----------|----------|
| Incoming (IMAP) | `imap.migadu.com` | `993` | SSL/TLS | full address, e.g. `danilo@pmgembedded.com` | mailbox password |
| Outgoing (SMTP) | `smtp.migadu.com` | `465` | SSL/TLS | full address | mailbox password |

> Username is always the **full email address**. Password is the **mailbox
> password** from the Migadu admin — *not* any Gmail password. If port 465 is ever
> blocked on a network, use `587` (STARTTLS).

---

### Desktop — Migadu webmail (no setup)

Open **`webmail.migadu.com`** and log in with the full address + mailbox password.
Full send / receive / reply / folders / search / signatures. Nothing to configure.

---

### Phone — add the mailbox to a mail app

Add `danilo@pmgembedded.com` as an **IMAP account** using the server settings
above. **How instant the notifications are depends on the app:**

| App | Notifications | Notes |
|-----|---------------|-------|
| **Gmail app** (what we use now) | ~15-min poll, not instant | Works fine for sending/receiving/replying; just not real-time. Add via **Other (IMAP)**, not "Google". |
| **Apple Mail** (iPhone) | **Instant push** | Native IMAP IDLE. Best option on iPhone. |
| **FairEmail / BlueMail** (Android) | **Instant push** | Dedicated IMAP clients with true push. |
| **Samsung Email** (Android) | **Instant push** | Built into Samsung phones, supports push. |

> **Why the Gmail app is ~15 min:** Gmail only does *true* push for Google
> accounts. For an outside mailbox it just polls on a schedule. If real-time
> notifications matter, use one of the push apps above instead. Same server
> settings, same mailbox — only the notification speed differs.

**For now (Gmail app):**

1. Gmail app → tap your **avatar** (top right) → **Add another account**.
2. Choose **Other (IMAP)** — *not* Google.
3. Enter `danilo@pmgembedded.com` → **Next** → **Personal (IMAP)** / Manual setup.
4. Password = the **mailbox password**.
5. Incoming: `imap.migadu.com`, `993`, SSL/TLS, username = full address.
6. Outgoing: `smtp.migadu.com`, `465`, SSL/TLS, username = full address.
7. Finish → allow notifications.

**Later, for instant push** (Apple Mail / FairEmail / Samsung Email): add a new
account of type **Other / IMAP** and enter the exact same server settings from
the table above. No change on Migadu's side — just point the new app at the same
mailbox.

---

### How it works day to day

1. Client emails `danilo@pmgembedded.com` → lands in the mailbox → your phone app
   notifies you (instant on a push app, up to ~15 min on the Gmail app).
2. Open it, hit **Reply** — right on that message, phone or webmail.
3. It sends through Migadu → DKIM-signed → the client receives it normally and can
   reply straight back.

- **Pros:** company mail in its own account (clean separation); works on phone and
  desktop, in sync; full deliverability; instant push available via Apple Mail /
  FairEmail / Samsung Email.
- **Cons:** the **Gmail app** polls (~15 min) rather than pushing — switch to a
  push app when real-time matters; webmail UI is plainer than Gmail.

---

## Step 7 — Test deliverability (do this before going live)

1. **mail-tester.com** — open it, copy the address it shows, send a message to
   that address from your `@pmgembedded.com` account, then refresh for the score.
   Aim for **10/10**; it flags any failing SPF/DKIM/DMARC.
2. **Gmail "Show original"** — send a test to a personal Gmail, open it, click
   ⋮ → **Show original**. You should see:
   ```
   SPF:   PASS
   DKIM:  PASS   (signed by: pmgembedded.com)
   DMARC: PASS
   ```
3. Send one test to an **Outlook/Hotmail** address too (strictest common filter).
4. **Reply test** — have someone reply to your message and confirm it arrives in
   the Migadu mailbox. This proves two-way conversation works.

All three PASS + reply arrives = setup is correct and safe to roll out to the team.

---

## Quick reference

| Item | Value |
|------|-------|
| Provider / plan | Migadu, Micro — $19/year (whole team) |
| MX | `aspmx1.migadu.com` (10), `aspmx2.migadu.com` (20) |
| SPF | `v=spf1 include:spf.migadu.com -all` |
| DKIM | 3 CNAMEs `key1/2/3._domainkey` → `keyN.pmgembedded.com._domainkey.migadu.com` |
| DMARC | `_dmarc` TXT `v=DMARC1; p=quarantine; rua=mailto:danilo@pmgembedded.com` |
| IMAP | `imap.migadu.com` : 993 SSL |
| SMTP | `smtp.migadu.com` : 465 SSL (or 587 STARTTLS) |
| Webmail | `webmail.migadu.com` |
| Limits | 20 sent/day, 200 received/day, 5 GB shared |
| Diagnostics | Migadu → Email Domains → pmgembedded.com → DNS Configuration |

> Always copy the actual DKIM/MX values from your own Migadu admin — the format
> above is correct, but Migadu's diagnostics page is the source of truth.

---

## Sources

- [Migadu pricing (Micro $19/yr, 20 out/200 in per day)](https://www.migadu.com/pricing/)
- [Migadu DNS records — DKIM CNAME / SPF / DMARC format](https://www.migadu.com/)
- [Migadu setup walkthrough](https://blog.sombex.com/2019/11/setup-free-email-hosting-with-migadu-zoho-alternative.html)

