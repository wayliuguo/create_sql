const fs = require('fs')

// 生成 sql
function generateSql(config, reportList) {
    // 合成 hottag
    reportList = reportList.map(item => {
        return {
            ...item,
            hottag: `${config.prefix}.${item.hottag}`
        }
    })

    if (config.days_sql) {
        // 生成天维度 sql
        const sqlQuery = generateDaysSql(reportList)
        createSqlText('days_sql', sqlQuery)
    }

    if (config.realtimes_sql) {
        // generateRealtimesSql(config, reportList)
    }
}

// 生成sql字符串
function generateDaysSql(reportList) {
    const sqlParts = ['SELECT', '  fdate,']

    reportList.forEach(pos => {
        sqlParts.push(
            `  COUNT(DISTINCT CASE WHEN (fevent_pos = '${pos.hottag}') THEN fuid END) AS \`${pos.eventPosName}\`,`
        )
    })

    // 移除最后一个逗号
    sqlParts[sqlParts.length - 1] = sqlParts[sqlParts.length - 1].slice(0, -1)

    sqlParts.push(`FROM dp_click.t_user_behavior_business_log`)
    sqlParts.push("WHERE fdate BETWEEN '${startDateFql}'\n  AND '${endDateFql}'")
    sqlParts.push(`  AND fevent_pos in (${reportList.map(pos => `'${pos.hottag}'`).join(', ')})`)
    sqlParts.push(`GROUP BY fdate`)

    return sqlParts.join('\n')
}

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
