import "source-map-support/register.js";
import { App, Tags } from "aws-cdk-lib";
import { LakituStack } from "../lib/stack.js";
import { GithubOidcStack } from "../lib/github.js";

const app = new App();
Tags.of(app).add("Project", "Lakitu");

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
};

new GithubOidcStack(app, "GithubOidcStack", { env });

new LakituStack(app, "LakituStack", { env });
