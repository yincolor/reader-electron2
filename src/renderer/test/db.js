// store meta 对象仓库的元数据，在创建数据库管理器实例的时候，就将其作为参数传入，当更新版本时，根据元数据创建对象仓库;

/** 对象仓库的元数据 */
class StoreMeta {
    storeName = null;
    indexList = [];
    keyPath = null;
    autoIncrement = true;
    constructor(_storeName, opt = { indexList: [], keyPath: null, autoIncrement: true }) {
        if (_storeName == undefined || _storeName == null) {
            console.log("无效的对象仓库");
            return null;
        }
        this.storeName = _storeName;
        const _indexList = opt.indexList;
        if (_indexList.length != 0) {
            for (const index of _indexList) {
                const name = index.name;
                const unique = index.unique || false;
                this.indexList.push({ name: name, unique: unique });
            }
        }
        this.keyPath = opt.keyPath;
        this.autoIncrement = opt.autoIncrement;
    }
    static parseByJSON(json) {
        return new StoreMeta(json.storeName, {
            indexList: json.indexList,
            keyPath: json.keyPath,
            autoIncrement: json.autoIncrement,
        });
    }
    toJSON() {
        return { storeName: this.storeName, keyPath: this.keyPath, indexList: this.indexList, autoIncrement: this.autoIncrement }
    }
}




/** 
 * 浏览器数据库管理对象
 */
class DataBaseCommander {
    db = null;
    dbName;
    storeMetas = [];
    /**
     * @param {String} _dbName 数据库名称，默认default
     * @param {StoreMeta[]} _storeMetaList 对象仓库元数据列表，默认[]
     */
    constructor(_dbName = 'default', _storeMetaList = []) {
        this.dbName = _dbName;
        if (_storeMetaList.length != 0) {
            this.storeMetas = _storeMetaList;
        }
    }

    /** 开启数据库连接 */
    async open(dbVersion = 1) {
        return new Promise((resolve, reject) => {
            const _request = indexedDB.open(this.dbName, dbVersion);
            _request.onsuccess = (e) => {
                console.log("onsuccess 成功打开数据库");
                this.db = e.target.result;
                resolve(true);
            };
            _request.onerror = (e) => {
                console.log("onerror 数据库：" + this.dbName + " 连接失败.");
                resolve(false);
            };
            _request.onupgradeneeded = (e) => {
                const _db = e.target.result;
                /*版本从无到有，也会触发这个事件，因此在onupgradeneeded事件响应里填写新建对象仓库（表）的逻辑*/
                if (this.storeMetas.length != 0) {
                    for (const sm of this.storeMetas) {
                        const _args = sm.keyPath ? { keyPath: sm.keyPath, autoIncrement: sm.autoIncrement } : { autoIncrement: sm.autoIncrement };
                        const _objStore = _db.createObjectStore(sm.storeName, _args);
                        for (const index of sm.indexList) {
                            console.log(sm.storeName, "新增索引", index);
                            _objStore.createIndex(index.name, index.name, { unique: index.unique });
                        }
                    }
                }
                console.log("onupgradeneeded 指定的版本号，大于数据库的实际版本号，数据库升级完毕.");
            };
        });
    }

    /** 通过仓库名称获取数据库中一个对象仓库 */
    _getIDBObjectStoreByStoreName(storeName) {
        return this.db.transaction([storeName], 'readwrite').objectStore(storeName);
    }

    /** 向对象仓库中添加一条数据 */
    async add(storeName, data) {
        const iDBObjectStore = this._getIDBObjectStoreByStoreName(storeName);
        return new Promise((resolve, _) => {
            const _request = iDBObjectStore.add(data);
            _request.onsuccess = (e) => {
                console.log("写入成功");
                resolve(true);
            }
            _request.onerror = (e) => {
                console.log("写入失败");
                resolve(false);
            }
        });
    }

    /** 读取当前对象仓库的全部数据 */
    async readAll(storeName) {
        return await this.read(storeName, () => { return true; });
    }

