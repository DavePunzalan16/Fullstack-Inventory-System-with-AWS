# AWS Deployment Guide (Free Tier) - Step by Step

This guide is written for someone deploying to AWS for the first time. Follow the steps
in order. Each step tells you exactly where to click in the AWS Console.

IMPORTANT - money safety:
- Everything below is chosen to stay inside the AWS Free Tier.
- You will set a billing alarm in Step 1 so AWS emails you if estimated charges pass $1.00.
- When you are done, do Step 9 (Teardown) to delete everything so nothing keeps billing.

What you will end up with:
- Frontend on Amplify (public HTTPS URL)
- API on an EC2 server, exposed through API Gateway (HTTPS)
- PostgreSQL database on RDS
- Product images in an S3 bucket
- Login handled by Cognito

Deployment order (do NOT skip around):
1. Billing alarm  2. IAM user  3. VPC/network  4. RDS database  5. EC2 API server
6. API Gateway  7. S3 bucket  8. Amplify frontend  9. Cognito + CI/CD + free-tier check + teardown

Before you start:
- Create an AWS account at aws.amazon.com (you need a credit card; free tier still applies).
- Pick ONE region and use it for everything. This guide uses us-east-1 (N. Virginia).
  The region selector is the dropdown at the TOP-RIGHT of the console.

---

## Step 1 - Billing alarm (do this first)

Goal: get an email if your estimated AWS charges go above $1.00.

1. Sign in to the AWS Console.
2. First, turn on billing alerts:
   - Click your account name (top-right) > "Billing and Cost Management".
   - In the left menu click "Billing preferences".
   - Check "Receive CloudWatch billing alerts" (or "Alert preferences" > enable). Save.
3. Switch region to US East (N. Virginia) us-east-1 (top-right dropdown). Billing metrics
   only live in this region.
4. In the top search bar type "CloudWatch" and open it.
5. Left menu: "Alarms" > "All alarms" > click "Create alarm".
6. Click "Select metric" > "Billing" > "Total Estimated Charge" > pick "USD" > "Select metric".
7. Conditions: Threshold type "Static", "Greater" than "1" (that is 1.00 USD). Click Next.
8. Notification: "Create new topic", give it a name (for example billing-alerts), enter
   your email, click "Create topic". Click Next.
9. Name the alarm (for example billing-over-1-usd), click Next, then "Create alarm".
10. Check your email and click the "Confirm subscription" link from AWS.

Free tier note: CloudWatch alarms have a small free allowance; one billing alarm is free.

---

## Step 2 - IAM user (do not use your root account for daily work)

Goal: create a limited user + access keys the API will use for S3.

1. Search "IAM" in the top bar and open it.
2. Left menu "Users" > "Create user".
3. User name: for example inventory-app. Click Next.
4. Permissions: "Attach policies directly". For now attach "AmazonS3FullAccess"
   (you can tighten this later to a single-bucket policy). Click Next > "Create user".
5. Open the new user > tab "Security credentials" > "Access keys" > "Create access key".
6. Choose "Application running outside AWS" (or "Local code") > Next > "Create access key".
7. COPY the "Access key" and "Secret access key" now (the secret is shown only once).
   You will paste these into the EC2 environment in Step 5.

Security: never commit these keys to git. They only go into server environment variables.

---

## Step 3 - Network (VPC)

Good news: every AWS account has a "default VPC" already. You do not need to build one.

1. Search "VPC" in the top bar and open it.
2. Left menu "Your VPCs" - confirm one VPC is marked "Default: Yes". Note its VPC ID.
3. Left menu "Subnets" - confirm you have subnets in at least two Availability Zones
   (RDS needs two). The defaults already do.

You will place RDS and EC2 in this default VPC so they can talk to each other.

---

## Step 4 - RDS PostgreSQL database

Goal: a managed PostgreSQL database on the free-tier db.t3.micro.

1. Search "RDS" and open it. Make sure region is us-east-1.
2. Click "Create database".
3. Method: "Standard create". Engine: "PostgreSQL".
4. Templates: choose "Free tier". (This forces free-tier-eligible settings.)
5. Settings:
   - DB instance identifier: inventory-db
   - Master username: postgres
   - Master password: choose a strong password and SAVE it.
6. Instance configuration: db.t3.micro (free tier picks this).
7. Storage: 20 GB gp2 (free tier). Turn OFF "Storage autoscaling" to avoid surprise growth.
8. Connectivity:
   - VPC: your default VPC.
   - Public access: "Yes" (simplest for a first deploy; you connect from EC2 and to run
     migrations). For a hardened setup you would keep this "No".
   - VPC security group: "Create new" named inventory-db-sg.
9. Additional configuration: set "Initial database name" to inventory.
10. Click "Create database". Wait until status is "Available" (a few minutes).
11. Open the database > "Connectivity & security" > copy the "Endpoint" (looks like
    inventory-db.xxxx.us-east-1.rds.amazonaws.com) and note the port 5432.

