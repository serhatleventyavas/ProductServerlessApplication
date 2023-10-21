import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { validate as uuidValidate } from "uuid";
import { ApiError } from "../../api-error";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const pathParameters = event.pathParameters ?? {};
    const productId = pathParameters["id"] ?? "";

    if (productId.length === 0) {
      throw new ApiError(400, "Product Id is required");
    }

    if (!uuidValidate(productId)) {
      throw new ApiError(400, "Product Id is not valid");
    }
    const client = new DynamoDBClient({});

    const command = new UpdateItemCommand({
      TableName: "products",
      Key: {
        id: {
          S: productId,
        },
      },
      UpdateExpression: "set is_deleted = :is_deleted",
      ConditionExpression: "id = :id and is_deleted = :current_is_deleted",
      ExpressionAttributeValues: {
        ":id": { S: productId },
        ":current_is_deleted": { BOOL: false },
        ":is_deleted": { BOOL: true },
      },
      ReturnValues: "ALL_NEW",
    });

    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Product is deleted",
      }),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        statusCode: error.statusCode,
        body: JSON.stringify({
          message: error.message,
        }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Unknown Error",
      }),
    };
  }
};
