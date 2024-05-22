using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using VolPro.Core.BaseProvider;
using VolPro.Core.Configuration;
using VolPro.Core.DBManager;
using VolPro.Entity.DomainModels;

namespace VolPro.Core.Extensions
{

    public static class IdentityCode
    {
        /// <summary>
        /// 创建自增单据号
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="entity">实体对象</param>
        /// <param name="codeField">要设置单据号的字段</param>
        /// <param name="preCode">单据号前缀,如：{TC}{2023}{0001}</param>
        /// <param name="dateFieldExpression">排序字段，每天都从第1个号码开始</param>
        /// <param name="filter">过滤条件</param>
        /// <param name="startingDay">是否每天都从第1个号码开始</param>
        /// <param name="dateFormat">是否生成日期流水号</param>
        /// 使用示例：
        ///   Sys_User user=  new Sys_User();
        ///   user.Create(x => x.UserName, "U", x => x.CreateDate);
        /// <returns></returns>
        public static string Create<T>(this T entity,
            Expression<Func<T, object>> codeField,
            string preCode = "Code",
            Expression<Func<T, object>> dateFieldExpression = null,
            Expression<Func<T, bool>> filter = null,
            bool startingDay = true,
            string dateFormat = "yyyyMMdd"
            ) where T : class
        {

            string dateField;

            if (dateFieldExpression == null)
            {
                dateField = AppSetting.CreateMember.DateField;
            }
            else
            {
                dateField = dateFieldExpression.GetExpressionPropertyFirst();
            }

            DateTime dateNow = (DateTime)DateTime.Now.ToString("yyyy-MM-dd").GetDateTime();
            var condition = dateField.CreateExpression<T>(dateNow, Enums.LinqExpressionType.ThanOrEqual);

            string orderNo = DBServerProvider.GetEFDbContext<T>().Set<T>()
                .Where(filter)
                .WhereIF(filter == null && startingDay, condition)
                .OrderByDescending(codeField)
                .Select(codeField)
                .FirstOrDefault()
                ?.ToString();
            string rule = null;
            if (dateFormat != null)
            {
                rule = $"{preCode}{ DateTime.Now.ToString("yyyyMMdd")}";
            }
            else
            {
                rule = preCode;
            }


            if (string.IsNullOrEmpty(orderNo))
            {
                rule += "0001";
            }
            else
            {
                rule += (orderNo.Substring(orderNo.Length - 4).GetInt() + 1).ToString("0000");
            }

            var field = codeField.GetExpressionPropertyFirst();

            var property = typeof(T).GetProperty(field);

            property.SetValue(entity, rule);

            return rule;
        }
    }
}
