using Microsoft.EntityFrameworkCore;
using Npgsql;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using VolPro.Core.Configuration;
using VolPro.Core.Const;
using VolPro.Core.Dapper;
using VolPro.Core.EFDbContext;
using VolPro.Core.Enums;
using VolPro.Core.Extensions;
using MySqlConnector;
using VolPro.Core.ManageUser;
using VolPro.Entity.SystemModels;
using VolPro.Entity;
using Microsoft.Extensions.DependencyModel;
using System.Reflection;
using System.Runtime.Loader;
using System.Linq;
using Oracle.ManagedDataAccess.Client;


namespace VolPro.Core.DBManager
{
    public partial class DBServerProvider
    {
        private static Dictionary<string, string> ConnectionPool = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        //系统库
        private static readonly string DefaultConnName = "SysDbContext";
        //业务库(与builderData.js、EFDbContext下的文件名相同)
        private static readonly string _service = "ServiceDbContext";


        //业务库(与builderData.js、EFDbContext下的文件名相同)
        private static readonly string _test = "TestDbContext";


        //这里必须与配置文件里面添加的属性相同
        private static readonly string 自定义名字 = "自定义DbContext";




        static DBServerProvider()
        {
            SetConnection(DefaultConnName, AppSetting.DbConnectionString);
            //初始化业务库数据库链接
            SetConnection(_service, AppSetting.GetSection("Connection")[_service]);

            //初始化业务库数据库链接
            SetConnection(_test, AppSetting.GetSection("Connection")[_test]);

            SetConnection(自定义名字, AppSetting.GetSection("Connection")[自定义名字]);


        }

        public static void SetConnection(string key, string val)
        {
            if (ConnectionPool.ContainsKey(key))
            {
                ConnectionPool[key] = val;
                return;
            }
            ConnectionPool.Add(key, val);
        }
        /// <summary>
        /// 设置默认数据库连接
        /// </summary>
        /// <param name="val"></param>
        public static void SetDefaultConnection(string val)
        {
            SetConnection(DefaultConnName, val);
        }

        public static string GetConnectionString(string key)
        {
            key = key ?? DefaultConnName;
            if (ConnectionPool.ContainsKey(key))
            {
                return ConnectionPool[key];
            }
            return key;
        }
        /// <summary>
        /// 获取默认数据库连接
        /// </summary>
        /// <returns></returns>
        public static string GetConnectionString()
        {
            return GetConnectionString(DefaultConnName);
        }

        /// <summary>
        /// 扩展dapper 获取MSSQL数据库DbConnection，默认系统获取配置文件的DBType数据库类型，
        /// </summary>
        /// <param name="connString">如果connString为null 执行重载GetDbConnection(string connString = null)</param>
        /// <param name="dapperType">指定连接数据库的类型：MySql/MsSql/PgSql</param>
        /// <returns></returns>
        public static IDbConnection GetDbConnection(string connString = null, DbCurrentType dbCurrentType = DbCurrentType.Default)
        {
            //默认获取DbConnection
            if (connString == null)
            {
                connString = ConnectionPool[DefaultConnName];
            }
            if (dbCurrentType == DbCurrentType.Default)
            {
                dbCurrentType = (DbCurrentType)Enum.Parse(typeof(DbCurrentType), DBType.Name);
            }
            if (dbCurrentType == DbCurrentType.MySql)
            {
                return new MySqlConnection(connString);
            }
            if (dbCurrentType == DbCurrentType.PgSql)
            {
                return new NpgsqlConnection(connString);
            }
            if (dbCurrentType == DbCurrentType.Oracle)
            {
                return new OracleConnection(connString);
            }
            return new SqlConnection(connString);

        }
        /// <summary>
        /// 获取系统 EF
        /// </summary>
        public static SysDbContext DbContext
        {
            get { return GetEFDbContext(); }
        }
        /// <summary>
        /// 获取系统 EF
        /// </summary>
        public static SysDbContext GetEFDbContext()
        {
            return GetEFDbContext(null);
        }
        /// <summary>
        /// 获取系统 EF
        /// </summary>
        public static SysDbContext GetEFDbContext(string dbName)
        {
            SysDbContext dbContext = Utilities.HttpContext.Current.RequestServices.GetService(typeof(SysDbContext)) as SysDbContext;
            if (dbName != null)
            {
                if (!ConnectionPool.ContainsKey(dbName))
                {
                    throw new Exception("数据库连接名称错误");
                }
                dbContext.Database.GetDbConnection().ConnectionString = ConnectionPool[dbName];
            }
            return dbContext;
        }
        /// <summary>
        /// 根据实体model获取对应EF
        /// </summary>
        /// <typeparam name="TEntity"></typeparam>
        /// <returns></returns>
        public static BaseDbContext GetEFDbContext<TEntity>()
        {
            string dbServer = typeof(TEntity).GetTypeCustomValue<EntityAttribute>(x => x.DBServer);

            return Utilities.HttpContext.Current.RequestServices.GetService(DbRelativeCache.GetDbContextType(dbServer)) as BaseDbContext;
        }