Your DATABASE_URL will be:
postgresql://postgres:YOUR_PASSWORD@YOUR_ENDPOINT:5432/inventory?schema=public

Free tier note: one db.t3.micro, 20 GB, single-AZ. Do not enable Multi-AZ (that is billable).

---

## Step 5 - EC2 server for the API (with pm2)

Goal: run the Express API on a small always-on server and ship logs to CloudWatch.

### 5a. Launch the instance
1. Search "EC2" and open it. Region us-east-1.
2. Click "Launch instance".
3. Name: inventory-api.
4. Application and OS Image: "Amazon Linux 2023" (free tier eligible).
5. Instance type: t2.micro (or t3.micro) - both are free-tier eligible (750 hrs/month).
6. Key pair: "Create new key pair", name it inventory-key, type RSA, .pem format.
   Download the .pem file and keep it safe - you need it to SSH in.
7. Network settings > "Edit":
   - VPC: default VPC (same as RDS).
   - Auto-assign public IP: Enable.
   - Security group: create new named inventory-api-sg. Add inbound rules:
     - SSH (port 22) from "My IP".
     - Custom TCP port 4000 from "Anywhere" (temporary; API Gateway will front it later).
8. Click "Launch instance". Open it and copy the "Public IPv4 address".

### 5b. Let EC2 reach RDS
1. Go to RDS > your DB > security group inventory-db-sg > "Inbound rules" > "Edit".
2. Add rule: PostgreSQL (5432), Source = the inventory-api-sg security group.
3. Save. Now the API server can connect to the database.

### 5c. Install and run the API
SSH in from your machine (replace path and IP):

    ssh -i inventory-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

On the server:

    sudo dnf update -y
    curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
    sudo dnf install -y nodejs git
    sudo npm install -g pm2
    git clone YOUR_REPO_URL app
    cd app/api
    npm ci
    npx prisma generate

Create the api/.env file on the server with your real values:

    DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/inventory?schema=public
    PORT=4000
    ALLOWED_ORIGINS=https://YOUR_AMPLIFY_DOMAIN
    AWS_REGION=us-east-1
    AWS_ACCESS_KEY_ID=YOUR_IAM_KEY
    AWS_SECRET_ACCESS_KEY=YOUR_IAM_SECRET
    S3_BUCKET=YOUR_BUCKET_NAME
    COGNITO_USER_POOL_ID=YOUR_POOL_ID
    COGNITO_CLIENT_ID=YOUR_CLIENT_ID

Apply migrations and seed, then start with pm2:

    npx prisma migrate deploy
    npm run db:seed
    npm run build
    pm2 start dist/index.js --name inventory-api
    pm2 save
    pm2 startup     # run the command it prints, so the API restarts on reboot

### 5d. Ship logs to CloudWatch (within 60s)
    sudo dnf install -y amazon-cloudwatch-agent
