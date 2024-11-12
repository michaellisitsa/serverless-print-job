const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} = require("@aws-sdk/client-apigatewaymanagementapi");
const { TextEncoder } = require("util");

// PDF dependencies
const PDFDocument = require("pdfkit");

// Import the DynamoDB Document Client.
const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

// Maps JS types to dynamoDB attributevalue.
const dynamoDBDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

exports.handler = async (event) => {
  console.log("Generate PDF Event:", JSON.stringify(event));

  const body = JSON.parse(event.body);
  const data = body.data;
  const connectionId = event.requestContext.connectionId;
  console.log("Received action", body.action);
  console.log("Received data string", data.value);

  // E.g. The user should not be able to mark in-progress any other job other than the one they've initiated.
  // Web sockets allow us to receive a follow-up message and identify it with the same sender
  // without authenticating the user.
  const updateCommand = new UpdateCommand({
    TableName: process.env.TABLE_NAME,
    Key: {
      jobId: `PrintJob-${connectionId}`,
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

  const doc = new PDFDocument();

  // Send a response message back to the client via WebSocket
  const apigwManagementApi = new ApiGatewayManagementApiClient({
    endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
  });

  const postData = JSON.stringify({
    message: "PDF generation started",
    jobId: `PrintJob-${connectionId}`,
  });

  const textEncoder = new TextEncoder();

  const postCommand = new PostToConnectionCommand({
    ConnectionId: connectionId, // Use the provided connection ID
    Data: textEncoder.encode(postData), // expects uint8array
  });

  try {
    await apigwManagementApi.send(postCommand);
    console.log("Message sent to client:", postData);
  } catch (error) {
    console.error("Failed to send message to client:", error);
  }

  return { statusCode: 200 };
};
