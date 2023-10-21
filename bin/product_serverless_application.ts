#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ProductServerlessApplicationStack } from "../lib/product_serverless_application-stack";

const app = new cdk.App();
new ProductServerlessApplicationStack(
  app,
  "ProductServerlessApplicationStack",
  {}
);
