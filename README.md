# hub2node

Node.js / Express middleware that bridges external systems (web forms, mobile apps, shipping/cargo webhooks) with **Priority ERP**. It logs into Priority via `priority-web-sdk` or its OData API, runs reports/procedures, generates PDFs, uploads them to AWS S3, and returns URLs/JSON to the caller. Deployed on AWS Elastic Beanstalk.

## Functionality

### Documents & reports (Priority Web SDK)
All routes below expect `POST` with JSON body containing a `credentials` object (Priority Web SDK login: `appname`, `username`, `password`, `url`, `tabulaini`, `language`, `profile.company`, `devicename`, `appid`, `appkey`) plus the parameters listed.

| Route | Purpose | Key body params |
|---|---|---|
| `/accounts` | A/R Ledger (customer account) report; optional PDF | `CUSTNAME`, `from_date`/`to_date` or `YEAR`, `pdf` |
| `/agent_debt` | Agent aged-debt report for a customer | `AGENTCODE`, `CUSTNAME`, `pdf` |
| `/aspirit/agent_debt` | Same as above, Aspirit-specific procedure | `AGENTCODE`, `CUSTNAME`, `pdf` |
| `/printAinvoice` | Print Sales (A) invoice, uploads PDF to S3 | `IVNUM`, `FORMAT` |
| `/printTinvoice` | Print Tax (T) invoice, uploads PDF to S3 | `IVNUM`, `FORMAT` |
| `/printEinvoice` | Print E-type invoice, uploads PDF to S3 | `IVNUM`, `FORMAT` |
| `/printCinvoice` | Print C-type invoice, uploads PDF to S3 | `IVNUM`, `FORMAT` |
| `/printSalesOrder` | Print sales order document, uploads PDF to S3 | `ORDNAME`, `FORMAT` |
| `/printPriceQuote` | Print price quote / customer profile doc, uploads PDF to S3 | `CPROFNUM`, `FORMAT` |
| `/closeAinvoices` | Close an open A invoice in Priority | `IVNUM` |
| `/closeEinvoices` | Close an open E invoice in Priority | `IVNUM` |
| `/closeTinvoices` | Close an open T invoice in Priority | `IVNUM` |

### Other routes
- `GET /` — home page, shows app version and the server's public IP.
- `GET /customer_form` — serves a static customer intake form (`views/customer_form.html`).
- `POST /ws/cargo` — webhook that pushes shipment/cargo status updates into Priority (`REUT_ORDCHANGE` or `CHNGDOCUMENTS_D`) via OData `PATCH`.
- `GET /updateOrderStatus` — looks up stored Priority credentials in AWS Secrets Manager by `customer`+`token`, then updates a sales order's status in Priority via OData `PATCH`. Query params: `customer`, `token`, `orderId`, `orderStatus`.
- `GET /pdfs/*` — static file server for generated PDFs (`routes/tmp`).
- `/users` — placeholder demo route (unused scaffold).

### Supporting modules
- `services/priority.service.js` — OData `PATCH` helper for order status updates.
- `services/aws.service.js` — fetches per-customer Priority credentials from AWS Secrets Manager.
- `services/s3.service.js` — uploads generated PDFs (from a URL or buffer) to S3.
- `utils/priorityPdfFetcher.js` — fetches a PDF from a Priority URL/data URI, re-authenticating via scraped login form (cheerio) if the session has expired.
- `routes/helper.js` — returns a sample `credentials` payload shape used in route help text.

## Setup

```bash
npm install
npm start          # node ./bin/www, default port 3000
npm run devstart    # nodemon, dev mode
```

### Environment variables
- `PORT` — server port (default `3000`)
- `AWS_REGION` — AWS region for S3 / Secrets Manager (default `us-west-2`)
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — AWS credentials (omit to use the instance/role default chain)
- `S3_BUCKET_NAME` — S3 bucket for generated PDFs
- `API_URL`, `API_USER`, `API_PASSWORD` — used by `/ws/cargo` for the Priority OData endpoint

## Deployment

Deployed via AWS Elastic Beanstalk. `.platform/hooks/prebuild/install-chromium-deps.sh` installs Chromium's native dependencies; `.platform/hooks/predeploy/00_add_swap.sh` provisions a 2GB swap file on the instance.

## Pushing changes to GitHub (`develop` branch)

This project's working branch is `develop` (remote: `origin`, repo `benmen1980/hub2node`). To push changes:

```bash
git checkout develop
git pull origin develop
git add .
git commit -m "describe your change"
git push origin develop
```

If `develop` is behind `main`/another branch and needs merging first, resolve conflicts locally before pushing.

## Changelog

- **1.5.6** — Added this README.
