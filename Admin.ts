import { ModField, ModModel } from "./internal-deps.ts";

export class Admin extends ModModel.Model {
	static table = "admins";

	static fields: ModField.Fields = {
		id: {
			type: "string",
			length: 5,
			notNull: false,
			primary: true,
			unique: true,
		},
		description: {
			type: "text",
			notNull: true,
			unique: false,
		},
	};
}