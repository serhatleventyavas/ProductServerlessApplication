import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import {
  AttributeValue,
  DynamoDBClient,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { validate as uuidValidate } from "uuid";
import { ApiError } from "../../api-error";

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const pathParameters = event.pathParameters ?? {};
    const productId = pathParameters["id"] ?? "";

    const requestBodyJSON = JSON.parse(event.body ?? "{}");
    const title = (requestBodyJSON["title"] ?? "") as string;
    const description = (requestBodyJSON["description"] ?? "") as string;
    const price = (requestBodyJSON["price"] ?? "") as string;

    if (productId.length === 0) {
      throw new ApiError(400, "Product Id is required");
    }

    if (!uuidValidate(productId)) {
      throw new ApiError(400, "Product Id is not valid");
    }

    if (title.length === 0) {
      throw new ApiError(400, "Title is required");
    }

    if (description.length === 0) {
      throw new ApiError(400, "Description is required");
    }

    if (price.length === 0) {
      throw new ApiError(400, "Price is required");
    }

    if (isNaN(Number(price))) {
      throw new ApiError(400, "Price is not valid");
    }

    const client = new DynamoDBClient({});

    const command = new UpdateItemCommand({
      TableName: "products",
      Key: {
        id: {
          S: productId,
        },
      },
      UpdateExpression:
        "set title = :title, description = :description, price = :price",
      ConditionExpression: "id = :id and is_deleted = :is_deleted",
      ExpressionAttributeValues: {
        ":title": { S: title },
        ":description": { S: description },
        ":price": { N: parseFloat(price).toFixed(2) },
        ":id": { S: productId },
        ":is_deleted": { BOOL: false },
      },
      ReturnValues: "ALL_NEW",
    });

    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: {
          title: title,
          description: description,
          price: price,
          id: productId,
        },
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
