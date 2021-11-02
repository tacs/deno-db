import { ModField, ModQueryBuilder } from "./internal-deps.ts";

export type ModelType = typeof Model;

export class Model {
	//[attribute: string]: string | number;

	/** db connection slug */
	static dbConnSlug: string;

	/** table name */
	static table: string;

	/** fields configuration */
	static fields: ModField.Fields;

	/** unique indexes that contain at least 2 columns - NOT SUPPORTED YET */
	static multipleUniques: Array<Array<string>>;

	/** primary key that contain at least 2 columns - NOT SUPPORTED YET */
	static multiplePrimary: Array<string>;

	static getRealModelInstance(): ModelType {
		//const model = (this.constructor) as unkown as ModelType; // instance
		return this.prototype.constructor as ModelType;
	}

	static q() {
		return new ModQueryBuilder.QueryBuilder(this.getRealModelInstance());
	}

	static getPrimaryField(): ModField.FieldType {
		const primaryField = Object.values(this.fields).find((field) => field.primary);
		return primaryField!;
	}

	static getForeignFields(): Array<ModField.FieldType> {
		const fields = new Array<ModField.FieldType>();

		for (const [fieldK, field] of Object.entries(this.fields)) {
			if (field.type === ModField.types.foreignKey) {
			fields.push(field);
			}
		}

		return fields;
	}
}