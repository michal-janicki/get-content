// @ts-ignore
import unfluff from 'unfluff';
import * as process from "process";

type LambdaEvent = {
	path?: string,
	headers?: { [key: string]: string },
	queryStringParameters?: { url?: string }
};

const PATH = '/do';
const API_KEY_HEADER = process.env.API_KEY_HEADER;
const API_KEY = process.env.API_KEY

const LambdaEvent = (obj: any): obj is LambdaEvent => {
	return 'path' in obj && 'headers' in obj;
}

exports.handler = async (event: unknown, context: unknown) => {
	try {
		if (!event || !LambdaEvent(event)) throw new Error('Invalid or missing event');
		if (!context) throw new Error('Invalid or missing context');

		if (!event.headers) throw new Error('Missing headers');
		if (!API_KEY_HEADER || !API_KEY) throw new Error('Missing API_KEY_HEADER or API_KEY');
		if (event.headers[API_KEY_HEADER] !== API_KEY) {
			console.warn(`Invalid API key: ${event.headers[API_KEY_HEADER]}`);

			return {
				statusCode: 500,
			};
		}
		if (event.path !== PATH) throw new Error(`Invalid path. Expected ${PATH}`);
		if (!event.queryStringParameters || !event.queryStringParameters.url) {
			return {
				statusCode: 400,
				body: JSON.stringify({ error: 'URL parameter is required' }),
			};
		}

		const response = await fetch(event.queryStringParameters.url);
		const htmlData = await response.text();
		// @ts-ignore
		const extractedData = unfluff(htmlData);

		return {
			statusCode: 200,
			body: JSON.stringify(extractedData),
		};
	} catch (error) {
		if (error instanceof Error) {
			return {
				statusCode: 500,
				body: JSON.stringify({ error: error.message }),
			};
		}

		return { statusCode: 500 }
	}
};
