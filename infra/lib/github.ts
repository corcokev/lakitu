import {
  Stack,
  StackProps,
  CfnOutput,
  Duration,
  aws_iam as iam,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class GithubOidcStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 1) Create the GitHub OIDC Provider in IAM
    // GitHub recommends including both current & previous thumbprints
    const provider = new iam.OpenIdConnectProvider(this, "GitHubOidcProvider", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
      thumbprints: [
        "6938fd4d98bab03faadb97b34396831e3780aea1",
        "1b511abead59c6ce207077c0bf0e0043b1382612",
      ],
    });

    // 2) Create a role the workflow will assume via OIDC
    const githubOrg = "corcokev";
    const githubRepo = "lakitu";
    const githubBranch = "main";

    const principal = new iam.OpenIdConnectPrincipal(provider).withConditions({
      StringEquals: {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      },
      StringLike: {
        // Limit to your repo & branch; add more patterns if needed
        "token.actions.githubusercontent.com:sub": `repo:${githubOrg}/${githubRepo}:ref:refs/heads/${githubBranch}`,
      },
    });

    const role = new iam.Role(this, "GitHubActionsLakituRole", {
      roleName: "GitHubActionsLakituRole",
      assumedBy: principal,
      maxSessionDuration: Duration.hours(1),
      description: "GitHub Actions OIDC role for Lakitu CDK deploys",
    });

    // 3) Permissions (you can paste the least-privilege policy we discussed)
    role.addToPolicy(
      new iam.PolicyStatement({
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
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["iam:PassRole"],
        resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
        conditions: {
          StringEquals: {
            "iam:PassedToService": "cloudformation.amazonaws.com",
          },
        },
      })
    );

    new CfnOutput(this, "GitHubActionsRoleArn", { value: role.roleArn });
  }
}
