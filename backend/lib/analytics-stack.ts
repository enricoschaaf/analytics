import * as apigateway from "@aws-cdk/aws-apigatewayv2"
import * as cloudfront from "@aws-cdk/aws-cloudfront"
import * as iam from "@aws-cdk/aws-iam"
import * as lambda from "@aws-cdk/aws-lambda-nodejs"
import * as s3 from "@aws-cdk/aws-s3"
import * as cdk from "@aws-cdk/core"
import { KinesisFirehose } from "./firehose-construct"

export class AnalyticsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)
    const athenaBucket = new s3.Bucket(this, "athenaBucket")
    const { deliveryStreamName, attrArn } = new KinesisFirehose(
      this,
      "AnalyticsStack"
    )

    if (!deliveryStreamName)
      throw new Error("analyticsFirehose.deliveryStreamName undefined")

    const eventLambda = new lambda.NodejsFunction(this, "eventLambda", {
      entry: "lambda/event.ts",
      environment: {
        DELIVERY_STREAM_NAME: deliveryStreamName
      }
    })

    eventLambda.addToRolePolicy(
      new iam.PolicyStatement({
        resources: [attrArn],
        actions: ["firehose:PutRecord"]
      })
    )

    const analyticsLambda = new lambda.NodejsFunction(this, "analyticsLambda", {
      entry: "lambda/analytics.ts",
      environment: {
        BUCKET_NAME: athenaBucket.bucketName
      }
    })

    analyticsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        resources: [
          "arn:aws:athena:eu-central-1:082841543026:workgroup/primary"
        ],
        actions: ["athena:*"]
      })
    )

    analyticsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["s3:*"]
      })
    )

    const analyticsApi = new apigateway.HttpApi(this, "AnalyticsApi", {
      corsPreflight: { allowOrigins: ["*"] }
    })

    analyticsApi.addRoutes({
      path: "/event",
      methods: [apigateway.HttpMethod.POST],
      integration: new apigateway.LambdaProxyIntegration({
        handler: eventLambda
      })
    })

    analyticsApi.addRoutes({
      path: "/analytics",
      methods: [apigateway.HttpMethod.GET],
      integration: new apigateway.LambdaProxyIntegration({
        handler: analyticsLambda
      })
    })

    if (!analyticsApi.url) throw new Error("analyticsApi.url undefined")

    new cloudfront.CloudFrontWebDistribution(this, "AnalyticsDistribution", {
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      originConfigs: [
        {
          customOriginSource: {
            domainName: `${analyticsApi.httpApiId}.execute-api.${this.region}.${this.urlSuffix}`
          },
          behaviors: [
            {
              allowedMethods: cloudfront.CloudFrontAllowedMethods.ALL,
              isDefaultBehavior: true,
              forwardedValues: {
                queryString: false,
                headers: ["CloudFront-Viewer-Country", "user-agent", "referer"]
              }
            }
          ]
        }
      ]
    })

    new cdk.CfnOutput(this, "httpApiEndpoint", {
      value: analyticsApi.url
    })
  }
}
