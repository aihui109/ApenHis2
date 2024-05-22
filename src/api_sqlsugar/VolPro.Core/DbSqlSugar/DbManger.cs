using Microsoft.Extensions.DependencyInjection;
using SqlSugar;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VolPro.Core.Configuration;
using VolPro.Core.DBManager;
using VolPro.Core.EFDbContext;
using VolPro.Core.Enums;
using VolPro.Core.Extensions;
using VolPro.Core.ManageUser;
using VolPro.Core.Utilities;
using VolPro.Entity;

namespace VolPro.Core.DbSqlSugar
{
    public class DbManger
    {
        /// <summary>
        /// 获取业务库对象(租户动态分库)
        /// </summary>
        public static ISqlSugarClient ServiceDb
        {
            get
            {
                var configId = UserContext.CurrentServiceId;
                if (!Db.IsAnyConnection(configId))
                { //用非默认ConfigId进行测试
                    Db.AddConnection(new ConnectionConfig()
                    {
                        ConfigId = configId,
                        ConnectionString = DBServerProvider.ServiceConnectingString,
                        // //2024.01.22增加分库使用不同类型的数据库
                        DbType = SqlSugarDbType.GetType(typeof(ServiceDbContext).Name, GetDbType()),// SqlSugar.DbType.SqlServer,
                        IsAutoCloseConnection = true
                    });
                }
                var result = Db.GetConnection(configId);
                return result;
            }
        }
        /// <summary>
        ///  动态租户分库，获取指定数据库id的链接(2023.11.05)
        /// </summary>

        public static ISqlSugarClient GetServiceDb(Guid serviceId)
        {
            string configId = serviceId.ToString();
            if (!Db.IsAnyConnection(configId))
            { //用非默认ConfigId进行测试
                Db.AddConnection(new ConnectionConfig()
                {
                    ConfigId = configId,
                    ConnectionString = DBServerProvider.GetServiceConnectingString(serviceId),
                    DbType = SqlSugarDbType.GetType(typeof(ServiceDbContext).Name, GetDbType()),// SqlSugar.DbType.SqlServer,
                    IsAutoCloseConnection = true
                });
            }
            var result = Db.GetConnection(configId);
            return result;

        }

        /// <summary>
        /// 获取系统库：后台异步使用
        /// </summary>
        public static SqlSugarScope SysDbContext = new SqlSugarScope(
         SqlSugarRegister.GetSysConnectionConfig(),
         db =>
         {
             db.Aop.OnLogExecuting = (sql, pars) =>
            {
                Console.WriteLine(sql);//输出sql,查看执行sql 性能无影响

            };
         });

        /// <summary>
        /// 根据dbcontext获取链接，
        /// 
        /// </summary>
        /// <param name="dbContextName">
        ///获取系统库 DbManger.GetSqlSugarClient(typeof(SysDbContext).Name)
        ///获取业务库  DbManger.GetSqlSugarClient(typeof(ServiceDbContext).Name)
        /// </param>
        /// <returns></returns>
        public static ISqlSugarClient GetSqlSugarClient(string dbContextName = null)
        {
            return GetConnection(dbContextName);
        }
        public static ISqlSugarClient GetConnection(string dbContextName)
        {
            if (string.IsNullOrEmpty(dbContextName) || typeof(SysDbContext).Name == dbContextName)
            {
                return SysDbContext;
            }
            else if (typeof(ServiceDbContext).Name == dbContextName && AppSetting.UseDynamicShareDB)
            {
                return ServiceDb;
            }
            //其他配置文件里面的自定义数据库链接名称
            return Db.GetConnection(dbContextName);
        }

        public static SqlSugarScope Db
        {
            get
            {
                var obj = HttpContext.Current.RequestServices.GetService<ISqlSugarClient>();
                return (SqlSugarScope)obj;
            }
        }

        public static DbType GetDbType()
        {
            if (Const.DBType.Name == DbCurrentType.MsSql.ToString())
            {
                return DbType.SqlServer;
            }
            else if (Const.DBType.Name == DbCurrentType.MySql.ToString())
            {
                return DbType.MySql;
            }
            else if (Const.DBType.Name == DbCurrentType.PgSql.ToString())
            {
                return DbType.PostgreSQL;
            }
            else if (Const.DBType.Name == DbCurrentType.Kdbndp.ToString())
            {
                return DbType.Kdbndp;
            }
          
            else if (Const.DBType.Name == DbCurrentType.Oracle.ToString())
            {
                return DbType.Oracle;
            }
            else if (Const.DBType.Name == DbCurrentType.DM.ToString())
            {
                return DbType.Dm;
            }
            throw new Exception("未实现数据库");
        }
        /// <summary>
        /// 根据model获取指定dbcontext对象2023.12.17
        /// </summary>
        /// <typeparam name="TEntity"></typeparam>
        /// <returns></returns>
        public static BaseDbContext GetDbContext<TEntity>()
        {
            string dbServer = typeof(TEntity).GetTypeCustomValue<EntityAttribute>(x => x.DBServer);

            return HttpContext.Current.RequestServices.GetService(DbRelativeCache.GetDbContextType(dbServer)) as BaseDbContext;
        }
    }
}
