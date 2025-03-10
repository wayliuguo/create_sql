const fs = require('fs')
const config = require('./utils/config')

/**
 * 生成 SQL
 * @param {Array} reportList - 上报列表
 */
function generateSql(reportList) {
    console.log(`开始处理 ${reportList.length} 个上报点...`)

    // 合成 hottag
    reportList = reportList.map(item => {
        return {
            ...item,
            hottag: `${config.prefix}.${item.hottag}`
        }
    })

    if (config.days_sql) {
        // 生成天维度 sql
        console.log('生成天维度SQL...')
        const sqlQuery = generateDaysSql(reportList)
        createSqlText('days_sql', sqlQuery)
    }

    if (config.realtimes_sql) {
        console.log('生成实时维度SQL...')
        const sqlQuery = generateRealtimesSql(reportList)
        createSqlText('realtimes_sql', sqlQuery)
    }
}

/**
 * 构建 WHERE 子句
 * @param {Object} pos - 上报点
 * @returns {string} WHERE 子句
 */
function buildWhereClause(pos) {
    let whereClause = `fevent_pos = '${pos.hottag}'`

    // 为错误上报添加额外的条件
    if (pos.isErrorReport && pos.errorMsg) {
        whereClause += ` AND JSONExtractString(fextend_info, 'error_msg') = '${pos.errorMsg}'`
    }

    return whereClause
}

/**
 * 生成实时维度SQL字符串
 * @param {Array} reportList - 上报列表
 * @returns {string} SQL字符串
 */
function generateRealtimesSql(reportList) {
    const sqlParts = ['SELECT', '  toStartOfMinute(toDateTime(fdeal_time - (fdeal_time % 600))) AS formatted_datetime,']

    reportList.forEach(pos => {
        const whereClause = buildWhereClause(pos)

        const list = [
            `  COUNT(DISTINCT CASE WHEN (${whereClause} AND fdate = (toDate(now())) - INTERVAL 1 DAY) THEN fuid END) AS \`昨日${pos.eventPosName}\`,`,
            `  COUNT(DISTINCT CASE WHEN (${whereClause} AND fdate = (toDate(now()))) THEN fuid END) AS \`今日${pos.eventPosName}\`,`,
            `  COUNT(DISTINCT CASE WHEN (${whereClause} AND fdate between (toDate(now()) - INTERVAL 8 DAY) AND (toDate(now()) - INTERVAL 1 DAY)) THEN fuid END)  AS \`近7日${pos.eventPosName}\`,`
        ]
        sqlParts.push(...list)
    })

    // 移除最后一个逗号
    sqlParts[sqlParts.length - 1] = sqlParts[sqlParts.length - 1].slice(0, -1)

    // 添加基本查询条件
    addBasicQueryConditions(sqlParts, reportList)

    // 添加分组和排序
    sqlParts.push(`GROUP BY formatted_datetime`)
    sqlParts.push(`ORDER BY formatted_datetime DESC`)

    return sqlParts.join('\n')
}

/**
 * 生成天维度SQL字符串
 * @param {Array} reportList - 上报列表
 * @returns {string} SQL字符串
 */
function generateDaysSql(reportList) {
    const sqlParts = ['SELECT', '  fdate,']

    reportList.forEach(pos => {
        const whereClause = buildWhereClause(pos)
        sqlParts.push(`  COUNT(DISTINCT CASE WHEN (${whereClause}) THEN fuid END) AS \`${pos.eventPosName}\`,`)
    })

    // 移除最后一个逗号
    sqlParts[sqlParts.length - 1] = sqlParts[sqlParts.length - 1].slice(0, -1)

    // 添加基本查询条件
    addBasicQueryConditions(sqlParts, reportList)

    // 添加分组
    sqlParts.push(`GROUP BY fdate`)

    return sqlParts.join('\n')
}

/**
 * 添加基本查询条件
 * @param {Array} sqlParts - SQL部分
 * @param {Array} reportList - 上报列表
 */
function addBasicQueryConditions(sqlParts, reportList) {
    sqlParts.push(`FROM dp_click.t_user_behavior_business_log`)
    sqlParts.push("WHERE fdate BETWEEN '${startDateFql}'\n  AND '${endDateFql}'")

    // 构建 fevent_pos IN 条件，去除重复的 hottag
    const uniqueHottags = [...new Set(reportList.map(pos => `'${pos.hottag}'`))]
    const eventPosValues = uniqueHottags.join(', ')
    sqlParts.push(`  AND fevent_pos in (${eventPosValues})`)
}

/**
 * 生成文件
 * @param {string} name - 文件名
 * @param {string} sqlStr - SQL字符串
 */
function createSqlText(name, sqlStr) {
    fs.writeFile(`${name}.txt`, sqlStr, err => {
        if (err) {
            console.error('Error writing file:', err)
        } else {
            console.log(`${name}.txt 已生成`)
        }
    })
}

module.exports = {
    generateSql
}
