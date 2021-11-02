import { _ModMySQL, _ModDex } from "./deps.ts";
import { ModModel, ModField, ModQueryBuilder } from "./internal-deps.ts";

export type ConfigType = {
	host: string,
	username: string,
	password: string,
	db: string
}

enum DbClientEnum {
	"mysql" = "mysql",
	"mysql2" = "mysql2"
}
export type DbClientType = keyof typeof DbClientEnum;

export const DEFAULT_DB_CONN_SLUG = "default";

type SyncOptionsType = {
	drop?: boolean,
	/** it will try to keep the data in the db models - NOT SUPPORTED YET */
	keepData?: boolean
};

export class Database {
	public static instances: { [key: string]: Database } = {};

	public dex: any;
	private client: _ModMySQL.Client = new _ModMySQL.Client();
	private models: Map<string, ModModel.ModelType> = new Map();
	private slug = DEFAULT_DB_CONN_SLUG;

	private async runSql(query: string) {
		console.log(81, query);
		let result;
		const parts = query.split(';').filter(v => v);
		for (let k=0; k<parts.length; k++) {
			const part = parts[k];
			result = (await this.client.execute(part));
			console.log(82, result);
			result = result.rows;
		}
		return result;
	}

	public async runQuery(sql: string): Promise<_ModMySQL.ExecuteResult> {
		console.log(91, sql);
		const result = await this.client.query(sql);
		console.log(92, `LastInsertId: ${result.lastInsertId} | Affected: ${result.affectedRows} |  Rows:`, result.rows);
		return result;
	}

	private async _createTable(model: ModModel.ModelType) {
		const query = this.dex.schema.createTable(model.table, (table: any) => {
			for (const [field, fieldModel] of Object.entries(model.fields)) {
				const isFk = fieldModel.type === ModField.types.foreignKey;
				let col;
				let fieldModelToCheck: ModField.FieldType = fieldModel;
				const fieldRef = fieldModel.reference;
				if (isFk && fieldRef) {
					fieldModelToCheck = fieldRef.field;
				}
				
				switch (fieldModelToCheck.type) {
					case ModField.types.boolean:
						col = table.boolean(field);
						break;

					case ModField.types.decimal:
						col = table.decimal(field, fieldModelToCheck.precision ?? null);
						break;
					case ModField.types.float:
						col = table.float(field, fieldModelToCheck.precision ?? null);
						break;
					case ModField.types.integer:
						col = table.integer(field);
						break;
					case ModField.types.bigInteger:
						col = table.bigInteger(field);
						break;

					case ModField.types.string:
						col = table.string(field, fieldModelToCheck.length ?? null);
						break;
					case ModField.types.text:
						col = table.text(field);
						break;
					case ModField.types.mediumText:
						col = table.text(field, 'mediumtext');
						break;
					case ModField.types.longText:
						col = table.text(field, 'longtext');
						break;

					case ModField.types.date:
						col = table.date(field);
						break;
					case ModField.types.dateTime:
						col = table.datetime(field);
						break;
					case ModField.types.time:
						col = table.time(field);
						break;
					case ModField.types.timestamp:
						col = table.timestamp(field);
						break;

					case ModField.types.enum:
						col = table.enum(field, fieldModelToCheck.values ?? null);
						break;

					case ModField.types.json:
						col = table.json(field);
						break;

					case ModField.types.uuid:
						col = table.uuid(field);
						break;
				}

				if (isFk && fieldRef) {
					table.foreign(field)/*.onDelete('set null')*/.references(fieldRef.model.table + "." + fieldRef.field._name);
					//col = table.foreign(field).references(fieldRef.model.table + "." + fieldRef.field._name);
					//col = col.foreign(field).references(fieldRef.model.table + "." + fieldRef.field._name);
				} else {
					if (fieldModel.primary) {
						col = col.primary();
					}
					// the 2nd parameter is not working even though the docs say it does //https://knexjs.org/#Schema-increments
					if (false && fieldModel.autoIncrement) {
						table.increments(field, { primaryKey: false });
					}
				}

				if (fieldModel.index) {
					col = col.index();
				}
				if (fieldModel.notNull) {
					col = col.notNullable();
				}
				if (fieldModel.unique) {
					col = col.unique();
				}
			}

			if (model.multipleUniques && Array.isArray(model.multipleUniques)) {
				model.multipleUniques.forEach(v => table.unique(v));
			}
			//  for consistency, we need to add option for multiple FKs, if this is to be enabled
			if (false && model.multiplePrimary && Array.isArray(model.multiplePrimary)) {
				table.primary(model.multiplePrimary);
			}
		}).toString();

		await this.runSql(query);
	}

