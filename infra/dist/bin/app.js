import "source-map-support/register.js";
import { App } from "aws-cdk-lib";
import { LakituStack } from "../lib/stack.js";
const app = new App();
new LakituStack(app, "LakituStack", {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});
