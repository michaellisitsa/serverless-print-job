const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

// Import the DynamoDB Document Client.
const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

// Maps JS types to dynamoDB attributevalue.
const dynamoDBDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

exports.handler = async (event) => {
  console.log("Disconnection Event:", JSON.stringify(event));

  const deleteCommand = new DeleteCommand({
    TableName: process.env.TABLE_NAME,
    Key: {
      connectionId: event.requestContext.connectionId,
    },
  });
  const resp = await dynamoDBDocClient.send(deleteCommand);
  console.log(`deleteCommand resp => ${JSON.stringify(resp)}`);

  return { statusCode: 200 };
};
