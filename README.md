# Lakitu: Serverless Boilerplate (API Gateway + Lambda Java + DynamoDB + Cognito + React)

## Prereqs

- Node 20+, npm
- AWS CDK v2 (`npm i -g aws-cdk`), AWS creds configured
- Java 21

## 1) Deploy infra

```
cd infra
npm i
npm run build
# Build backend jar so the Lambda asset exists
(cd ../backend && ./gradlew clean shadowJar || ./gradlew.bat clean shadowJar)
npm run deploy
```

Copy the stack outputs:

- `ApiBaseUrl`
- `UserPoolId`
- `UserPoolClientId`
- `CognitoDomain`
- `FrontendUrl`
- `SiteBucketName`
- `DistributionId`

## 2) Configure Cognito callback URLs

Update the User Pool App Client callback/logout URLs to include `FrontendUrl`.

## 3) Build & upload frontend

Create a `.env` (or set in CI) for Vite:

```
VITE_API_BASE_URL=<ApiBaseUrl>
VITE_COGNITO_USER_POOL_ID=<UserPoolId>
VITE_COGNITO_CLIENT_ID=<UserPoolClientId>
VITE_COGNITO_DOMAIN=<CognitoDomain>
```

Build and upload:

```
cd ../frontend
npm i
npm run build
aws s3 sync dist/ s3://<SiteBucketName>
aws cloudfront create-invalidation --distribution-id <DistributionId> --paths "/*"
```

## 4) GitHub Actions CI

Two workflows are included:

- `infra-deploy.yml` — builds backend jar and deploys CDK on pushes to `infra` or `backend`.
- `frontend-deploy.yml` — builds React and deploys to S3 + invalidates CloudFront on pushes to `frontend`.

### Required repo secrets

- `AWS_ACCOUNT_ID` (optional, for scoping)
- `AWS_REGION` (e.g., `us-east-1`)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `CDK_STACK_NAME` (e.g., `LakituStack`)
- `SITE_BUCKET_NAME` (from stack output `SiteBucketName`)
- `DISTRIBUTION_ID` (from stack output `DistributionId`)
- `API_BASE_URL`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_DOMAIN` (to inject into Vite build)

## 5) Test the flow

Open `FrontendUrl`, login, add an item.
