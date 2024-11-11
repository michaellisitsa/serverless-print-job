import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { WebSocketApi, WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";
import { HitCounter } from "./hitcounter";
import { WebSocketConnectLambda } from "./wsConnectLambda";
import { WebSocketDisconnectLambda } from "./wsDisconnectLambda";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy } from "aws-cdk-lib";

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

    const websocketConnectionsTable = new Table(this, "WebsocketConnections", {
      partitionKey: { name: "connectionId", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // We abstract the connect lambda into its own construct
    // where we can handle all the boilerplate code
    // and just pass in the table that both connect and disconnect lambdas will use
    const wsConnectLambda = new WebSocketConnectLambda(
      this,
      "WebSocketConnectionLambda",
      {
        table: websocketConnectionsTable,
      }
    );

    const wsDisconnectLambda = new WebSocketDisconnectLambda(
      this,
      "WebSocketDisconnectionLambda",
      {
        table: websocketConnectionsTable,
      }
    );

    const webSocketApi = new WebSocketApi(this, "TodosWebsocketApi", {
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
