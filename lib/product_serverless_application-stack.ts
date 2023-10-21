import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ProductConstruct } from "./modules";

export class ProductServerlessApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new ProductConstruct(this, "Products");
  }
}
