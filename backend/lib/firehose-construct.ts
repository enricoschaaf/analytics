import * as iam from "@aws-cdk/aws-iam"
import * as firehose from "@aws-cdk/aws-kinesisfirehose"
import * as s3 from "@aws-cdk/aws-s3"
import * as cdk from "@aws-cdk/core"

export class KinesisFirehose extends cdk.Construct {
  public readonly deliveryStreamName: string | undefined
  public readonly attrArn: string

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id)
    const firehoseBucket = new s3.Bucket(this, "firehoseBucket")
    const firehoseServiceRole = new iam.Role(this, "firehoseServiceRole", {
      assumedBy: new iam.ServicePrincipal("firehose.amazonaws.com")
    })

    firehoseServiceRole.addToPolicy(
      new iam.PolicyStatement({
        resources: [firehoseBucket.bucketArn, firehoseBucket.bucketArn + "/*"],
        actions: [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject"
        ]
      })
    )

    const { deliveryStreamName, attrArn } = new firehose.CfnDeliveryStream(
      this,
      "analyticsStream",
      {
        deliveryStreamName: "analyticsStream",
        s3DestinationConfiguration: {
          bucketArn: firehoseBucket.bucketArn,
          roleArn: firehoseServiceRole.roleArn,
          prefix:
            "analytics/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/",
          errorOutputPrefix:
            "error/!{firehose:random-string}/!{firehose:error-output-type}/!{timestamp:yyyy/MM/dd}/"
        }
      }
    )

    this.deliveryStreamName = deliveryStreamName
    this.attrArn = attrArn
  }
}
