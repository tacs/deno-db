import { ModDatabase, ModQueryBuilder, ModUser, ModList, ModItem, ModAdmin } from "./internal-deps.ts";

const db = await ModDatabase.Database.connect({
    host: "localhost",
    username: "root",
    password: "",
    db: "test"
    /*host: "db.tacs.app",
    username: "tacs",
    password: "?5u8N,}x9HVV)8Sm",
    db: "tacs"*/
}, "mysql");
db.attachModels(ModAdmin.Admin, ModUser.User, ModList.List, ModItem.Item);

const seed = async () => {
    await db.sync({ drop: true });
    await new ModQueryBuilder.QueryBuilder(ModAdmin.Admin).insert([{ id:123, description:"Big Big Boss!!"}]);
    await new ModQueryBuilder.QueryBuilder(ModUser.User).insert([{ id:123, email:"11@tacs.app", adminId:123}]);
    await new ModQueryBuilder.QueryBuilder(ModUser.User).insert([{ id:456, email:"22@tacs.app", adminId:123}]);
    await new ModQueryBuilder.QueryBuilder(ModList.List).insert([{ id:987, userId:123, description:"list one"}]);
    await new ModQueryBuilder.QueryBuilder(ModList.List).insert([{ id:654, userId:123, description:"list two"}]);
    await new ModQueryBuilder.QueryBuilder(ModItem.Item).insert([{ id:123, userId:123, listId:987, description:"item 1"}]);
    await new ModQueryBuilder.QueryBuilder(ModItem.Item).insert([{ id:456, userId:123, listId:654, description:"item 2"}]);
    await new ModQueryBuilder.QueryBuilder(ModItem.Item).insert([{ id:789, userId:456, listId:654, description:"item 3"}]);
};
//await seed();

const user = new ModUser.User();
const item = new ModItem.Item();

/*const u = 1;//await ModUser.User.q().join().fetch();//whereId(123).fetchFirst();
const i = await ModItem.Item.q().join(ModItem.Item.fields.listId).fetch();
const i2 = await ModItem.Item.q()
    .join(ModItem.Item.fields.userId)
    .join(ModItem.Item.fields.listId, ModList.List.fields.userId, ModUser.User.fields.adminId)
    .fetch();
console.log(666, u, i, i2);*/

//await ModUser.User.q().join().wherePk(123).fetchFirst();

//await db._createTable(ModUser.User);

//await ModUser.User.q().insert({ id:666, email:"pony@yo123.net", adminId:123 });
//await ModUser.User.q().insert([{ id:666, email:"pony@yo123.net", adminId:123 }, { id:777, email:"2pony@yo123.net" }]);

await ModUser.User.q().wherePk(666).update({ email: "crl!!!!!" }); // ERRO DE MERDA

//CREATE + UPDATE + DELETE{ id: 667 });

//CREATE + UPDATE + DELETE