	private async _tableExists(model: ModModel.ModelType) {
		const query = this.dex.schema.hasTable(model.table).toString();
		const tableExists = (await this.runQuery(query)).rows!.length > 0;
		return tableExists;
	}

	private async _dropTable(model: ModModel.ModelType) {
		const query = this.dex.schema.dropTableIfExists(model.table).toString();
		await this.runQuery(query);
	}

	private async _backupTable(model: ModModel.ModelType) {
		const data = await new ModQueryBuilder.QueryBuilder(model).fetch();
		if (data.all().length === 0) {
			return;
		}

		const backupModel = Object.assign({}, model);
		backupModel.table += "_backup";
		await this._dropTable(backupModel);

		await this._createTable(backupModel);
		
		if (data) {
			await new ModQueryBuilder.QueryBuilder(backupModel).insert(data);
		}
	}

	/** get the DB instance attached to a certain model */
	public static getInstance(model: ModModel.ModelType): Database {
		const db = this.instances[model.dbConnSlug];
		return db;
	}

	/**
	 * creates the connection to the DB
	 * @param options options for the db client
	 * @param slug identifies this connection, in case you need to have multiple connections on different models
	*/
	public static async connect(options: ConfigType, clientEngine: DbClientType, slug?: string): Promise<Database> {
		const db = new this();
		if (slug) {
			if (this.instances[slug]) throw `Database connection '${slug}' already exists, please give a different slug.`;

			db.slug = slug;
		}
		
		db.dex = await _ModDex({
			client: clientEngine,
			/*connection: {
				host: options.host,
				port: 3306,
				user: options.username,
				password: options.password,
				database: options.db
			}*/
		});
		//console.log(77, db._dex.context.client);

		const clientOptions: _ModMySQL.ClientConfig = {
			hostname: options.host,
			username: options.username,
			password: options.password,
			db: options.db,
			//poolSize: 100
		};
		const client = await new _ModMySQL.Client().connect(clientOptions);
		//console.log(44, client.pool, client);

		db.client = client;

		this.instances[db.slug] = db;
		return db;
	}

	/** attach models to DB: tables are created sequentially so please be aware of the FK creation logic */
	public attachModels(...models: ModModel.ModelType[]) {
		models.forEach(model => {
			// checkers for model's mandatory data

			if (!model.dbConnSlug) {
				model.dbConnSlug = DEFAULT_DB_CONN_SLUG;
				//throw `Model init error: DB connection slug is not set in model '${model.name}'`;
			}
	
			if (!model.table) throw `Model init error: table is not set in model '${model.name}'`;
			if (!model.fields) throw `Model init error: fields are not set in model '${model.name}'`;
	
			let hasPrimary = false;
			for (const [slug, fieldObj] of Object.entries(model.fields)) {
				const field = fieldObj as ModField.FieldType;

				field._name = slug;

				/*if (!field.alias) {
					model.fields[slug].alias = slug;
				}*/

				if (field.primary) {
					hasPrimary = true;
				}
	
				if (field.type===ModField.types.foreignKey && !field.reference) throw `Fields with type '${ModField.types.foreignKey}' must have a 'reference' key (you can define it by adding a 'reference' key in the field object)`;
			}

			if (!hasPrimary) {
				throw `Model init error: no primary key is set in model '${model.name}'`;
			}

			this.models.set(model.name, model);
		});
	}

	/** sync the DB, allowing to drop all model's tables, but also allowing to keep the data (a new table with sufix _backup will be created if data exists) */
	public async sync(options?: SyncOptionsType) {
		// first drop all tables if requested
		if (options?.drop) {
			for (const modelEntry of Array.from(this.models).reverse().entries()) {
				const model = modelEntry[1][1];
				if (options.keepData) {
					await this._backupTable(model);
				}
				await this._dropTable(model);
			}
		}

		// recreate all tables
		for (const [modelName, model] of this.models) {
			await this._createTable(model);
		}
	}
}