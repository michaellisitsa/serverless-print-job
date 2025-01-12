import { IFunction, Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export interface HitCounterProps {
  // the function for which we want to count url hits
  downstream: IFunction;
}

export class HitCounter extends Construct {
  // allow accessing the counter function
  public readonly handler: Function;

  constructor(scope: Construct, id: string, props: HitCounterProps) {
    super(scope, id);

    this.handler = new Function(this, "HitCounterHandler", {
      runtime: Runtime.NODEJS_18_X,
      handler: "hitcounter.handler",
      code: Code.fromAsset("lambda"),
      environment: {
        DOWNSTREAM_FUNCTION_NAME: props.downstream.functionName,
      },
    });

    props.downstream.grantInvoke(this.handler);
  }
}
