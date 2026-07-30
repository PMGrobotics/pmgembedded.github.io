# PMG Embedded — company email setup (v2)

This replaces the v1 setup (Cloudflare Email Routing + Gmail "Send mail as").
v1 delivered mail to spam and was hard to reply from. This document explains
**why**, and gives two better setups — one free, one ~$19/year — that fix
deliverability properly.

> TL;DR — pick one:
> - **Recommended:** Migadu Micro, **$19/year flat for the whole team**. Real
>   mailboxes with proper domain signing, usable inside the Gmail app.
> - **Free:** Zoho Mail Forever Free, **$0**, up to 5 users. Same deliverability,
>   but you must use Zoho's own web/mobile app (no Gmail client, no IMAP).

---

## 1. Why the old setup landed in spam

The v1 flow was: receive via Cloudflare Email Routing (forward to personal
Gmail), then send using Gmail's **"Send mail as"** through personal Gmail SMTP,
with the `From:` address set to `name@pmgembedded.com`.

Modern mail providers (Gmail, Outlook, corporate filters) decide spam vs. inbox
mostly on **three authentication checks**, all tied to the domain in the
`From:` address:

| Check | What it proves | v1 result |
|-------|----------------|-----------|
| **SPF** | The sending server is allowed to send for this domain | ❌ Gmail's servers are authorized for `gmail.com`, not `pmgembedded.com` |
| **DKIM** | The message is cryptographically signed by the domain | ❌ Gmail signs as `gmail.com`; `pmgembedded.com` never signs |
| **DMARC** | SPF **or** DKIM must *align* with the `From:` domain | ❌ Neither aligns → DMARC fails |

Because the mail says it's from `pmgembedded.com` but **nothing proves it**, and
`pmgembedded.com` likely had no SPF/DMARC records at all, filters treat it as
possible spoofing → spam / trash / "bulk". This is a design flaw of the
send-as-through-Gmail approach; it cannot be fully fixed while sending happens
through a personal Gmail account.

Cloudflare Email Routing is **receive-only forwarding**. It never helped with
sending, and forwarding can itself break SPF, adding to the problem.

**The "people can't email us / invalid address" issue** is separate: it's an
inbound/MX or routing-rule problem. A real mailbox host (below) fixes this too,
because the MX records then point to a proper mailbox instead of a forward rule.

**The fix in one line:** host the mailboxes on a provider that lets
`pmgembedded.com` **sign its own outgoing mail (DKIM)** and publish **SPF +
DMARC** records. Then every message is provably from you → inbox.

---

## 2. Option A (recommended) — Migadu Micro, $19/year flat

Why this one:
- **Flat $19/year for the entire team** — not per user. Unlimited mailboxes and
  unlimited domains on the account. For 4–5 people this is far cheaper than
  $6/user/month Google Workspace (~$360/yr).
- **Full IMAP/POP/SMTP** → you can keep using the **Gmail app** (or Apple Mail,
  Outlook, Thunderbird) as the client. See Section 4.
- Proper DKIM signing for `pmgembedded.com` + you publish SPF/DMARC → inbox.
- Sending limit **20 emails/day**, 200 incoming/day, 5 GB shared storage. Fine
  for ~10 marketing/outreach mails a month.

### Steps

1. **Sign up** at `migadu.com` → choose the **Micro** plan ($19/year).
2. **Add the domain** `pmgembedded.com` in the Migadu admin.
3. **Create mailboxes**: `danilo@`, `nikola@`, `sladjan@`, `zelimir@`, and either
   a mailbox or an alias for `info@` (an alias forwarding to one person is fine).
