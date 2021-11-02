import { ModDatabase, ModQueryResult, ModModel, ModField } from "./internal-deps.ts";

type WhereTypeId = number | string;
type WhereTypeFieldValue = [string, number | string | boolean];
enum WhereOperators {
	EQUAL = '=',
	GREATER = '>',
	GREATER_OR_EQUAL = '>=',
	IN = 'IN',
	LIKE = 'LIKE',
	LOWER = '<',
	LOWER_OR_EQUAL = '<='
}
export type WhereTypeOperator = WhereOperators;
type WhereTypeFieldOperatorValue = [string, WhereOperators, number | string | boolean ]
export type WhereType = WhereTypeId | WhereTypeFieldValue| WhereTypeFieldOperatorValue;

/** dismember a full alias into table + field */
export function dismemberField(fullAlias: string): { table: string, field: string} {
	const [field, table] = fullAlias.split('.').reverse();
	return { table, field };
};

export class QueryBuilder {
	_model!: ModModel.ModelType;
	_from!: string;
	_select: Array<string> = [];
	_where: Array<string> = [];
	_joins: Array<Array<ModField.FieldType>> = [];
	_limit?: number;
	_offset?: number;

	constructor(model: ModModel.ModelType) {
		this._model = model;

		this._from = model.table;
	}

	/** adds fields to the select clause */
	select(fields: Array<string>): QueryBuilder {
		fields.forEach(field => this._select.push(field));
		return this;
	}

	/** adds a where clause to look up for the primary key */
	wherePk(pkValue: number | string | Array<number | string>) {
		const field = this._model.getPrimaryField();
		if (Array.isArray(pkValue)) {
			this.whereIn(field._name!, pkValue).limit(pkValue.length);
		} else {
			this.whereIs(field._name!, pkValue).limit(1);
		}
		return this;
	}

	/** adds a where clause to look up for the 'field' that equals a 'value' */
	whereIs(field: string, value: number | string | boolean) {
		this.where(field, '=', value);
		return this;
	}

	/** adds a null condition to the where clause */
	whereNull(field: string) {
		this.where(field, ' IS ', null);
		return this;
	}

	/** adds a where clause to look up for the 'field' that's greater than 'value' */
	whereGreater(field: string, value: number | string) {
		this.where(field, '>', value);
		return this;
	}

	/** adds a where clause to look up for the 'field' that's greater 'value' or equal */
	whereGreaterOrEqual(field: string, value: number | string) {
		this.where(field, '>=', value);
		return this;
	}

	/** adds a where clause to look up for the 'field' that's greater than 'value' */
	whereLower(field: string, value: number | string) {
		this.where(field, '<', value);
		return this;
	}

	/** adds a where clause to look up for the 'field' that's greater 'value' or equal */
	whereLowerOrEqual(field: string, value: number | string) {
		this.where(field, '<=', value);
		return this;
	}
			
	/** adds a where clause to look up for the 'field' using a IN clause */
	whereIn(field: string, values: Array<number | string | boolean>) {
		this.where(field, ' IN', values);
		return this;
	}

	/** adds a where clause to look up for the 'field' using a LIKE clause */
	whereLike(field: string, expr: string) {
		this.where(field, ' LIKE ', expr);
		return this;
	}

	/** adds a where clause to look up for the 'field' using an 'operator' */
	where(alias: string, operator: string, value: any) {
		const db = ModDatabase.Database.instances[this._model.dbConnSlug];

		const { table, field } = dismemberField(alias);

		if (operator === WhereOperators.IN) {
			value = `('${value.join(',')}')`;
		} else if (value === null) {
			value = `NULL`;
		} else {
			value = `'${value}'`;
		}

		this._where.push(`${db.dex.ref(table + '.' + field)} ${operator} ${value}`);
		return this;
	}

	/** adds a raw condition to the where clause */
	whereRaw(condition: string | Array<string>): QueryBuilder {
		if (!Array.isArray(condition)) condition = [condition];
		this._where.push(...condition);
		return this;
	}

	/** join tables by using a field from Model.Fields - eg. a list model contains many items, so Item.join(Item.fields.list_id, List.fields.created_by).fetch() will return all items with the list_id replaced by the list object and the created_by in the list object for the created by object (assuming an user) */
	join(...fields: Array<ModField.FieldType>): QueryBuilder {
		this._joins.push(fields);
		return this;
	}

	/** adds a limit */
	limit(num: number): QueryBuilder {
		this._limit = num;
		return this;
	}

	/** adds an offset */
	offset(num: number): QueryBuilder {
		this._offset = num;
		return this;
	}

	/** runs an insert query */
	async insert(dataArgs: Record<string,any> | Array<Record<string,any>>): Promise<ModModel.Model | Array<ModModel.Model>> {
		const db = ModDatabase.Database.getInstance(this._model);

		const insertedIds: Array<number> = [];

		const data = Array.isArray(dataArgs) ? dataArgs : [dataArgs];

		for (const insertData of data) {
			const query = await db.dex.queryBuilder()
				.from(this._model.table)
				.insert(insertData)
				.toString();
			const result = await db.runQuery(query);
			const insertedId = result.lastInsertId ?? insertData[this._model.getPrimaryField()._name!];
			insertedIds.push(insertedId);
		}

		const resultData = await new QueryBuilder(this._model).wherePk(insertedIds).fetch();
		return data.length === 1 ? resultData[0] : resultData;
	}

