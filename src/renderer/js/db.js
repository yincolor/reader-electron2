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
    const t_shelf_data = {
        name: 't_shelf_data', 
        columns: {
            url: { primaryKey: true, dataType: "string" },
            name:{ notNull: true,    dataType: "string" },
            author:{ notNull: true,  dataType: "string" },
            intro: { notNull: true,  dataType: "string" },
            latest_chapter:{ notNull: true, dataType: "string" }, 
            toc_url: { notNull: true, dataType: "string" }, 
            source_url:{ notNull: true,dataType: "string" }
        }
    }
    const t_toc_content_data = {
        name: 't_toc_content_data', 
        columns: {
            toc_index: { notNull: true,    dataType: "number" }, /*章节列表的序号，非常必要！！*/
            href: { primaryKey: true, dataType: "string" },
            name:{ notNull: true,    dataType: "string" }, 
            content: { notNull: true,    dataType: "string" },
            book_url:{ notNull: true,    dataType: "string" },
            download_state: { notNull: true,dataType: "number" } /** 下载状态：-1 未下载，没有下载需求 0 等待下载 1 下载成功 2 下载失败 3 正在下载 */
        }
    }

    /** 数据库元数据 */
    const meta_db  = {
        name: 'reader',
        tables: [t_source_data, t_shelf_data, t_toc_content_data]
    }

    // const meta_table = { 
    //     t_source_data: t_source_data
    // }

    const db = {
        meta_db: meta_db,
        // meta_table:meta_table,
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
        },
        getTable: ()=>{
            const tables =  meta_db.tables;
            const tableMap = {};
            for(const t of tables){
                tableMap[t.name] = t;
            }
            return tableMap;
        }
    };

    return db; 

} )();