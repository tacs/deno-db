import { ModModel } from "./internal-deps.ts";

export class QueryResult {
	private rows: Array<any> = [];

	constructor(data: Array<any>) {
		this.rows = data;
	}

	all() {
		return this.rows;
	}

	/** get the first row */
	first(): ModModel.ModelType {
		return this.rows[0];
	}

	/** get the last row */
	last(): ModModel.ModelType {
		return this.rows[this.rows.length - 1];
	}
}

export class InsertResult {
	private numRows?: number;

	constructor(numRows: number) {
		this.numRows = numRows;
	}

	rowsInserted(): number {
		return this.numRows!;
	}
}

export class UpdateResult {
	private affectedRows?: number;

	constructor(affectedRows: number) {
		this.affectedRows = affectedRows;
	}

	rowsAffected(): number {
		return this.affectedRows!;
	}
}

export class DeleteResult {
	private affectedRows?: number;

	constructor(affectedRows: number) {
		this.affectedRows = affectedRows;
	}

	rowsAffected(): number {
		return this.affectedRows!;
	}
}