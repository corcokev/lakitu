import "source-map-support/register.js";
import { App, Tags } from "aws-cdk-lib";
import { LakituStack } from "../lib/stack.js";
const app = new App();
Tags.of(app).add("Project", "Lakitu"); // <-- important: used by the IAM policy conditions
new LakituStack(app, "LakituStack", {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});
