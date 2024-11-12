import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { IBucket } from "aws-cdk-lib/aws-s3";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import path = require("path");

export interface GeneratePDFLambdaProps {
  // the function for which we want to count url hits
  table: ITable;
  bucket: IBucket;
}

/**
 * Generate a PDF lambda that can read from a Dynamo DB table of jobs
 * and write data to an S3 bucket with relevant permissions
 * @param scope - default construct scope
 * @param id - Unique name for the construct
 * @param props - the table and bucket to use
 */
export class GeneratePDFLambda extends Construct {
  // allow accessing the counter function
  public readonly handler: Function;

  constructor(scope: Construct, id: string, props: GeneratePDFLambdaProps) {
    super(scope, id);

    const lambdaAppDir = path.resolve(__dirname, "../generatePdf");
    const sourceLocationParams: NodejsFunctionProps = {
      projectRoot: lambdaAppDir,
      entry: path.join(lambdaAppDir, "index.js"),
      depsLockFilePath: path.join(lambdaAppDir, "package-lock.json"),
    };

    this.handler = new NodejsFunction(this, "generatePdfBundled", {
      ...sourceLocationParams,
      runtime: Runtime.NODEJS_18_X,
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.bucket.bucketName,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    // grant the lambda role read/write permissions to our table
    props.table.grantReadWriteData(this.handler);
    props.bucket.grantReadWrite(this.handler);
  }
}
