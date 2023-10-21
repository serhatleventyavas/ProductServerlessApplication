import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { ApiError } from "../../api-error";

export interface ProductDto {
  id: string;
  title: string;
  description: string;
  price: number;
}

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const client = new DynamoDBClient({});

    const command = new ScanCommand({
      FilterExpression: "is_deleted = :is_deleted",
      ExpressionAttributeValues: {
        ":is_deleted": { BOOL: false },
      },
      TableName: "products",
    });

    const response = await client.send(command);

    const productList: ProductDto[] = (response.Items ?? []).map((p) => {
      return {
        id: p["id"].S ?? "",
        title: p["title"].S ?? "",
        description: p["description"].S ?? "",
        price: parseFloat(p["price"].N ?? "0.0"),
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: productList,
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
