import { ModAdmin, ModField, ModModel } from "./internal-deps.ts";

export class User extends ModModel.Model {
	static table = "users";

	static fields: ModField.Fields = {
		id: {
			alias: "yo",
			length: 10,
			primary: true,
			type: "string",
			unique: true,
		},
		email: {
			length: 50,
			type: "string",
			index: true,
			notNull: true,
		},
		adminId: {
			type: "foreignKey",
			notNull: false,
			unique: false,
			index: true,
			reference: {
				model: ModAdmin.Admin,
				field: ModAdmin.Admin.fields.id,
				relation: "hasOne"
			},
		},
	};
}