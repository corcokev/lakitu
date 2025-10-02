import { Stack, CfnOutput, Duration, RemovalPolicy, Lazy, aws_iam as iam, aws_lambda as lambda, aws_dynamodb as dynamodb, aws_cognito as cognito, aws_s3 as s3, aws_cloudfront as cloudfront, aws_cloudfront_origins as origins, aws_s3_deployment as s3deploy, aws_apigateway as apigw, } from "aws-cdk-lib";
export class LakituStack extends Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const githubOrg = "corcokev";
        const githubRepo = "lakitu";
        const githubBranch = "main";
        // Trust policy: GitHub Actions OIDC
        const githubOidcProviderArn = `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`;
        const oidcPrincipal = new iam.WebIdentityPrincipal(githubOidcProviderArn, {
            StringEquals: {
                "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
            },
            StringLike: {
                "token.actions.githubusercontent.com:sub": `repo:${githubOrg}/${githubRepo}:ref:refs/heads/${githubBranch}`,
            },
        });
        // GitHub Actions IAM Role
        const githubActionsRole = new iam.Role(this, "GitHubActionsRole", {
            roleName: "GitHubActionsLakituRole",
            assumedBy: oidcPrincipal,
            description: "Used by GitHub Actions to deploy Lakitu infra via CDK",
            maxSessionDuration: Duration.hours(1),
        });
        // Permissions: Allow deploy of CDK-tagged resources only
        githubActionsRole.addToPolicy(new iam.PolicyStatement({
            actions: [
                "cloudformation:*",
                "s3:*",
                "lambda:*",
                "dynamodb:*",
                "apigateway:*",
                "logs:*",
                "cloudfront:*",
                "cognito-idp:*",
                "iam:Get*",
                "iam:List*",
                "sts:GetCallerIdentity",
                "iam:PassRole",
            ],
            resources: ["*"],
            conditions: {
                StringEqualsIfExists: {
                    "aws:RequestTag/Project": "Lakitu",
                    "aws:ResourceTag/Project": "Lakitu",
                },
            },
        }));
        // Tighter PassRole condition for CDK bootstrap roles
        githubActionsRole.addToPolicy(new iam.PolicyStatement({
            actions: ["iam:PassRole"],
            resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
            conditions: {
                StringEquals: {
                    "iam:PassedToService": "cloudformation.amazonaws.com",
                },
            },
        }));
        // 1) Data: DynamoDB single-table
        const table = new dynamodb.Table(this, "UserItems", {
            partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "itemId", type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.DESTROY,
            pointInTimeRecovery: false,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
        });
        // 2) Auth: Cognito User Pool + Client (Hosted UI / PKCE)
        const userPool = new cognito.UserPool(this, "UserPool", {
            selfSignUpEnabled: true,
            signInAliases: { email: true },
            standardAttributes: { email: { required: true, mutable: false } },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireDigits: true,
            },
            removalPolicy: RemovalPolicy.DESTROY,
        });
        const domain = userPool.addDomain("Domain", {
            cognitoDomain: {
                domainPrefix: `lakitu-${this.account.slice(-6)}-${this.region}`.replace(/[^a-z0-9-]/g, ""),
            },
        });
        const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
            userPool,
            generateSecret: false,
            authSessionValidity: Duration.minutes(5),
            supportedIdentityProviders: [
                cognito.UserPoolClientIdentityProvider.COGNITO,
            ],
            oAuth: {
                flows: { authorizationCodeGrant: true },
                scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL],
                callbackUrls: [
                    "http://localhost:5173/",
                    Lazy.string({ produce: () => `https://${dist.domainName}/` }),
                ],
                logoutUrls: [
                    "http://localhost:5173/",
                    Lazy.string({ produce: () => `https://${dist.domainName}/` }),
                ],
            },
        });
        // 3) Compute: Lambda (Java 21) single router handler
        const handler = new lambda.Function(this, "ApiHandler", {
            runtime: lambda.Runtime.JAVA_21,
            memorySize: 512,
            timeout: Duration.seconds(10),
            handler: "app.handlers.RouterHandler::handleRequest",
            // Build your fat jar locally into ../backend/build/libs first (shadowJar),
            // then CDK will pick it up here:
            code: lambda.Code.fromAsset("../backend/build/libs"),
            environment: {
                TABLE_NAME: table.tableName,
                POWERTOOLS_SERVICE_NAME: "lakitu",
            },
        });
        table.grantReadWriteData(handler);
        // 4) API: REST API (L2) + Cognito User Pools Authorizer (L2)
        const api = new apigw.RestApi(this, "RestApi", {
            restApiName: "LakituApi",
            deployOptions: { stageName: "prod" },
            defaultCorsPreflightOptions: {
                allowOrigins: [
                    Lazy.string({ produce: () => `https://${dist.domainName}/` }),
                ],
                allowHeaders: ["Authorization", "Content-Type"],
                allowMethods: apigw.Cors.ALL_METHODS,
            },
        });
        const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, "CognitoAuthorizer", {
            cognitoUserPools: [userPool],
        });
        const lambdaIntegration = new apigw.LambdaIntegration(handler, {
            proxy: true,
        });
        // We expose a proxy under /v1 to let the Lambda route internally.
        const v1 = api.root.addResource("v1");
        const proxy = v1.addResource("{proxy+}");
        // Protect all routes under /v1/* with Cognito
        proxy.addMethod("ANY", lambdaIntegration, {
            authorizationType: apigw.AuthorizationType.COGNITO,
            authorizer,
        });
        // Optionally, also protect /v1 itself (no trailing path)
        v1.addMethod("ANY", lambdaIntegration, {
            authorizationType: apigw.AuthorizationType.COGNITO,
            authorizer,
        });
        // 5) Static Hosting: S3 + CloudFront (OAI only, pure L2)
        const siteBucket = new s3.Bucket(this, "SiteBucket", {
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });
        const oai = new cloudfront.OriginAccessIdentity(this, "OAI");
        const dist = new cloudfront.Distribution(this, "Distribution", {
            defaultBehavior: {
                origin: new origins.S3Origin(siteBucket, { originAccessIdentity: oai }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
            },
            defaultRootObject: "index.html",
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    ttl: Duration.seconds(0),
                    responsePagePath: "/index.html",
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    ttl: Duration.seconds(0),
                    responsePagePath: "/index.html",
                },
            ],
        });
        new s3deploy.BucketDeployment(this, "DeploySitePlaceholder", {
            sources: [
                s3deploy.Source.data("index.html", "<html><body>Deploy frontend to S3</body></html>"),
            ],
            destinationBucket: siteBucket,
            distribution: dist,
        });
        // 6) Outputs
        new CfnOutput(this, "GitHubActionsRoleArn", {
            value: githubActionsRole.roleArn,
            description: "IAM Role to assume via GitHub Actions OIDC",
        });
        new CfnOutput(this, "LakituApiBaseUrl", { value: api.url }); // ends with "/"
        new CfnOutput(this, "LakituTableName", { value: table.tableName });
        new CfnOutput(this, "LakituUserPoolId", { value: userPool.userPoolId });
        new CfnOutput(this, "LakituUserPoolClientId", {
            value: userPoolClient.userPoolClientId,
        });
        new CfnOutput(this, "LakituCognitoDomain", { value: domain.baseUrl() });
        new CfnOutput(this, "LakituFrontendUrl", {
            value: `https://${dist.domainName}`,
        });
        new CfnOutput(this, "LakituSiteBucketName", {
            value: siteBucket.bucketName,
        });
        new CfnOutput(this, "LakituDistributionId", { value: dist.distributionId });
    }
}
