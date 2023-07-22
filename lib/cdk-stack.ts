import { Stack, Duration, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda'
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class GetContentStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);
		const API_KEY = process.env.API_KEY;
		const API_KEY_HEADER = process.env.API_KEY_HEADER;
		if (!API_KEY || !API_KEY_HEADER) throw new Error("API_KEY and API_KEY_HEADER must be set in the environment");

		const unfluffLayer = new LayerVersion(this, "unfluff-layer-id", {
			layerVersionName: 'unfluff-layer',
			code: Code.fromAsset(path.resolve(__dirname, 'layer/nodejs.zip')),
			compatibleRuntimes: [Runtime.NODEJS_18_X],
			description: "A layer to hold the 'unfluff' module",
		});

		const getContentLambda = new NodejsFunction(this, 'get-content-id', {
			functionName: 'get-content',
			handler: 'handler',
			entry: path.resolve(__dirname, 'lambda/get-content.ts'),
			runtime: Runtime.NODEJS_18_X,
			projectRoot: path.join(__dirname, '..'),
			layers: [unfluffLayer],
			timeout: Duration.seconds(15),
			bundling: {
				minify: false,
				externalModules: ['aws-sdk', 'unfluff'],
			},
			environment:{
				API_KEY: API_KEY,
				API_KEY_HEADER: API_KEY_HEADER,
			}
		});

		getContentLambda.node.addDependency(unfluffLayer);

		new apigw.LambdaRestApi(this, 'lambda-rest-api-endpoint', {
			handler: getContentLambda,
		});
	}
}
