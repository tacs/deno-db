import { ModField, ModList, ModModel, ModUser } from "./internal-deps.ts";

export class Item extends ModModel.Model {
	static table = "items";

	static fields: ModField.Fields = {
		id: {
			alias: "yoyo",
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
		listId: {
			type: "foreignKey",
			notNull: true,
			unique: false,
			index: true,
			reference: {
				model: ModList.List,
				field: ModList.List.fields.id,
			},
		},
		description: {
			type: "text",
			notNull: true,
			unique: false,
		},
	};
}