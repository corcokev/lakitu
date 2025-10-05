import {
  Stack,
  StackProps,
  CfnOutput,
  Duration,
  RemovalPolicy,
  Lazy,
  aws_lambda as lambda,
  aws_dynamodb as dynamodb,
  aws_cognito as cognito,
  aws_s3 as s3,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_s3_deployment as s3deploy,
  aws_apigateway as apigw,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
export class LakituStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 1) Data: DynamoDB single-table
    const userItemsTable = new dynamodb.Table(this, "UserItems", {
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
        domainPrefix: `lakitu-${this.account.slice(-6)}-${this.region}`.replace(
          /[^a-z0-9-]/g,
          ""
        ),
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
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const handler = new lambda.Function(this, "ApiHandler", {
      runtime: lambda.Runtime.JAVA_21,
      memorySize: 512,
      timeout: Duration.seconds(10),
      handler: "app.handlers.RouterHandler::handleRequest",
      code: lambda.Code.fromAsset(
        join(__dirname, "../../backend/build/libs/backend-0.1.0-all.jar")
      ),
      environment: {
        USER_ITEMS_TABLE_NAME: userItemsTable.tableName,
        POWERTOOLS_SERVICE_NAME: "lakitu",
        FRONTEND_ORIGIN:
          "http://localhost:5173,https://d3odzc270i77yq.cloudfront.net",
      },
    });
    userItemsTable.grantReadWriteData(handler);

    // 4) API: REST API (L2) + Cognito User Pools Authorizer (L2)
    const api = new apigw.RestApi(this, "RestApi", {
      restApiName: "LakituApi",
      deployOptions: { stageName: "prod" },
    });

    // Add CORS headers to gateway responses for auth errors
    api.addGatewayResponse("Unauthorized", {
      type: apigw.ResponseType.UNAUTHORIZED,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'http://localhost:5173'",
        "Access-Control-Allow-Headers": "'Authorization,Content-Type'",
        "Access-Control-Allow-Methods": "'GET,POST,PUT,PATCH,DELETE,OPTIONS'",
      },
    });

    const authorizer = new apigw.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [userPool],
      }
    );

    const lambdaIntegration = new apigw.LambdaIntegration(handler, {
      proxy: true,
    });

    // We expose a proxy under /v1 to let the Lambda route internally.
    const v1 = api.root.addResource("v1");
    const proxy = v1.addResource("{proxy+}");

    // Handle all methods explicitly
    ["GET", "POST", "PUT", "PATCH", "DELETE"].forEach((method) => {
      proxy.addMethod(method, lambdaIntegration, {
        authorizationType: apigw.AuthorizationType.COGNITO,
        authorizer,
      });
      v1.addMethod(method, lambdaIntegration, {
        authorizationType: apigw.AuthorizationType.COGNITO,
        authorizer,
      });
    });

    // OPTIONS without auth for CORS
    proxy.addMethod("OPTIONS", lambdaIntegration);
    v1.addMethod("OPTIONS", lambdaIntegration);

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
        s3deploy.Source.data(
          "index.html",
          "<html><body>Deploy frontend to S3</body></html>"
        ),
      ],
      destinationBucket: siteBucket,
      distribution: dist,
    });

    // 6) Outputs
    new CfnOutput(this, "LakituApiBaseUrl", { value: api.url }); // ends with "/"
    new CfnOutput(this, "LakituItemsTableName", {
      value: userItemsTable.tableName,
    });
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
