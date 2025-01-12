const { Lambda, InvokeCommand } = require("@aws-sdk/client-lambda");

exports.handler = async function (event) {
  // Create a new Lambda client
  const lambda = new Lambda();

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
