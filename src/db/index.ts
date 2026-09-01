import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _sql: ReturnType<typeof postgres> | null = null;

function getConnection() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("DATABASE_URL environment variable is not set");
	}
	if (!_sql) {
		_sql = postgres(databaseUrl, {
			max: 10,
			ssl: "require",
			idle_timeout: 20,
			connect_timeout: 10,
		});
	}
	if (!_db) {
		_db = drizzle(_sql, { schema });
	}
	return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
	get(_target, prop, receiver) {
		const instance = getConnection();
		const value = Reflect.get(instance, prop, receiver);
		if (typeof value === "function") {
			return value.bind(instance);
		}
		return value;
	},
});
