const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const { Lambda, InvokeCommand } = require("@aws-sdk/client-lambda");

exports.handler = async function (event) {
  // Create a new DynamoDB client
  const dynamo = new DynamoDB();

  // Create a new Lambda client
  const lambda = new Lambda();

  await dynamo.updateItem({
    // This is dynamically inserted by CDK
    TableName: process.env.HITS_TABLE_NAME,
    Key: { path: { S: event.path } },
    UpdateExpression: "ADD hits :incr",
    ExpressionAttributeValues: { ":incr": { N: "1" } },
  });

  // call downstream function and capture response
  const command = new InvokeCommand({
    FunctionName: process.env.DOWNSTREAM_FUNCTION_NAME,
    Payload: JSON.stringify(event),
  });

  const { Payload } = await lambda.send(command);
  const result = Buffer.from(Payload).toString();
  console.log("downstream result:", JSON.stringify(result, undefined, 2));
  return JSON.parse(result);
};
