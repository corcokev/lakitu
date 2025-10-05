import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Database } from "./constructs/database.js";
import { Auth } from "./constructs/auth.js";
import { Api } from "./constructs/api.js";
import { Frontend } from "./constructs/frontend.js";
import { LambdaFunction } from "./constructs/lambda.js";
import { CustomDomain } from "./constructs/custom-domain.js";
export interface LakituStackProps extends StackProps {
  domainName?: string;
  hostedZoneId?: string;
}

export class LakituStack extends Stack {
  constructor(scope: Construct, id: string, props?: LakituStackProps) {
    super(scope, id, props);

    const domainName = props?.domainName;
    const hostedZoneId = props?.hostedZoneId;

    // Create constructs
    const database = new Database(this, "Database");
    const frontend = new Frontend(this, "Frontend");

    // Custom domain setup
    const customDomain = domainName
      ? new CustomDomain(this, "CustomDomain", {
          domainName,
          hostedZoneId,
          distribution: frontend.distribution,
        })
      : undefined;

    const auth = new Auth(this, "Auth", {
      domainName: customDomain?.domainName,
      distribution: frontend.distribution,
    });
    const api = new Api(this, "Api", { userPool: auth.userPool });
    const lambda = new LambdaFunction(this, "Lambda", {
      tableName: database.userItemsTable.tableName,
      domainName: customDomain?.domainName,
    });

    // Grant permissions
    lambda.grantTableAccess(database.userItemsTable);

    // Add API integration
    api.addLambdaIntegration("v1", lambda.handler);

    // Outputs
    new CfnOutput(this, "LakituApiBaseUrl", { value: api.restApi.url });
    new CfnOutput(this, "LakituItemsTableName", {
      value: database.userItemsTable.tableName,
    });
    new CfnOutput(this, "LakituUserPoolId", {
      value: auth.userPool.userPoolId,
    });
    new CfnOutput(this, "LakituUserPoolClientId", {
      value: auth.userPoolClient.userPoolClientId,
    });
    new CfnOutput(this, "LakituCognitoDomain", {
      value: auth.domain.baseUrl(),
    });
    new CfnOutput(this, "LakituFrontendUrl", {
      value: customDomain
        ? `https://${customDomain.domainName}`
        : `https://${frontend.distribution.domainName}`,
    });

    if (customDomain) {
      new CfnOutput(this, "LakituHostedZoneId", {
        value: customDomain.hostedZone.hostedZoneId,
      });
    }
    new CfnOutput(this, "LakituCloudFrontUrl", {
      value: `https://${frontend.distribution.domainName}`,
    });
    new CfnOutput(this, "LakituSiteBucketName", {
      value: frontend.bucket.bucketName,
    });
    new CfnOutput(this, "LakituDistributionId", {
      value: frontend.distribution.distributionId,
    });
  }
}
