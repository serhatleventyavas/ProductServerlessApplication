import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { join } from "path";
import { Duration } from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import * as cdk from "aws-cdk-lib";

export class ProductConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const restApiId = "ProductApi";
    const dynamoProductTableName = "products";

    const dynamoProductTable = new Table(this, dynamoProductTableName, {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      tableName: dynamoProductTableName,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const productApiGateaway = new apigateway.RestApi(this, restApiId, {
      restApiName: "Product Api",
      description: "Product Rest Api",
      deploy: true,
      deployOptions: {
        stageName: "prod",
        tracingEnabled: true,
      },
      endpointTypes: [apigateway.EndpointType.EDGE],
    });

    const createProductFunction = new NodejsFunction(this, "CreateProduct", {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, "services", "create.ts"),
      timeout: Duration.minutes(1),
      memorySize: 512,
    });

    const putProductFunction = new NodejsFunction(this, "PutProduct", {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, "services", "update.ts"),
      timeout: Duration.minutes(1),
      memorySize: 512,
    });

    const deleteProductFunction = new NodejsFunction(this, "DeleteProduct", {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, "services", "delete.ts"),
      timeout: Duration.minutes(1),
      memorySize: 512,
    });

    const getProductListFunction = new NodejsFunction(this, "getProductList", {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, "services", "get-list.ts"),
      timeout: Duration.minutes(1),
      memorySize: 512,
    });

    dynamoProductTable.grantReadWriteData(createProductFunction);
    dynamoProductTable.grantReadData(getProductListFunction);
    dynamoProductTable.grantReadWriteData(putProductFunction);
    dynamoProductTable.grantReadWriteData(deleteProductFunction);

    const getProductListFunctionIntegration = new apigateway.LambdaIntegration(
      getProductListFunction
    );

    const createProductFunctionIntegration = new apigateway.LambdaIntegration(
      createProductFunction
    );

    const putProductFunctionIntegration = new apigateway.LambdaIntegration(
      putProductFunction
    );

    const deleteProductFunctionIntegration = new apigateway.LambdaIntegration(
      deleteProductFunction
    );

    const productResource = productApiGateaway.root.addResource("products", {});
    const productResourceWithId = productResource.addResource("{id}");

    productResource.addMethod("GET", getProductListFunctionIntegration);

    productResource.addMethod("POST", createProductFunctionIntegration);

    productResourceWithId.addMethod("PUT", putProductFunctionIntegration);

    productResourceWithId.addMethod("DELETE", deleteProductFunctionIntegration);
  }
}