        public static void SetDbContextConnection(SysDbContext sysContext, string dbName)
        {
            if (!ConnectionPool.ContainsKey(dbName))
            {
                throw new Exception("数据库连接名称错误");
            }
            sysContext.Database.GetDbConnection().ConnectionString = ConnectionPool[dbName];
        }
        public static ISqlDapper SqlMain
        {
            get
            {
                return SqlDapper;
            }
        }

        public static ISqlDapper SqlDapper
        {
            get
            {
                return new SqlDapper(DefaultConnName);
            }
        }
        /// <summary>
        /// 指定获取数据库
        /// </summary>
        /// <param name="dbService"></param>
        /// <returns></returns>
        public static ISqlDapper GetSqlDapperWidthDbService(string dbService)
        {
            string connectionString = null;
            if (string.IsNullOrEmpty(dbService))
            {
                connectionString = DefaultConnName;
            }
            else if (typeof(SysDbContext).Name == dbService)
            {
                connectionString = SysConnectingString;
            }
            else if (typeof(ServiceDbContext).Name == dbService)
            {
                connectionString = ServiceConnectingString;
            }
            else if (typeof(TestDbContext).Name == dbService)
            {
                connectionString = ServiceTestString;
            }
            else if (typeof(自定义DbContext).Name == dbService)
            {
                connectionString = 自定义String;// //ServiceTestString;
            }
            return new SqlDapper(connectionString);
        }
        public static string GetDbEntityName(string dbServer)
        {
            return DbRelativeCache.GetDbEntityType(dbServer).Name;
        }


        public static ISqlDapper GetSqlDapper(string dbName = null)
        {
            return new SqlDapper(string.IsNullOrEmpty(dbName) ? DefaultConnName : dbName);
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="dbCurrentType">指定数据库类型：MySql/MsSql/PgSql</param>
        /// <param name="dbName">指定数据连串名称</param>
        /// <returns></returns>
        public static ISqlDapper GetSqlDapper(DbCurrentType dbCurrentType, string dbName = null)
        {
            if (dbName.IsNullOrEmpty())
            {
                return new SqlDapper(dbName ?? DefaultConnName, dbCurrentType);
            }
            return new SqlDapper(dbName, dbCurrentType);
        }
        public static ISqlDapper GetSqlDapper<TEntity>()
        {
            //获取实体真实的数据库连接池对象名，如果不存在则用默认数据连接池名
            string dbName = typeof(TEntity).GetTypeCustomValue<EntityAttribute>(x => x.DBServer) ?? DefaultConnName;
            //2023.12.26修复dapper租户分库获取数据库链接不正确的问题
            if (nameof(ServiceDbContext) == dbName && AppSetting.UseDynamicShareDB)
            {
                return GetSqlDapper(UserContext.CurrentServiceId.ToString());
            }
            return GetSqlDapper(dbName);
        }

        public static string GetDbConnectionString(string key)
        {
            if (ConnectionPool.TryGetValue(key, out string connString))
            {
                return connString;
            }
            throw new Exception($"未配置[{key}]的数据库连接");
        }



        /// <summary>
        /// 获取系统库的字符串连接
        /// </summary>
        public static string SysConnectingString
        {
            get { return GetDbConnectionString(DefaultConnName); }
        }

        /// <summary>
        /// 获取业务库的字符串连接
        /// </summary>
        public static string ServiceConnectingString
        {
            get
            {
                //动态无限分库获取用户当前选择的数据库
                if (AppSetting.UseDynamicShareDB)
                {
                    return GetDbConnectionString(UserContext.CurrentServiceId.ToString());
                }
                return GetDbConnectionString(_service);
            }
        }

        /// <summary>
        /// 获取测试库的字符串连接
        /// </summary>
        public static string ServiceTestString
        {
            get
            {
                return GetDbConnectionString(_test);
            }
        }


        /// <summary>
        /// 获取测试库的字符串连接
        /// </summary>
        public static string 自定义String
        {
            get
            {
                return GetDbConnectionString(自定义名字);
            }
        }


        //其他数据库链接配置

    }
}
