import * as path from 'path'
import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda-nodejs'
import * as apigateway from '@aws-cdk/aws-apigateway'
import * as route53 from '@aws-cdk/aws-route53'
import * as route53Targets from '@aws-cdk/aws-route53-targets'
import * as certificateManager from '@aws-cdk/aws-certificatemanager'
import * as dotenv from 'dotenv'

dotenv.config()

export class DeploymentStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    /**
     * Define lambda handlers
     * */

    const handlerNBA = new lambda.NodejsFunction(this, 'CalendarNBAHandler', {
      entry: path.join(__dirname, '../../src/lambda/index.ts'),
      handler: 'nba',
      depsLockFilePath: path.join(__dirname, '../../package.json'),
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {},
    })

    const handlerCS = new lambda.NodejsFunction(this, 'CalendarCSHandler', {
      entry: path.join(__dirname, '../../src/lambda/index.ts'),
      handler: 'cs',
      depsLockFilePath: path.join(__dirname, '../../package.json'),
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {},
    })

    const handlerFootball = new lambda.NodejsFunction(this, 'CalendarFootballHandler', {
      entry: path.join(__dirname, '../../src/lambda/index.ts'),
      handler: 'football',
      depsLockFilePath: path.join(__dirname, '../../package.json'),
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {},
    })

    /**
     * Define API Gateway API's
     */

    const api = new apigateway.RestApi(this, 'calendar-api-gateway', {
      restApiName: 'Calendar API Service',
      description: 'This service serves Calendars.',
      domainName: {
        domainName: 'calendar.oskarrosen.io',
        certificate: certificateManager.Certificate.fromCertificateArn(
          this,
          'oskarrosen-io-cert',
          process.env.CM_CERT_ARN!,
        ),
      },
    })

    // resource /nba
    const calendarNBAResource = api.root.addResource('nba')
    calendarNBAResource.addMethod('GET', new apigateway.LambdaIntegration(handlerNBA))

    // resource /cs
    const calendarCSResource = api.root.addResource('cs')
    calendarCSResource.addMethod('GET', new apigateway.LambdaIntegration(handlerCS))

    // resource /football
    const calendarFootballResource = api.root.addResource('football')
    calendarFootballResource.addMethod('GET', new apigateway.LambdaIntegration(handlerFootball))

    /**
     * Setup Route53
     */

    const zone = route53.HostedZone.fromLookup(this, 'oskarrosen-io-zone', {
      domainName: 'oskarrosen.io',
    })

    const _aliasRecord = new route53.ARecord(this, 'calendar-api-alias-record', {
      zone,
      recordName: 'calendar',
      target: route53.RecordTarget.fromAlias(new route53Targets.ApiGateway(api)),
    })
  }
}
