import { ModField, ModModel, ModUser } from "./internal-deps.ts";

export class List extends ModModel.Model {
	static table = "lists";

	static fields: ModField.Fields = {
		id: {
			type: "string",
			length: 5,
			notNull: false,
			primary: true,
			unique: true,
		},
		userId: {
			type: "foreignKey",
			notNull: true,
			unique: false,
			index: true,
			reference: {
				model: ModUser.User,
				field: ModUser.User.fields.id,
			},
		},
		description: {
			type: "text",
			notNull: true,
			unique: false,
		},
	};
}