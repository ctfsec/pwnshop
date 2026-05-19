# Pwnshop

> **Authorized security training use only.**
> This application contains deliberate, known vulnerabilities. Do not deploy it on a public-facing or production server. Keep your repository private or restrict access to trusted participants only.

Pwnshop is an intentionally vulnerable e-commerce platform built for hands-on web application penetration testing training. It covers 51 vulnerabilities mapped to the OWASP Top 10 (2025) and OWASP LLM Top 10 (2025), including SQL injection, stored XSS, SSRF, SSTI leading to RCE, prototype pollution, path traversal, business logic flaws, and AI/LLM-specific attack chains including prompt injection, agent command injection, data poisoning, and model misinformation.

---

<img width="1920" height="1037" alt="image" src="https://github.com/user-attachments/assets/7063ccff-2adb-448d-9f72-28c7a466016d" />

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation - Docker Pull (Fastest)](#installation---docker-pull-fastest)
3. [Installation - Docker Compose Lab Setup (Recommended)](#installation---docker-compose-lab-setup-recommended)
4. [Installation - Without Docker](#installation---without-docker)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Default Accounts](#default-accounts)
7. [Key URLs](#key-urls)
8. [Resetting the Lab](#resetting-the-lab)
9. [Vulnerability Index](#vulnerability-index)
10. [Notable Attack Chains](#notable-attack-chains)
11. [Common Issues](#common-issues)
12. [Tech Stack](#tech-stack)
13. [Project Structure](#project-structure)
14. [Legal Notice](#legal-notice)

---

## Prerequisites

Choose the installation method that suits your setup. Docker is strongly recommended as it handles the database, seed data, and auto-reset automatically.

### With Docker (Recommended)
- Docker v20 or higher
- Docker Compose v2 or higher
- Groq API key - optional, required only for the AI chatbot (free at [console.groq.com](https://console.groq.com))

### Without Docker
- Node.js v18 or higher
- MySQL 5.7 or 8.x running locally
- npm v8 or higher
- Groq API key - optional, required only for the AI chatbot
- Vulnbank merchant credentials - optional, required only to test the wallet top-up and card payment flow in lab mode

---

## Installation - Docker Pull (Fastest)

Use this method if you want to run the application quickly without cloning the repository. You will need a MySQL instance already running and accessible.

**Step 1 - Pull the image:**

```bash
docker pull ghcr.io/ctfsec/pwnshop:latest
```

**Step 2 - Create the database:**

Connect to your MySQL instance and create the database:

```bash
mysql -u root -p -e "CREATE DATABASE pwnshop;"
```

**Step 3 - Import the schema and seed data:**

You need the `pwnshop.sql` file from the repository. Download it from the releases page or clone the repository to get it:

```bash
mysql -u root -p pwnshop < pwnshop.sql
```

**Step 4 - Run the container:**

```bash
docker run -p 3000:3000 \
  -e DB_HOST=your-mysql-host \
  -e DB_USER=root \
  -e DB_PASSWORD=yourpassword \
  -e DB_NAME=pwnshop \
  -e GROQ_API_KEY=your_groq_api_key_here \
  -e SESSION_SECRET=weak-secret-123 \
  -e PORT=3000 \
  ghcr.io/ctfsec/pwnshop:latest
```

Replace `your-mysql-host`, `yourpassword`, and `your_groq_api_key_here` with your actual values. If MySQL is running on the same machine, use `host.docker.internal` as the host on macOS/Windows or the host machine's IP on Linux.

The application will be available at **http://localhost:3000**.

> This method does not include the auto-reset healer or seed image restoration. For the full lab experience, use the Docker Compose method below.

---

## Installation - Docker Compose Lab Setup (Recommended)

This is the recommended method for CTF labs and training sessions. It sets up the application and database together, imports all seed data, copies seed product images, and enables the auto-reset healer.

### Step 1 - Clone the repository

```bash
git clone https://github.com/ctfsec/pwnshop.git
cd pwnshop
```

### Step 2 - Configure the application environment

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and set your values:

```env
# Database Configuration
DB_HOST=db
DB_USER=root
DB_PASSWORD=root
DB_NAME=pwnshop

# AI Chatbot - get a free key at https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# Server
PORT=3000
SESSION_SECRET=weak-secret-123
```

> `SESSION_SECRET` is intentionally weak. It is a training vulnerability (PWN-006). Do not change it unless you want to disable that finding.

### Step 3 - Configure the lab environment

The lab environment file `.env.lab` controls the database password, lab reset token, auto-heal interval, and Vulnbank integration settings.

**Option A - Let the setup script generate it automatically (easiest):**

Skip this step entirely. The `setup-local.sh` script will detect that `.env.lab` is missing and auto-generate it with a cryptographically strong random `DB_PASSWORD` and `LAB_RESET_TOKEN` using `openssl`. It will print the generated values at the end of setup.

**Option B - Create it manually:**

Create a file named `.env.lab` in the project root with the following content:

```env
DB_NAME=pwnshop
DB_PASSWORD=your-strong-password
LAB_RESET_TOKEN=your-strong-token
HEAL_EVERY_MINUTES=10
VULNBANK_BASE_URL=https://vulnbank.org
VULNBANK_AUTH_MODE=api_key_header
VULNBANK_MERCHANT_API_KEY=your-vulnbank-api-key
VULNBANK_MERCHANT_JWT=
VULNBANK_CHARGE_PATH=/api/v1/payments/charge
VULNBANK_VERIFY_PATH=/api/v1/payments/{payment_id}
VULNBANK_TIMEOUT_MS=12000
VULNBANK_LAB_VULN=0
```

Set `VULNBANK_LAB_VULN=1` to activate the payment vulnerability findings (PWN-042 to PWN-045). Leave it at `0` if you do not have Vulnbank credentials or do not want to cover payment flaws.

Set `HEAL_EVERY_MINUTES` to how often the auto-healer should check for dirty state and reset the lab. The default is 10 minutes. Set to `0` to disable auto-reset entirely.

> `LAB_RESET_TOKEN` secures the `/reset` endpoint. Set a strong value if you are deploying to a shared environment, otherwise anyone who knows the URL can reset the lab mid-session.

### Step 4 - Run the setup script

```bash
chmod +x setup-local.sh
./setup-local.sh
```

The script does the following automatically:

1. Checks for `.env.lab` and auto-generates it if missing
2. Tears down any existing containers and volumes from a previous setup
3. Builds the application and database containers
4. Waits for MySQL to be fully ready before proceeding
5. Imports the full database schema and seed data from `pwnshop.sql`
6. Copies seed product images into the uploads volume
7. Prints a credentials summary at the end

> The script requires `sudo` once to copy seed images into the Docker volume. You will be prompted for your password at that step.

**Expected output when setup completes:**

```
PwnShop is ready! Visit http://localhost:3000

DATABASE CREDENTIALS (Internal Container):
  Username : root
  Password : <generated-password>
  Database : pwnshop
------------------------------------------------
LAB RESET TOKEN: <generated-token>
```

Save or screenshot this output. The same credentials are also stored in `.env.lab`.

The application is available at **http://localhost:3000**.

### Step 5 - Verify the setup

Open your browser and navigate to **http://localhost:3000**. You should see the Pwnshop homepage with product listings and featured sellers.

Log in with one of the default accounts (see [Default Accounts](#default-accounts)) and check that the mail inbox, cart, and product pages load correctly.

Navigate to **http://localhost:3000/debug/info** and confirm it returns a JSON response with the session secret and chat override token. If it returns a 404, the application did not start correctly.

---

## Installation - Without Docker

Use this method if you cannot run Docker or prefer a native setup.

### Step 1 - Clone the repository

```bash
git clone https://github.com/ctfsec/pwnshop.git
cd pwnshop
```

### Step 2 - Install Node.js dependencies

```bash
npm install
```

### Step 3 - Set up the database

Start your MySQL server if it is not already running. Then create the database and import the schema:

```bash
mysql -u root -p -e "CREATE DATABASE pwnshop;"
mysql -u root -p pwnshop < pwnshop.sql
```

Enter your MySQL root password when prompted.

### Step 4 - Configure environment variables

```bash
cp .env.example .env
```

Open `.env` in a text editor and fill in your values:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_USER=root
# Your MySQL root password. Leave blank if no password is set (do not use quotes)
DB_PASSWORD=yourpassword
DB_NAME=pwnshop

# AI Chatbot - get a free key at https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# Server
PORT=3000
SESSION_SECRET=weak-secret-123
```

### Step 5 - Copy seed images

Copy the seed product images into the uploads folder so product listings display correctly:

```bash
cp -r public/uploads-seed/. public/uploads/
```

### Step 6 - Start the application

```bash
# Production mode
npm start

# Development mode (auto-restarts on file changes)
npm run dev
```

The application will be available at **http://localhost:3000**.

> Without Docker, the auto-reset healer is still active but lab resets via `/reset` will only wipe database records. The uploads folder will not be automatically restored to its seed state. To restore images manually after a reset, repeat Step 5.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_HOST` | Yes | `127.0.0.1` | MySQL host. Use `db` inside Docker Compose. |
| `DB_USER` | Yes | `root` | MySQL username |
| `DB_PASSWORD` | Yes | - | MySQL password |
| `DB_NAME` | Yes | `pwnshop` | Database name |
| `PORT` | No | `3000` | HTTP port the app listens on |
| `SESSION_SECRET` | No | `weak-secret-123` | Express session signing secret. Intentionally weak (PWN-006). |
| `GROQ_API_KEY` | No | - | API key for the Groq LLM service. Chatbot disabled if missing. |
| `HEAL_EVERY_MINUTES` | No | `20` | Auto-reset check interval in minutes. Set to `0` to disable. |
| `LAB_RESET_TOKEN` | No | - | Token to authenticate the `/reset` endpoint |
| `VULNBANK_BASE_URL` | No | - | Base URL of the Vulnbank payment service |
| `VULNBANK_AUTH_MODE` | No | `api_key_header` | Vulnbank authentication mode |
| `VULNBANK_MERCHANT_API_KEY` | No | - | Vulnbank merchant API key |
| `VULNBANK_CHARGE_PATH` | No | `/api/v1/payments/charge` | Vulnbank charge endpoint path |
| `VULNBANK_VERIFY_PATH` | No | `/api/v1/payments/{payment_id}` | Vulnbank verification endpoint path |
| `VULNBANK_TIMEOUT_MS` | No | `12000` | Vulnbank request timeout in milliseconds |
| `VULNBANK_LAB_VULN` | No | `0` | Set to `1` to enable payment vulnerability findings (PWN-042 to PWN-045) |
| `CHAT_OVERRIDE_TOKEN` | No | auto-set | Token used to construct the chat override payload (PWN-031). Discoverable in-app. |

---

## Default Accounts

These accounts are seeded in `pwnshop.sql` and are restored on every lab reset. All seed users start with a wallet balance of N10,000.

| Role | Username | Notes |
|---|---|---|
| Admin | `admin` | Full admin panel access at `/admin` |
| Seller | `pwnshop` | Active product listings |
| Seller | `alice` | Active product listings |
| User | `olajide` | Regular buyer account |
| User | `bob` | Regular buyer account |

Passwords are stored in `pwnshop.sql` as bcrypt hashes. The plaintext passwords for all seed accounts are documented in the Developer Reference.

**Logging in requires OTP verification.** After entering your username and password, a one-time code is sent to the user's in-app mail inbox. Navigate to `/mail/<inbox_token>` to read it. You do not need an external email provider - all mail is stored in the database and readable in-app.

Each user's inbox token is visible on their profile page after logging in. Navigate to `/mail/<inbox_token>` to read their messages.

---

## Key URLs

| URL | Description |
|---|---|
| `/` | Homepage with product listings and featured sellers |
| `/login` | User login |
| `/register` | New account registration |
| `/admin/login` | Admin panel login (separate from user login) |
| `/admin` | Admin panel - users, orders, products, coupons, audit logs |
| `/vulnerabilities` | Full interactive vulnerability index with descriptions |
| `/reset` | Lab reset tool - requires `LAB_RESET_TOKEN` |
| `/debug/info` | Debug endpoint - publicly accessible, intentionally (PWN-018) |
| `/api/v1/events` | Unauthenticated audit log JSON feed (PWN-005) |
| `/mail/<inbox_token>` | In-app mail inbox (PwnMail) - used for OTPs |
| `/profile` | Wallet top-up, avatar upload, Vulnbank card funding |
| `/checkout` | Checkout flow with wallet or Vulnbank card payment |
| `/seller/preview` | Seller storefront preview - SSTI entry point (PWN-040) |
| `/download` | File download - path traversal entry point (PWN-038) |
| `/chat` | AI chatbot - LLM vulnerability entry points |
| `/lab-stats` | JSON endpoint returning visitor counts and lab dirty state |

---

## Resetting the Lab

The reset tool wipes all student-created data while preserving the seed accounts, demo products, seed coupons, and starting wallet balances. Use it between cohorts or practice sessions to return the lab to a clean state.

**What is deleted on reset:**
- All non-seed user accounts
- All orders, order items, tracking events
- All cart items, wishlists, reviews
- All OTP codes and PwnMail messages
- All password reset tokens
- All non-seed products and non-seed coupons
- All coupon usage records and seller earnings

**What is preserved on reset:**
- Admin account and seed users (IDs 1 to 5)
- Seed products (IDs 1 to 11)
- Seed coupons (IDs 1 to 5)
- Seed wallet balances (N10,000 per user)
- Visitor statistics (unique visitors and total visits persist)

### Reset methods

**Method 1 - Web UI (easiest):**

Navigate to `/reset` in your browser. Enter the `LAB_RESET_TOKEN` from your `.env.lab` file and confirm. The page will reload once the reset is complete.

**Method 2 - Docker exec:**

```bash
docker compose exec pwnshop bash /usr/src/app/scripts/reset-lab-inside.sh
```

**Method 3 - Full teardown (wipes everything including Docker volumes):**

Use this if the database is in an unrecoverable state:

```bash
docker compose down -v
./setup-local.sh
```

**Method 4 - Manual database reset (without Docker):**

```bash
mysql -u root -p -e "DROP DATABASE pwnshop; CREATE DATABASE pwnshop;"
mysql -u root -p pwnshop < pwnshop.sql
cp -r public/uploads-seed/. public/uploads/
```

### Auto-reset healer

The application includes an auto-reset healer that runs in the background every `HEAL_EVERY_MINUTES` minutes. If the lab is in a dirty state (data has been modified) and no activity has been detected for 20 minutes, the healer will automatically reset the lab. This is useful for shared deployments where participants may forget to reset between sessions.

Set `HEAL_EVERY_MINUTES=0` to disable the healer entirely.

---

## Vulnerability Index

All 51 vulnerabilities are documented in-app at `/vulnerabilities` with descriptions, affected endpoints, and hints. The table below is a summary.

| ID | Title | Severity | Category | |
|---|---|---|---|---|
| PWN-001 | IDOR - Order Details | High | A01:2025 |
| PWN-002 | IDOR - Order Tracking (No Auth) | High | A01:2025 |
| PWN-003 | IDOR - Wishlist | Medium | A01:2025 |
| PWN-004 | IDOR - PwnMail Inbox | High | A01:2025 |
| PWN-005 | Public Audit Log - No Authentication | Info | A01:2025 |
| PWN-006 | Weak Session Secret (Hardcoded + Exposed) | Critical | A04:2025 |
| PWN-007 | Session Cookie Missing HttpOnly / Secure Flags | Medium | A04:2025 |
| PWN-008 | SQL Injection - Login (Authentication Bypass) | Critical | A05:2025 |
| PWN-009 | SQL Injection - Admin Login | Critical | A05:2025 |
| PWN-010 | SQL Injection - Product Search | High | A05:2025 |
| PWN-011 | Stored XSS - Product Reviews | High | A05:2025 |
| PWN-012 | Stored XSS via SVG Avatar Upload | Medium | A05:2025 | ¹ |
| PWN-013 | CSV Injection - Order Export | Medium | A05:2025 |
| PWN-014 | Second-Order SQLi - Audit Log Search | Medium | A05:2025 |
| PWN-015 | Predictable OTP - Brute-Forceable 2FA | High | A06:2025 |
| PWN-016 | Coupon Category Restriction Bypass | Medium | A06:2025 |
| PWN-017 | Open Redirect - Login and Register | Medium | A06:2025 |
| PWN-018 | Debug Endpoint - Credentials Exposed Publicly | Critical | A02:2025 |
| PWN-019 | Verbose Error Stack Traces in Responses | Medium | A02:2025 |
| PWN-020 | No Security Headers | Info | A02:2025 |
| PWN-021 | Mass Assignment - Self-Assigned Admin Role | High | A07:2025 |
| PWN-022 | No Account Lockout or Rate Limiting | Medium | A07:2025 |
| PWN-023 | No Password Policy | Info | A07:2025 |
| PWN-024 | OTP Not Invalidated on New Request | Medium | A07:2025 |
| PWN-025 | File Upload - MIME Type Spoofing | High | A08:2025 | ¹ |
| PWN-026 | CSRF - Account Self-Deletion | Medium | A08:2025 |
| PWN-027 | Plaintext Passwords Written to Audit Log | Medium | A09:2025 |
| PWN-028 | Spoofable IP Addresses in Audit Log | Info | A09:2025 |
| PWN-029 | SSRF - Avatar URL Fetched Server-Side | High | A10:2025 |
| PWN-030 | Seller Earnings Logic Bug | Medium | Logic |
| PWN-031 | Direct Prompt Injection - System Prompt Extraction | Critical | LLM01 |
| PWN-032 | Indirect Prompt Injection via Product Descriptions | High | LLM01 |
| PWN-033 | Sensitive User Data Injected into System Prompt | High | LLM02 |
| PWN-034 | DOM XSS via Unsanitised AI Response | High | LLM05 |
| PWN-035 | IDOR via AI Order Lookup Tool | Medium | LLM06 |
| PWN-036 | No Rate Limiting on AI Endpoint | Medium | LLM10 |
| PWN-037 | Username Enumeration | Medium | A07:2025 |
| PWN-038 | Path Traversal - Invoice Download | High | A02:2025 |
| PWN-039 | HTTP Parameter Pollution - Coupon Bypass | Medium | A06:2025 |
| PWN-040 | SSTI to RCE - Seller Storefront Preview | Critical | A05:2025 |
| PWN-041 | Prototype Pollution - Lodash Dependency | High | A03:2025 |
| PWN-042 | Vulnbank Wallet Funding - Credited Amount Override | High | Payments | ² |
| PWN-043 | Vulnbank Wallet Funding - Tiny / Negative Amount Abuse | High | Payments | ² |
| PWN-044 | Vulnbank Payment - Unverified Settlement Bypass | High | Payments | ² |
| PWN-045 | Vulnbank Verification - Null Amount Fallback | Medium | Payments | ² |
| PWN-046 | Multi-Vuln Chain → Agent Command Injection (Wallet Credit) | Critical | LLM01 |
| PWN-047 | Multi-Vuln Chain → Agent Command Injection (Free Order) | Critical | LLM01 |
| PWN-048 | Unvalidated Third-Party LLM API - Supply Chain Trust Abuse | Medium | LLM03 |
| PWN-049 | Steganographic Prompt Injection via Poisoned Product Listings | High | LLM04 |
| PWN-050 | Classified Section Extraction via Multi-Turn Persona Injection | High | LLM07 |
| PWN-051 | Model Misinformation - False Policy Confirmation via Leading Questions | Medium | LLM09 |

> ¹ Upload and storage work on any deployment. Full exploit impact (XSS execution) requires the `/uploads/` path to be publicly accessible via URL — confirm this before attempting the chain.
>
> ² Requires a self-hosted deployment with `VULNBANK_LAB_VULN=1` set in `.env.lab` and valid Vulnbank credentials configured.

---

## Notable Attack Chains

These chains demonstrate how individual findings can be combined for greater impact.

**Full account takeover without credentials**
`PWN-018` (debug endpoint leaks session secret) -> `PWN-006` (use secret to forge a signed session cookie) -> impersonate any user including admin with no login required

**Remote code execution from a regular user account**
Register any account -> navigate to `/register-seller` and become a seller -> submit a Node.js `child_process` payload to `/seller/preview?template=` -> arbitrary command execution on the server (PWN-040)

**AI-assisted stored XSS leading to session theft**
Seller embeds a payload in a product description -> `PWN-032` (indirect prompt injection causes the chatbot to echo the payload) -> `PWN-034` (chatbot response rendered via `innerHTML` without sanitisation) -> victim session token exfiltrated to attacker

**Instant admin privilege escalation without SQLi**
`POST /register` with `role=admin` included in the request body -> `PWN-021` (mass assignment accepts the field) -> account is created with admin role immediately, no exploit chain needed

**Payment manipulation for free wallet credit**
`PWN-042` (include `credited_amount=999999` in the topup POST body) combined with `PWN-043` (charge only `amount=0.01` to Vulnbank) -> wallet credited with 999,999 Naira for near-zero cost

**OTP interception for account takeover**
`PWN-001` (IDOR on `/order/:id` reveals victim inbox token in HTML) -> `PWN-004` (access victim mail inbox at `/mail/<token>`) -> read victim OTP -> complete login as victim

**Agent command injection - arbitrary wallet credit**
`PWN-018` (debug endpoint leaks `CHAT_OVERRIDE_TOKEN`) -> `PWN-037` (enumerate a valid email via `/chat/init`) -> `PWN-050` (multi-turn persona injection extracts the `[WALLET_CREDIT:<amount>]` command tag from the classified system prompt section) -> `PWN-046` (construct `OVERRIDE::base64(token:user_id)` and send alongside wallet credit request) -> server credits up to ₦50,000 per request silently

**Agent command injection - free product order**
Same chain as above (`PWN-018` -> `PWN-037` -> `PWN-050` -> `PWN-047`) but targets the `[FREE_ORDER:<product_id>]` command tag -> server creates a real order with `total_amount = 0`, bypassing all payment logic entirely

---

## Common Issues

**Database connection failed on startup**
MySQL is not running or the `pwnshop` database does not exist. For Docker Compose, run `docker compose logs db` to check the database container. For manual setup, verify MySQL is running with `mysqladmin -u root -p status` and that the database was created.

**AI chatbot not working**
The `GROQ_API_KEY` in `.env` is missing, empty, or invalid. Get a free key at [console.groq.com](https://console.groq.com). The chatbot will display an error message on the page if the key is missing.

**Product images not showing after setup**
If you used `setup-local.sh` and images are still missing, re-run the script. It copies seed images from `public/uploads-seed/` into the Docker uploads volume. For manual setup, run `cp -r public/uploads-seed/. public/uploads/`.

**OTP not appearing in the mail inbox**
Navigate to `/mail/<inbox_token>` directly rather than waiting for an email. OTPs expire after 10 minutes. If the code has expired, log out and log in again to request a new one. Each user's inbox token is shown on their profile page.

**Port 3306 conflict**
If you already have a local MySQL instance running on port 3306, the Docker Compose database container maps to port `3307` on the host to avoid conflicts. The application container still connects internally on port `3306` so no configuration change is needed.

**Port 3000 already in use**
Another process is using port 3000. Either stop the other process or change the port mapping in `docker-compose.yml` from `3000:3000` to `3001:3000` and update your `.env` to set `PORT=3000` (the internal port stays the same).

**Auto-reset firing too often or at wrong times**
Adjust `HEAL_EVERY_MINUTES` in `.env.lab` and restart the containers. Set it to `0` to disable the healer entirely during a live session where you do not want unexpected resets.

**Why is Lodash pinned to version 4.17.4?**
It is intentionally outdated to demonstrate CVE-2019-10744 (prototype pollution via `_.merge()`). Do not upgrade it. This is documented as PWN-041.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18 |
| Framework | Express.js |
| Templating | EJS |
| Database | MySQL 5.7 |
| Authentication | bcryptjs + express-session |
| File Uploads | Multer |
| PDF Generation | PDFKit |
| AI Chatbot | Groq API (LLaMA 3.3 70B) |
| Utility | Lodash 4.17.4 (intentionally outdated - CVE-2019-10744) |
| Containerisation | Docker + Docker Compose |

---

## Project Structure

```
pwnshop/
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml          # Standard setup
│   ├── docker-compose.lab.yml      # Lab setup with auto-reset support
│   └── docker-entrypoint.sh
├── public/
│   ├── uploads/                    # Runtime uploaded files (avatars, product images)
│   ├── uploads-seed/               # Seed images restored on every lab reset
│   ├── images/                     # Static default product images
│   └── css/                        # Stylesheets
├── scripts/
│   ├── reset-lab-inside.sh         # Lab reset script (runs inside the container)
│   └── setup-healer-cron.sh        # Auto-heal cron setup for VPS deployments
├── src/
│   ├── app.js                      # Main Express application (all routes and logic)
│   └── views/                      # EJS templates for all pages
├── pwnshop.sql                     # Full database schema and seed data
├── setup-local.sh                  # One-command local lab setup script
├── package.json
├── .env.example                    # Template for the application environment file
└── README.md
```

---

## Legal Notice

Pwnshop is designed exclusively for security education in controlled lab environments. All vulnerabilities are intentional and documented. Testing these techniques against systems you do not own or have explicit written permission to assess is illegal in most jurisdictions. The authors accept no liability for misuse.

---

*Built for the CTF Security training programme.*
