import { AthenaExpress } from "athena-express"
import { APIGatewayProxyHandlerV2 } from "aws-lambda"
import aws from "aws-sdk"

const bucketName = process.env.BUCKET_NAME
const athena = new AthenaExpress({
  aws,
  db: "analytics",
  getStats: true
})

const analyticsHandler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const data = await athena.query("SELECT * FROM data")
    return data
  } catch (error) {
    console.error(error)
    return { statusCode: 500, body: { error } }
  }
}

exports.handler = analyticsHandler