4. **Publish DNS records.** Since Cloudflare manages `pmgembedded.com` DNS, do
   this in the **Cloudflare dashboard → DNS → Records**. Migadu shows you the
   exact values; they look like this (copy the real ones from Migadu):

   | Type | Name | Value / Target | Notes |
   |------|------|----------------|-------|
   | MX | `pmgembedded.com` | `aspmx1.migadu.com` (priority 10) | receive mail |
   | MX | `pmgembedded.com` | `aspmx2.migadu.com` (priority 20) | backup |
   | TXT (SPF) | `pmgembedded.com` | `v=spf1 include:spf.migadu.com -all` | authorize sender |
   | CNAME | `key1._domainkey` | `key1.pmgembedded.com._domainkey.migadu.com` | DKIM |
   | CNAME | `key2._domainkey` | `key2.pmgembedded.com._domainkey.migadu.com` | DKIM |
   | CNAME | `key3._domainkey` | `key3.pmgembedded.com._domainkey.migadu.com` | DKIM |
   | TXT (DMARC) | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:danilo@pmgembedded.com` | policy + reports |

   > **Important:** In Cloudflare, set the DKIM/MX records to **DNS only**
   > (grey cloud, *not* proxied/orange). Proxying breaks mail records.

5. **Turn OFF the old Cloudflare Email Routing** rules — the new MX records
   replace them. Having both fights over inbound mail.
6. Wait for DNS to propagate (minutes to ~1 hour). Migadu's admin shows a green
   check when each record is verified.
7. **Test deliverability** — see Section 5.

---

## 3. Option B (free) — Zoho Mail Forever Free, $0

Why this one:
- **Free** for up to **5 users**, 5 GB each, custom domain, ad-free.
- Proper DKIM/SPF/DMARC → good inbox placement, same as paid tiers.

Trade-offs (know before choosing):
- **No IMAP/POP/SMTP on the free plan** → you **cannot** use the Gmail app or
  Apple Mail. You must use **Zoho's own webmail and mobile app**. This is the
  main reason to prefer Migadu if everyone lives in Gmail.
- Single domain, 25 MB attachment limit, 5 users max (you have ~5 addresses, so
  make `info@` an alias rather than its own user).
- If you later want IMAP/SMTP back on Zoho, the **Mail Lite** plan is ~$1/user/mo.

### Steps

1. Sign up at `zoho.com/mail` → choose the **Forever Free** plan (scroll down;
   it's below the paid tiers). Free plan availability varies by region.
2. **Add and verify** the domain `pmgembedded.com` (Zoho gives a TXT record to
   add in Cloudflare DNS to prove ownership).
3. **Create users**: `danilo@`, `nikola@`, `sladjan@`, `zelimir@`. Add `info@`
   as an **alias** on one of those users (aliases don't count as users).
4. **Publish DNS records** in Cloudflare DNS (Zoho shows the exact values):

   | Type | Name | Value | Notes |
   |------|------|-------|-------|
   | MX | `pmgembedded.com` | `mx.zoho.com` (priority 10) | receive |
   | MX | `pmgembedded.com` | `mx2.zoho.com` (priority 20) | backup |
   | MX | `pmgembedded.com` | `mx3.zoho.com` (priority 50) | backup |
   | TXT (SPF) | `pmgembedded.com` | `v=spf1 include:zoho.com -all` | authorize sender |
   | TXT (DKIM) | `zmail._domainkey` | *(long key Zoho generates)* | signing |
   | TXT (DMARC) | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:danilo@pmgembedded.com` | policy |

   Set these **DNS only** (grey cloud) in Cloudflare. Enable DKIM in the Zoho
   admin **after** the TXT record is live.
5. **Turn OFF the old Cloudflare Email Routing** rules — the Zoho MX records
   replace them.
6. **Test deliverability** — see Section 5.

---

## 4. Keeping the Gmail app as your client (Migadu / any IMAP host)

Only possible on Option A (Migadu) or a paid IMAP-capable plan — **not** Zoho
Free. Two ways:

**Best — add the account to the Gmail mobile app / Apple Mail as IMAP:**
- Incoming: IMAP `imap.migadu.com`, port `993`, SSL. Username = full address
  `danilo@pmgembedded.com`, password = the mailbox password.
- Outgoing: SMTP `smtp.migadu.com`, port `465` (SSL) or `587` (STARTTLS), same
  username/password.
- This sends **through Migadu**, so DKIM/SPF/DMARC all align → inbox. Replies
  come straight back to your `@pmgembedded.com` mailbox.

**In Gmail on the web** (`gmail.com`), if you want everything in one inbox:
- Settings → Accounts and Import → **Check mail from other accounts** (POP) to
  pull messages in, and **Send mail as** using the **Migadu SMTP** server above
  (`smtp.migadu.com`, *not* Gmail's SMTP). Using Migadu's SMTP is what makes the
  difference vs. v1 — the mail is signed for `pmgembedded.com`.

---

## 5. Testing that it actually works (do this every time)

1. **mail-tester.com**: open it, copy the address it shows, send a mail to it
   from your new `@pmgembedded.com` account, then check the score. Aim for
   **10/10**; it lists any failing SPF/DKIM/DMARC.
2. **Gmail "Show original"**: send a mail to a personal Gmail, open it, click
   ⋮ → **Show original**. You want:
   ```
   SPF:   PASS
   DKIM:  PASS   (signed by: pmgembedded.com)
   DMARC: PASS
   ```
   All three PASS = you will land in the inbox and replies work normally.
3. Send a test to an Outlook/Hotmail address too — it's the strictest common
   filter.

---

## 6. Recommendation

- Want **zero cost** and everyone is OK using a separate Zoho app for company
  mail → **Option B (Zoho Free)**.
- Want to **keep using the Gmail app** and don't mind **$19/year for the whole
  team** → **Option A (Migadu)**. This is the better day-to-day experience and
  the recommended choice.

Either way, the thing that fixes your spam/reply problems is the same: mail is
now **sent through a server that signs for `pmgembedded.com`**, with **SPF, DKIM,
and DMARC all passing**. Verify with Section 5 before telling the team it's live.

---

## Sources

- [Zoho Mail free plan limitations (2026)](https://mail.mailbux.com/blog/email-comparisons/zoho-mail-free-plan-limitations-alternative)
- [Zoho Mail pricing / editions](https://www.zoho.com/mail/zohomail-pricing.html)
- [Migadu pricing & plans](https://www.migadu.com/)
- [Migadu vs mailbox.org comparison (2026)](https://forwardemail.net/en/blog/migadu-vs-mailbox-org-email-service-comparison)
- [Cheapest email hosting services (2026)](https://www.hostingadvice.com/how-to/cheapest-email-hosting-services/)
