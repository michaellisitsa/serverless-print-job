import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { WebSocketApi, WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";
import { HitCounter } from "./hitcounter";
import { WebSocketConnectLambda } from "./wsConnectLambda";
import { WebSocketDisconnectLambda } from "./wsDisconnectLambda";
import { GeneratePDFLambda } from "./generatePDFLambda";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";

export class HelloCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // REST API GATEWAY
    // The following HitCounter and hello lambda
    // demonstrate a pattern where the HitCounter lambda is an orchestrator lambda
    // that talks to the DB and also invokes and receives a response from the hello lambda
    const hello = new Function(this, "HelloHandler", {
      runtime: Runtime.NODEJS_18_X, // execution environment
      code: Code.fromAsset("lambda"), // code loaded from "lambda" directory
      handler: "hello.handler", // file is "hello", function is "handler"
    });

    // Lambda invokes another lambda. Similar to ClearCalcs pattern of having an orchestrator lambda or Rails Job
    const helloWithCounter = new HitCounter(this, "HelloHitCounter", {
      downstream: hello,
    });

    // defines an API Gateway REST API resource backed by our "hello" function.
    const gateway = new LambdaRestApi(this, "Endpoint", {
      handler: helloWithCounter.handler,
    });

    // WEB SOCKET API GATEWAY
    // If we want to decouple the request and response, maybe send multiple progress updates
    // we can use a web socket API.
    // Web Socket set up is covered in this tutorial:
    // https://buraktas.com/api-gateway-websocket-api-example-aws-cdk/

    const jobsTable = new Table(this, "JobsTable", {
      partitionKey: { name: "jobId", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const wsConnectLambda = new WebSocketConnectLambda(
      this,
      "WebSocketConnectionLambda",
      {
        table: jobsTable,
      }
    );

    const wsDisconnectLambda = new WebSocketDisconnectLambda(
      this,
      "WebSocketDisconnectionLambda",
      {
        table: jobsTable,
      }
    );

    const webSocketApi = new WebSocketApi(this, "TodosWebsocketApi", {
      // The expression that is used for routing messages to the appropriate backend integrations.
      // see https://docs.aws.amazon.com/apigateway/latest/developerguide/websocket-api-develop-routes.html
      // We are specifying the default action property below for clarity
      routeSelectionExpression: "$request.body.action",
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "ws-connect-integration",
          wsConnectLambda.handler
        ),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "ws-disconnect-integration",
          wsDisconnectLambda.handler
        ),
      },
    });

    const jobFilesBucket = new s3.Bucket(this, "JobFilesBucket");

    const generatePdfLambda = new GeneratePDFLambda(this, "GeneratePdfLambda", {
      table: jobsTable,
      bucket: jobFilesBucket,
    });

    // 1. Add a new message to send print equation
    // 2. On receipt of this message, find the corresponding dynamo db record
    // 3. Put the event on the event bus.
    // 4. On the event bus, we have a rule that triggers a lambda
    // 5. This lambda will do some maths on the event, create a PDF, and send it to s3 bucket

    webSocketApi.addRoute("generatePDF", {
      integration: new WebSocketLambdaIntegration(
        "generate-pdf-integration",
        generatePdfLambda.handler
      ),
    });

    webSocketApi.grantManageConnections(generatePdfLambda.handler);

    const webSocketStage = new WebSocketStage(this, "mystage", {
      webSocketApi,
      stageName: "prod",
      autoDeploy: true,
    });

    new CfnOutput(this, "WebSocketStageUrl", {
      value: `${webSocketApi.apiEndpoint}/${webSocketStage.stageName}`,
    });
  }
}
