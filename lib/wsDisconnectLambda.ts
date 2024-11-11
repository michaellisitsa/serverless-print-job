import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { ITable } from "aws-cdk-lib/aws-dynamodb";

export interface wsDisconnectLambdaProps {
  // the function for which we want to count url hits
  table: ITable;
}

// Lke a terraform module?
export class WebSocketDisconnectLambda extends Construct {
  // allow accessing the counter function
  public readonly handler: Function;

  constructor(scope: Construct, id: string, props: wsDisconnectLambdaProps) {
    super(scope, id);

    // So we are launching a DynamoDB database right in our terraform.

    this.handler = new Function(this, "ws-disconnect-lambda", {
      runtime: Runtime.NODEJS_18_X,
      handler: "ws-disconnect-lambda.handler",
      code: Code.fromAsset("lambda"),
      environment: {
        TABLE_NAME: props.table.tableName,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    // grant the lambda role read/write permissions to our table
    props.table.grantReadWriteData(this.handler);
  }
}
