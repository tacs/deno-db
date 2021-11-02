import { ModModel } from "./internal-deps.ts";

export type Alias = string;

export type AutoIncrement = boolean;

export type Default = string | number;

export type Index = boolean;

export type Length = number;

export type NotNull = boolean;

export type Precision = number;

export type Primary = boolean;

enum RelationEnum {
	belongsTo = "belongsTo",
	hasOne = "hasOne",
	hasMany = "hasMany",
}
type Relation = keyof typeof RelationEnum;

export type Reference = {
	model: ModModel.ModelType;
	field: FieldType;
	relation: Relation;
};

export enum types {
	bigInteger = "bigInteger",
	boolean = "boolean",
	date = "date",
	dateTime = "dateTime",
	decimal = "decimal",
	enum = "enum",
	foreignKey = "foreignKey",
	float = "float",
	integer = "integer",
	json = "json",
	longText = "longText",
	mediumText = "mediumText",
	string = "string",
	text = "text",
	time = "time",
	timestamp = "timestamp",
	uuid = "uuid",
}

export type Type = keyof typeof types;

export type Unique = boolean;

export type Values = Array<string>;

export type FieldType = {
	_name?: string;

	/** alias for a field - NOT SUPPORTED YET */
	alias?: Alias;
	/** turned off for now since Knex is applying it properly */
	autoIncrement?: AutoIncrement;
	default?: Default;
	index?: Index;
	/** length for string */
	length?: Length;
	notNull?: NotNull;
	/** precision for float and decimal */
	precision?: Precision;
	primary?: Primary;
	/** used for type ForeignKey to indicate where the primary key is with 'model' and 'field' */
	reference?: Reference;
	type: Type;
	unique?: Unique;
	values?: Values;
};

export type Fields = {
	[key: string]: FieldType;
};