    /** 通过过滤方法查询匹配的表数据（常规） */
    async read(storeName, filterFunc) {
        const iDBObjectStore = this._getIDBObjectStoreByStoreName(storeName);
        return new Promise((resolve, _) => {
            const _list = [];
            iDBObjectStore.openCursor().onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    const state = filterFunc(cursor.value); /*判断当前是否需要读取此条记录*/
                    if (state) {
                        _list.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    console.log("完成数据遍历");
                    resolve(_list);
                }
            }
        });
    }

    /** 通过单个索引匹配单个值来读取表数据（不常用） */
    async readByIndex(storeName, indexName, indexValue) {
        let list = [];
        const store = this._getIDBObjectStoreByStoreName(storeName); // 仓库对象
        return new Promise((resolve, _) => {
            const request = store.index(indexName).openCursor(IDBKeyRange.only(indexValue));
            request.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    list.push(cursor.value);
                    cursor.continue();
                } else {
                    console.log("游标索引查询完毕");
                    resolve(list);
                }
            }
            request.onerror = function (e) { resolve(false) };
        });
    }

    /** 通过主键值查询一条数据（不常用） */
    async readByKey(storeName, keyPathValue){
        const iDBObjectStore = this._getIDBObjectStoreByStoreName(storeName); // 仓库对象
        return new Promise((resolve, _) => {
            const _request = iDBObjectStore.get(keyPathValue);
            _request.onsuccess = (e) => {console.log('查询成功'); resolve(_request.result)}
            _request.onerror = (e) => {console.log('查询失败'); resolve(null); }
        });
    }

    /** 通过过滤方法删除匹配的行（常规） */
    async delete(storeName, filterFunc) {
        const iDBObjectStore = this._getIDBObjectStoreByStoreName(storeName);
        return new Promise((resolve, _) => {
            iDBObjectStore.openCursor().onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    const state = filterFunc(cursor.value); /*判断当前是否需要读取此条记录*/
                    if (state) {
                        const _deleteRequest = cursor.delete();
                        _deleteRequest.onsuccess = (e) => { console.log("游标删除该记录成功"); }
                        _deleteRequest.onerror = (e) => { console.log("游标删除该记录失败"); }
                    }
                    cursor.continue();
                } else {
                    console.log("完成数据遍历删除");
                    resolve(true);
                }
            }
        });
    }
    /** 通过索引的方法删除（不常规） */
    async deleteByIndex(storeName, indexName, indexValue) {
        const iDBObjectStore = this._getIDBObjectStoreByStoreName(storeName);
        console.log('删除 ' + indexName + ' = ' + indexValue + ' 的数据');
        return new Promise((resolve, _) => {
            const _request = iDBObjectStore.index(indexName).openCursor(IDBKeyRange.only(indexValue));
            _request.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    const _deleteRequest = cursor.delete();
                    _deleteRequest.onsuccess = (e) => { console.log("游标删除该记录成功"); }
                    _deleteRequest.onerror = (e) => { console.log("游标删除该记录失败"); }
                    cursor.continue();
                } else {
                    console.log("完成遍历删除");
                    resolve(true);
                }
            }
            _request.onerror = (e) => {
                console.log("数据删除失败");
                resolve(false);
            }
        });
    }

    /**
     * 通过过滤方法查询特定行，并更新
     * @param {String} storeName 仓库名称
     * @param {[{key, val}]} keyValueList 键值列表
     * @param { function (cursorVal)  } filterFunc 
     * @returns 
     */
    async update(storeName, keyValueList, filterFunc){
        const iDBObjectStore = this._getIDBObjectStoreByStoreName(storeName);
        return new Promise( (resolve, _) => {
            const req = iDBObjectStore.openCursor()
            req.onsuccess = (e) => {
                console.log('游标开始更新');
                const cursor = e.target.result;
                if(cursor){
                    const value = cursor.value;
                    const state = filterFunc(value); /*判断是否需要更新此行记录*/
                    if (state) { 
                        for(const i of keyValueList){
                            value[i.key] = i.val;
                        }
                        const _deleteRequest = cursor.update(value);
                        _deleteRequest.onsuccess = (e) => { console.log("游标更新该记录成功"); }
                        _deleteRequest.onerror = (e) => { console.log("游标更新该记录失败"); }
                    }
                    cursor.continue();
                }else {
                    console.log("完成数据遍历删除");
                    resolve(true);
                }
            }
            req.onerror = (e) =>{
                console.log('创建游标失败，更新失败');
                resolve(false);
            }
        });
    }
}

/** 存储、处理结构化数据列表对象 */
class QueryList {
    /** 存储的结构化列表数据，私有 */
    data = [];
    /**
     * @param {Array} _list 
     */
    constructor(_list) {
        this.data = _list;
    }

    /** 返回当前列表数据 */
    getData() { return this.data; }

    /** SELECT语句 */
    select(whereFunc) {
        const newList = this.data.filter((v) => { whereFunc(v); });
        return new QueryList(newList);
    }