	/** runs an update query */
	async update(data: Record<string,any>): Promise<ModModel.Model> {
		const db = ModDatabase.Database.getInstance(this._model);

		let query = db.dex.queryBuilder()
			.from(this._model.table)
			.update(data);

		for (const where of this._where) {
			query.whereRaw(where);
		}
		
		query = query.toString();
		await db.runQuery(query);

		const resultData = await new QueryBuilder(this._model).whereRaw(this._where).fetch();
		return resultData;
	}

	/** runs a delete query */
	async delete(): Promise<ModModel.Model> {
		const db = ModDatabase.Database.getInstance(this._model);

		let query = await db.dex.queryBuilder()
			.from(this._model.table)
			.delete();

		for (const where of this._where) {
			query.whereRaw(where);
		}
		
		query = query.toString();
		await db.runQuery(query);

		const resultData = await new QueryBuilder(this._model).whereRaw(this._where).fetch();
		return resultData;
	}

	/** runs a select query */
	async fetch(): Promise<Array<ModModel.Model | any>> {
		const db = ModDatabase.Database.getInstance(this._model);

		let query = db.dex
			.from(this._from);
			
		if (this._select.length > 0) {
			query.select(this._select);
		}

		/*const joinFieldMap: Record<string, Array<string>> = {};
		if (queryBuilder._joins) {
			const tablesCounter: Record<string, number> = {};
			for (let k=0; k<queryBuilder._joins.length; k++) {
				const joinFields = queryBuilder._joins[k];
				for (let k=0; k<joinFields.length; k++) {
					const joinField = joinFields[k];

					joinFieldMap[joinField._name!] = [];

					const table1 = k===0 ? queryBuilder._from : joinFields[k-1].reference?.model.table!;
					const table1Counter = tablesCounter[table1];
					const table1Alias = table1 + (table1Counter ? table1Counter : '');

					const table2 = joinField.reference?.model.table!;
					let table2Counter = 0;
					if (tablesCounter[table2] === undefined) {
						table2Counter = tablesCounter[table2] = 0;
					} else {
						table2Counter = ++tablesCounter[table2];
					}

					const table2Alias = table2 + (table2Counter>0 ? table2Counter.toString() : '');
					query.join(
						db._dex.ref(table2 + (table2Counter>0 ? (` AS ${table2Alias}`) : '')),
						db._dex.ref(table2Alias + '.' +joinField.reference?.field._name!),
						'=',
						db._dex.ref(table1Alias + '.' + joinField._name!)
					);

					query.select(`${queryBuilder._from}.*`);
					for (const [fieldK, field] of Object.entries(joinField.reference?.model.fields!)) {
						const fieldAlias = `${table2Alias}__${fieldK}`;
						query.select(db._dex.ref(`${table2Alias}.${fieldK} AS ${fieldAlias}`));
						joinFieldMap[joinField._name!].push(fieldAlias);
					}
				}
			}

			//query.groupBy(queryBuilder._from + '.' + queryBuilder._model.getPrimaryField()._name);
		}*/

		for (const where of this._where) {
			query.whereRaw(where);
		}

		if (this._limit) {
			query.limit(this._limit);
		}
		if (this._offset) {
			query.offset(this._offset);
		}

		query = query.toString();

		const rows = (await db.runQuery(query)).rows ?? [];
		/*for (const row of rows!) {
			/*for (const [joinField, fields] of Object.entries(joinFieldMap)) {
				const joinData: Record<string,string> = {};
				for (const field of fields) {
					const newFieldName = field.split('__');
					newFieldName.shift();
					joinData[newFieldName.join('__')] = row[field];
					delete row[field];
				}
				row[joinField] = joinData;
			}
		}*/
		const cache: any = {}
		for (const row of rows) {
			for (const join of this._joins) {
				let col = row;
				for (const joinField of join) {
					const joinFieldName = joinField._name!;
					const joinFieldId = col[joinFieldName];
					if (!joinFieldId) {
						throw `An error occurred when trying to join '${joinFieldName}'`;
					}

					if (!cache[joinField.reference?.model.name!]) {
						cache[joinField.reference?.model.name!] = {};
					}
					if (!cache[joinField.reference?.model.name!][joinFieldName]) {
						cache[joinField.reference?.model.name!][joinFieldName] = {};
					}

					if (!cache[joinField.reference?.model.name!][joinFieldName][joinFieldId]) {
						const fieldObj = await joinField.reference?.model.q().wherePk(joinFieldId).fetchFirst();
						cache[joinField.reference?.model.name!][joinFieldName][joinFieldId] = fieldObj; 
					}

					const newJoinFieldName = joinFieldName + '_model';
					col[newJoinFieldName] = cache[joinField.reference?.model.name!][joinFieldName][joinFieldId];
					col = col[newJoinFieldName];
				}
			}
		}

		const result = new ModQueryResult.QueryResult(rows);
		return result;
	}

	/** runs a select query and returns the first result */
	async fetchFirst(): Promise<ModModel.ModelType> {
		return (await this.fetch()).first();
	}
}