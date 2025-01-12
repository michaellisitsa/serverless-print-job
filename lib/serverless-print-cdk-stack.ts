import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { Cors, LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { WebSocketApi, WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";
import { HitCounter } from "./hitcounter";

// Lambda constructs
import { WebSocketConnectLambda } from "./wsConnectLambda";
import { WebSocketDisconnectLambda } from "./wsDisconnectLambda";
import { GeneratePDFLambda } from "./generatePDFLambda";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

import { RemovalPolicy } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";

export class ServerlessPrintCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // REST API GATEWAY
    // The following HitCounter and random-phrase lambda
    // demonstrate a pattern where the HitCounter lambda is an orchestrator lambda
    // that talks to the DB and also invokes and receives a response from the random phrase lambda
    const randomPhraseLambda = new Function(this, "RandomPhrase", {
      runtime: Runtime.NODEJS_18_X, // execution environment
      code: Code.fromAsset("lambda"), // code loaded from "lambda" directory
      handler: "random-phrase.handler",
    });

    // Lambda invokes another lambda. Similar to ClearCalcs pattern of having an orchestrator lambda or Rails Job
    const randomPhraseWithCounter = new HitCounter(
      this,
      "RandomPhraseHitCounter",
      {
        downstream: randomPhraseLambda,
      }
    );

    // defines an API Gateway REST API resource backed by our "Random Phrase" function.
    const gateway = new LambdaRestApi(this, "Endpoint", {
      handler: randomPhraseWithCounter.handler,
      defaultCorsPreflightOptions: {
        allowMethods: [
          "GET",
          "HEAD",
          "POST",
          "OPTIONS",
          "PUT",
          "DELETE",
          "PATCH",
        ],
        allowOrigins: Cors.ALL_ORIGINS,
      },
    });

    // WEB SOCKET API GATEWAY
    // If we want to decouple the request and response, maybe send multiple progress updates
    // we can use a web socket API.
    // Web Socket set up is covered in this tutorial:
    // https://buraktas.com/api-gateway-websocket-api-example-aws-cdk/

    const wsConnectLambda = new WebSocketConnectLambda(
      this,
      "WebSocketConnectionLambda",
      {}
    );

    const wsDisconnectLambda = new WebSocketDisconnectLambda(
      this,
      "WebSocketDisconnectionLambda",
      {}
    );

    const webSocketApi = new WebSocketApi(this, "PrintWebsocketApi", {
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

    const jobFilesBucket = new s3.Bucket(this, "JobFilesBucket", {
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
    });

    const generatePdfLambda = new GeneratePDFLambda(this, "GeneratePdfLambda", {
      bucket: jobFilesBucket,
    });

    // 1. Add a new message to send print equation
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
