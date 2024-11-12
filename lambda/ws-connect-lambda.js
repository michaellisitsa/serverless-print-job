const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

// Import the DynamoDB Document Client.
const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

// Maps JS types to dynamoDB attributevalue.
const dynamoDBDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

exports.handler = async (event) => {
  console.log("Connection Event:", JSON.stringify(event));

  const putCommand = new PutCommand({
    TableName: process.env.TABLE_NAME,
    Item: {
      jobId: `PrintJob-${event.requestContext.connectionId}`,
      connectionId: event.requestContext.connectionId,
      status: "pending",
    },
  });

  const response = await dynamoDBDocClient.send(putCommand);
  console.log("putCommand response:", JSON.stringify(response));
  return { statusCode: 200 };
};