    /**
     * join 语句，静态
     * @param {String} _joinType 连接类型 left 或 inner
     * @param {QueryList} leftQueryList 左侧的QueryList对象 
     * @param {QueryList} rightQueryList 右侧的QueryList对象 
     * @param {Function} onFunc 关联的ON方法，需要返回true或false
     * @param {Function} columnsFunc 新的列表的对象元素，返回一行对象数据
     * @returns 
     */
    static join(_joinType, leftQueryList, rightQueryList, onFunc, columnsFunc) {
        const leftData = leftQueryList.getData();
        const rightData = rightQueryList.getData();
        const concatList = [];
        for (const left of leftData) {
            let matchNum = 0;
            for (const right of rightData) {
                /*const state = onFunc(left, right);*/
                if (onFunc(left, right)) {
                    concatList.push({ left: left, right: right });
                }
            }
            if (_joinType == 'left' && matchNum == 0) {
                /** 至少保证left存在一条记录，即使right是NULL, 注：没有匹配，那么right是一个空的对象{} */
                concatList.push({ left: left, right: {} });
            }
        }
        const nextList = concatList.map((val) => { return columnsFunc(val.left, val.right); });
        return new QueryList(nextList);
    }

    /** INNER JOIN语句 */
    innerJoin(rightQueryList, onFunc, columnsFunc) {
        return QueryList.join('inner', this, rightQueryList, onFunc, columnsFunc);
    }

    /**
     * LEFT JOIN语句
     * @param {QueryList} rightQueryList JOIN 右侧的QueryList对象
     * @param {Function} onFunc ON 方法 (leftItem, rightItem) => {...}
     * @param {Function} columnsFunc columns 方法 (leftItem, rightItem) => {...}
     * @returns 新的 QueryList 对象
     */
    leftJoin(rightQueryList, onFunc, columnsFunc) {
        return QueryList.join('left', this, rightQueryList, onFunc, columnsFunc);
    }

    /**
     * RIGHT JOIN语句
     * @param {QueryList} rightQueryList rightQueryList JOIN 右侧的QueryList对象
     * @param {Function} onFunc ON 方法 (rightItem, leftItem) => {...}
     * @param {Function} columnsFunc columns 方法 (rightItem, leftItem) => {...}
     * @returns 
     */
    rightJoin(rightQueryList, onFunc, columnsFunc) {
        return QueryList.join('left', rightQueryList, this, onFunc, columnsFunc);
    }

}

async function test() {
    let studentStoreMeta = new StoreMeta('student', {
        indexList: [
            { name: 'name', unique: false },
            { name: 'age', unique: false },
            { name: 'class', unique: false },
            { name: 'sex', unique: false },
        ],
        keyPath: 'id',
        autoIncrement: true,
    });
    let jdbc = new DataBaseCommander('people', [studentStoreMeta]);
    let state = await jdbc.open();
    console.log("数据库状态：", state);
    // state = [];
    // state[0] = await jdbc.add('student', { name: '小美', age: 12, class: 6, sex: '女' });
    // state[1] = await jdbc.add('student', { name: '小明', age: 13, class: 7, sex: '男' });
    // state[2] = await jdbc.add('student', { name: '小张', age: 14, class: 7, sex: '男' });
    // state[3] = await jdbc.add('student', { name: '小凯', age: 15, class: 6, sex: '男' });
    // console.log('新增数据状态：' + state.join(', '));
    // jdbc.addPeople('小张', 13);
    // jdbc.addPeople('小美', 14);
    let l = await jdbc.readAll('student');
    console.log(l);
    let t = await jdbc.readByIndex('student', 'name', '小美');
    console.log(t);
    await jdbc.deleteByIndex('student', 'name', '小美');
    t = await jdbc.readByIndex('student', 'name', '小美');
    console.log(t);
}

// const jsdbc = new DataBaseConnect('reader');

async function test2() {
    var left = [{ a: 1, b: 2 }, { a: 2, b: 3 }, { a: 4, b: 5 }, { a: 5, b: 1 }, { a: 3, b: 2 }];
    var right = [{ a: 1, b: 2, c: 3 }, { a: 2, b: 3, c: 99 }, { a: 4, b: 5, c: 77 }, { a: 5, b: 1, c: 3 }, { a: 3, b: 2, c: 13 }, { a: 1, b: 7, c: 43 }];
    var leftData = new QueryList(left);
    var rightData = new QueryList(right);
    var _data = leftData
        .innerJoin(
            rightData,
            (l, r) => { return (l.a == r.b) },
            (l, r) => { return { a: l.a, b: r.b, c: r.c, r: l.a + r.a } }
        )
        .data;
    console.log(_data);
    var _data2 = leftData.leftJoin(
        rightData,
        (l, r) => { return (l.a == r.b) },
        (l, r) => { return { a: l.a, b: r.b, c: r.c, r: l.a + r.a } }
    ).getData();
    console.log(_data2);
}