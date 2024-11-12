const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

// Import the DynamoDB Document Client.
const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

// Maps JS types to dynamoDB attributevalue.
const dynamoDBDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

exports.handler = async (event) => {
  console.log("Generate PDF Event:", JSON.stringify(event));

  const body = JSON.parse(event.body);
  const data = body.data;

  console.log("Received action", body.action);
  console.log("Received data string", data.value);

  const updateCommand = new UpdateCommand({
    TableName: process.env.TABLE_NAME,
    Key: {
      jobId: `PrintJob-${event.requestContext.connectionId}`,
    },
    UpdateExpression: "SET #status = :newStatus",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":newStatus": "in-progress",
    },
  });

  const response = await dynamoDBDocClient.send(updateCommand);
  console.log("updateCommand response:", JSON.stringify(response));
  return { statusCode: 200 };
};
