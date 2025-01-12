import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export interface wsDisconnectLambdaProps {
  // the function for which we want to count url hits
}

// Lke a terraform module?
export class WebSocketDisconnectLambda extends Construct {
  // allow accessing the counter function
  public readonly handler: Function;

  constructor(scope: Construct, id: string, props: wsDisconnectLambdaProps) {
    super(scope, id);

    this.handler = new Function(this, "ws-disconnect-lambda", {
      runtime: Runtime.NODEJS_18_X,
      handler: "ws-disconnect-lambda.handler",
      code: Code.fromAsset("lambda"),
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
      },
    });
  }
}
