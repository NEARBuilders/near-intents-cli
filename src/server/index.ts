import { serve } from "@hono/node-server";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createPluginRuntime } from "every-plugin";
import { formatORPCError } from "every-plugin/errors";
import { onError } from "every-plugin/orpc";
import { Hono } from "hono";
import { cors } from "hono/cors";
import NearIntentsPlugin from "../every-plugin";

export async function startServer(port = 4000) {
	const app = new Hono<{ Variables: { privateKey?: string } }>();
	app.use("/*", cors({ origin: "*" }));

	// Root endpoint
	app.get("/", (c) => {
		return c.json({
			ok: true,
			name: "near-intents-http-api",
			version: "1.0.0",
			description: "NEAR Intents HTTP API",
			endpoints: {
				health: "/",
				rpc: "/api/rpc",
				docs: "/api",
			},
			authentication: "Use 'Authorization: Bearer <private-key>' header",
		});
	});

	// Create plugin runtime
	const runtime = createPluginRuntime({
		registry: { "near-intents": { module: NearIntentsPlugin } },
	});

	// Use plugin with empty config
	const { router } = await runtime.usePlugin("near-intents", {
		variables: {},
		secrets: {},
	});

	// Create RPC handler with error handling
	const rpcHandler = new RPCHandler(router, {
		interceptors: [onError((error) => formatORPCError(error))],
	});

	// Create OpenAPI handler
	const apiHandler = new OpenAPIHandler(router, {
		plugins: [
			new OpenAPIReferencePlugin({
				schemaConverters: [new ZodToJsonSchemaConverter()],
				specGenerateOptions: {
					info: { title: "NEAR Intents API", version: "1.0.0" },
					servers: [{ url: `http://localhost:${port}/api` }],
				},
			}),
		],
		interceptors: [onError((error) => formatORPCError(error))],
	});

	// Middleware to extract privateKey from Authorization header
	app.use("/api/*", async (c, next) => {
		const authHeader = c.req.header("authorization");
		const privateKey = authHeader?.startsWith("Bearer ")
			? authHeader.slice(7)
			: null;

		if (privateKey) {
			c.set("privateKey", privateKey);
		}
		await next();
	});

	// Mount OpenAPI docs endpoint
	app.all("/api", async (c) => {
		const apiResult = await apiHandler.handle(c.req.raw, {
			prefix: "/api",
			context: {},
		});
		return apiResult.response
			? new Response(apiResult.response.body, apiResult.response)
			: c.text("Not Found", 404);
	});

	// Mount RPC endpoint
	app.all("/api/rpc/*", async (c) => {
		const privateKey = c.get("privateKey");

		const rpcResult = await rpcHandler.handle(c.req.raw, {
			prefix: "/api/rpc",
			context: { privateKey },
		});

		return rpcResult.response
			? new Response(rpcResult.response.body, rpcResult.response)
			: c.text("Not Found", 404);
	});

	console.log(`NEAR Intents Server running on http://localhost:${port}`);
	console.log(`RPC endpoint: http://localhost:${port}/api/rpc`);
	console.log(`API docs: http://localhost:${port}/api`);
	console.log(
		"\nAuthentication: Include 'Authorization: Bearer <private-key>' header",
	);
	console.log(
		"Example: curl -H 'Authorization: Bearer YOUR_KEY' http://localhost:4000/api/rpc/swap/execute",
	);

	return serve({
		fetch: app.fetch,
		port,
	});
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const port = process.env.PORT ? Number(process.env.PORT) : 4000;
	startServer(port).catch(console.error);
}
