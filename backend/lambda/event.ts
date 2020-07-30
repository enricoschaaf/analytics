import { APIGatewayProxyHandlerV2 } from "aws-lambda"
import { Firehose } from "aws-sdk"
import Bowser from "bowser"
import { URL } from "url"

const deliveryStreamName = process.env.DELIVERY_STREAM_NAME
const firehose = new Firehose()

const eventHandler: APIGatewayProxyHandlerV2 = async (event) => {
  if (!event.body) throw Error
  const { name, screenSize } = JSON.parse(event.body)
  const bowser = Bowser.getParser(event.headers["user-agent"])
  const data = JSON.stringify({
    timestamp: Date.now(),
    name,
    domain: new URL(event.headers.origin).hostname,
    hostname: new URL(event.headers.origin).hostname,
    pathname: new URL(event.headers.origin).pathname,
    userId: "",
    sessionID: "",
    referer: new URL(event.headers.referer).hostname,
    referrerPathname: new URL(event.headers.referer).pathname,
    countryCode: event.headers["cloudfront-viewer-country"],
    screenSize:
      screenSize < 576
        ? "Mobile"
        : screenSize < 992
        ? "Tablet"
        : screenSize < 1440
        ? "Laptop"
        : screenSize >= 1440
        ? "Desktop"
        : undefined,
    operatingSystem: bowser.getOSName(),
    browser: bowser.getBrowserName()
  })

  await firehose
    .putRecord({
      DeliveryStreamName: deliveryStreamName,
      Record: { Data: Buffer.from(data) }
    })
    .promise()

  return { statusCode: 200 }
}

exports.handler = eventHandler
