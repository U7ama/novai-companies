# AWS demo deployment

The app runs on Lambda behind CloudFront. There is no EC2 instance, load balancer, NAT gateway, paid build service, warmer, or provisioned concurrency. The function starts when a request needs it. CloudFront caches the versioned JavaScript and CSS files.

## Data and authentication

The assessment still runs locally with an in-memory array of 40 companies. On AWS, the `COMPANIES_TABLE` setting enables a shared DynamoDB snapshot. This avoids losing changes on a cold start or returning different versions from separate Lambda instances.

The table uses 5 read and 5 write capacity units in provisioned mode. Conditional writes prevent one request from overwriting another request's changes. This is a small demo store, not a production database model: the full collection is stored in one item, which has DynamoDB's 400 KB item limit.

Authentication remains fake, as required for the assessment. CloudFront signs origin requests, and the Lambda URL only accepts requests from this distribution. A viewer-request function preserves the demo bearer token in a separate header. The Lambda adapter restores it for the app. The AWS build also hashes write payloads because the signed Lambda origin requires `x-amz-content-sha256` for writes.

## Costs

Lambda and CloudFront have monthly free allowances. DynamoDB's provisioned free allowance covers up to 25 read and 25 write capacity units and 25 GB of data. Before deploying, I checked the account's existing usage and capacity; the demo allocation fits alongside it.

Five or six short test sessions are expected to fit comfortably within those allowances. They are account-wide allowances, not a hard spending cap. Other projects or unexpected public traffic can use them too. Logs are retained for seven days. No extra ephemeral disk, customer-managed encryption key, or paid CDN feature is enabled.

The deployment ZIP is temporarily uploaded to a private encrypted S3 bucket. After a successful deployment and smoke test, the uploaded ZIP is removed so the bucket does not retain a billable archive. Lambda stores the deployed code. Keep a local copy or rebuild it before the next deployment.

## Build and infrastructure

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
bash scripts/package-lambda.sh
```

The packaging script builds into `.next-lambda` so it does not replace the local development server's `.next` directory. It creates `.aws-build/novai-companies.zip` with the standalone Node server, public files, static assets, and an executable startup script. Local environment files are excluded.

`infra/serverless.json` defines the Lambda function, its limited permissions, shared state table, seven-day log group, CloudFront distribution, private origin access, and auth-header forwarding function. It uses the official AWS Lambda Web Adapter layer. The certificate is issued in us-east-1 and validated through Cloudflare DNS.

For another deployment, build a fresh ZIP, upload it to a new key in the private deployment bucket, and update the CloudFormation stack with that bucket/key and the certificate ARN. Validate the template before applying it. The template accepts the application name and domain as parameters. No AWS credentials or Cloudflare token belong in this repository.

## Verification and removal

Check the deployed list, create a company, trigger a concurrent edit, verify 409, reload the version, and save again. A direct request to the private Lambda URL should return 403. A request to the API through the website without a bearer token should return 401.

The state table is retained if the CloudFormation stack is deleted so records are not accidentally lost. Removing the demo completely also means reviewing that retained table, the certificate validation record, the website CNAME, and the empty deployment bucket. The local server on port 3000 is separate from the hosted demo.
