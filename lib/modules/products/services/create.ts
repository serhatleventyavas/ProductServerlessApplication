import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import {
  AttributeValue,
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { ApiError } from "../../api-error";

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const requestBodyJSON = JSON.parse(event.body ?? "{}");
    const title = (requestBodyJSON["title"] ?? "") as string;
    const description = (requestBodyJSON["description"] ?? "") as string;
    const price = (requestBodyJSON["price"] ?? "") as string;

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

    const productId = uuidv4();

    const client = new DynamoDBClient({});

    const newRecord: Record<string, AttributeValue> = {
      id: {
        S: productId,
      },
      title: {
        S: title,
      },
      description: {
        S: description,
      },
      price: {
        N: parseFloat(price).toFixed(2),
      },
      is_deleted: {
        BOOL: false,
      },
      created_date: {
        S: new Date().toUTCString(),
      },
    };

    const command = new PutItemCommand({
      TableName: "products",
      Item: newRecord,
    });

    await client.send(command);

    return {
      statusCode: 201,
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
