/*
数据库配置脚本
*/

/*暴露全局变量*/

/** 数据库对象 */
const db = ( function(){

    /** 表元数据 */
    const t_source_data = {
        name: 't_source_data',
        columns: {
            source_url: { primaryKey: true, dataType: "string" },
            source_name:{ notNull: true,    dataType: "string" }, 
            is_use:{notNull:true, dataType:"number"}, /*该书源是否生效，1 生效 0 失效*/
            source_json:{ notNull: true,    dataType: "string" }
        }
    };

    /** 数据库元数据 */
    const meta_db  = {
        name: 'reader',
        tables: [t_source_data]
    }

    const meta_table = { 
        t_source_data: t_source_data
    }

    const db = {
        meta_db: meta_db,
        meta_table:meta_table,
        connection : new JsStore.Connection(),
        init: async function(){ 
            const isDbCreated = await this.connection.initDb(meta_db);
            return new Promise((resolve,_)=>{
                if(isDbCreated){
                    console.log("数据库未创建，当前创建完毕。");
                }
                resolve(true);
            }); 
        },
        delete: async function(){
            const db_name = meta_db.name; 
            return new Promise((resolve,_)=>{
                const req = indexedDB.deleteDatabase(db_name);
                req.onsuccess = function(){
                    resolve(true);
                } 
                req.onerror = function(e){
                    console.log(e);
                    resolve(false);
                }
                req.onblocked = function () {
                    console.log("Couldn't delete database due to the operation being blocked");
                    resolve(false);
                };
            });
        }
    };

    return db; 

} )();