Configure the agent to watch pm2 log files (~/.pm2/logs/*.log) and push to a
CloudWatch log group named /inventory/api. Start the agent:
    sudo systemctl enable amazon-cloudwatch-agent && sudo systemctl start amazon-cloudwatch-agent

Test: open http://YOUR_EC2_PUBLIC_IP:4000/health - you should get status ok.

Free tier note: ONE t2/t3.micro only. Two micros running all month exceeds 750 free hours.

---

## Step 6 - API Gateway (HTTPS in front of EC2)

Goal: give the API a stable HTTPS URL and basic throttling, instead of exposing raw EC2.

1. Search "API Gateway" and open it.
2. Click "Create API" > "HTTP API" > "Build".
3. Integrations: "Add integration" > "HTTP URI". Enter http://YOUR_EC2_PUBLIC_IP:4000
   (or use {proxy} to forward all paths). Name the API inventory-api-gw. Click Next.
4. Routes: create a catch-all route: Method "ANY", Resource path /{proxy+}, pointing at
   the integration. This forwards every path/method to your EC2 API.
5. Stages: keep the default "$default" with "Auto-deploy" on. Click "Create".
6. Copy the "Invoke URL" (looks like https://abc123.execute-api.us-east-1.amazonaws.com).
   This is your public API base URL for the frontend.
7. Throttling (protects you): open the API > "Throttling" and set a modest default rate
   (for example 10 req/s, burst 20).
8. Now tighten EC2: go to EC2 > inventory-api-sg > inbound rules > remove the
   "port 4000 from Anywhere" rule so only API Gateway path is public over HTTPS.
   (If you used a public HTTP integration, keep 4000 open only to the gateway; for a
   first deploy leaving it is acceptable but less secure.)

Test: open https://YOUR_INVOKE_URL/health - you should get status ok over HTTPS.

Free tier note: HTTP API has a monthly free request allowance; light demo traffic is free.

---

## Step 7 - S3 bucket for product images

Goal: store uploaded product images.

1. Search "S3" and open it. Click "Create bucket".
2. Bucket name: globally unique, for example inventory-images-YOURNAME. Region us-east-1.
3. Object Ownership: "ACLs disabled" (recommended).
4. Public access: for a portfolio demo you may allow public read of images. To do that,
   uncheck "Block all public access" and acknowledge, then after creation add a bucket
   policy allowing s3:GetObject on arn:aws:s3:::YOUR_BUCKET/*. For a private setup, keep
   blocks on and serve via pre-signed URLs instead.
5. Create the bucket.
6. Put the bucket name into the API .env on EC2 as S3_BUCKET and restart pm2:
   pm2 restart inventory-api.

Free tier note: 5 GB standard storage and limited GET/PUT are free for the first 12 months.

---

## Step 8 - Amplify frontend hosting

Goal: host the Next.js frontend with automatic HTTPS and push-to-deploy.

1. Search "Amplify" and open it.
2. Click "Create new app" (or "Host web app") > "GitHub" > authorize AWS to read your repo.
3. Pick your repository and the branch to deploy (for example feat/frontend or main).
4. App settings / build settings:
   - Set the "Base directory" / "App root" to frontend (the Next.js app lives there).
   - Amplify auto-detects Next.js. Confirm the build runs npm ci and npm run build.
5. Environment variables (VERY IMPORTANT - build time):
   - NEXT_PUBLIC_API_BASE_URL = your API Gateway Invoke URL from Step 6.
   - NEXT_PUBLIC_COGNITO_USER_POOL_ID = your Cognito pool id (from Step 9).
   - NEXT_PUBLIC_COGNITO_CLIENT_ID = your Cognito app client id (from Step 9).
   (You can add the Cognito vars after Step 9 and re-run the build.)
6. Click "Save and deploy". Wait for the build to go green.
7. Amplify gives you an HTTPS URL (for example https://branch.appid.amplifyapp.com) with
   HTTP to HTTPS redirect on by default.
8. Go back to the EC2 api/.env and set ALLOWED_ORIGINS to this Amplify HTTPS URL, then
   pm2 restart inventory-api so CORS accepts the real frontend origin.

Free tier note: Amplify includes free build minutes and served GB per month for the first
12 months; a small demo stays within them.

---

## Step 9 - Cognito, CI/CD deploy, free-tier checklist, and teardown

### 9a. Cognito (login)
1. Search "Cognito" > "Create user pool".
2. Sign-in options: Email. Create the pool with defaults suitable for free tier.
3. Create an "App client" (public client, no secret for a browser app).
4. Copy the "User pool ID" and "App client ID".
5. Put them into:
   - EC2 api/.env as COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID (then pm2 restart).
   - Amplify env vars NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_CLIENT_ID
     (then redeploy).

Free tier note: Cognito includes a monthly active users (MAU) free allowance that covers
a demo. Note: AWS Secrets Manager is NOT free tier - do not use it just for these values;
plain EC2/Amplify environment variables are fine here.

### 9b. Continuous deploy for the API (optional)
- Add a GitHub Actions job that, after CI passes on the deploy branch, SSHes into EC2 and
  runs: git pull, npm ci, npx prisma migrate deploy, npm run build, pm2 restart inventory-api.
- Store the EC2 SSH private key and host as GitHub repository secrets.
- Design choice: if the deploy step fails, do NOT stop the running app - pm2 keeps the
  previous version serving, so a bad deploy does not cause downtime.

### 9c. Free-tier compliance checklist
- [ ] Exactly ONE EC2 t2/t3.micro running (<= 750 hrs/month total).
- [ ] RDS is db.t3.micro, 20 GB, single-AZ, autoscaling OFF.
- [ ] S3 usage under 5 GB; few requests.
- [ ] API Gateway + Cognito within monthly free allowances.
- [ ] Billing alarm from Step 1 is active and you confirmed the email.
- [ ] No NAT Gateway, no Multi-AZ, no Secrets Manager, no idle Elastic IPs
      (an Elastic IP not attached to a running instance is billed).

### 9d. Teardown (delete everything so it stops billing)
Do these in this order:
1. Amplify: open the app > "App settings" > "General" > "Delete app".
2. API Gateway: open the API > "Actions"/"Delete".
3. EC2: select inventory-api > "Instance state" > "Terminate instance".
   Release any Elastic IP you allocated (EC2 > Elastic IPs > Release).
4. RDS: select inventory-db > "Actions" > "Delete". Uncheck "create final snapshot"
   if you do not need it (snapshots can incur storage cost).
5. S3: empty the bucket, then delete the bucket.
6. Cognito: delete the user pool.
7. IAM: delete the access keys and the inventory-app user.
8. CloudWatch: delete the log group /inventory/api. You may keep the billing alarm.
9. Wait a day and check the Billing dashboard shows no ongoing charges.

That is the whole deployment. Take your time, go in order, and tear down when finished.
