const fs = require('fs')

// 示例 fevent_pos 数组
const feventPosArray = [
    'CM_M.CASH.REPAY_OFFER.PAGE_EXPOSE',
    'CM_M.CASH.REPAY_OFFER.ATTR_START',
    'CM_M.CASH.REPAY_OFFER.ATTR_SUCCESS',
    'CM_M.CASH.REPAY_OFFER.QUERY_YQQZQ_INFO_REPAY_SPLIT_INFO_START',
    'CM_M.CASH.REPAY_OFFER.NEW_CAL_START',
    'CM_M.CASH.REPAY_OFFER.NEW_CAL_SUCCESS',
    'CM_M.CASH.REPAY_OFFER.GET_DEFAULT_CARD_START',
    'CM_M.CASH.REPAY_OFFER.PAGE_SUCCESS_EXPOSE',
    'CM_M.CASH.REPAY_OFFER.MAIN_PROCESS_ERROR',
    'CM_M.CASH.REPAY_OFFER.ORDER_CONFIRM_CLICK',
    'CM_M.CASH.REPAY_OFFER.SHOW_SELECT_FQ_NUM_TOAST',
    'CM_M.CASH.REPAY_OFFER.SHOW_ADD_BANKCARD_TOAST',
    'CM_M.CASH.REPAY_OFFER.PROCESS_BIND_START',
    'CM_M.CASH.REPAY_OFFER.PROCESS_BIND_SUCCESS'
]

// 生成 SQL 查询
function generateSQL(feventPosArray) {
    const sqlParts = [
        'SELECT',
        '  fdate,',
        "  COUNT(DISTINCT CASE WHEN (fevent_pos = 'CM_M.CASH.REPAY_OFFER.PAGE_EXPOSE') THEN fuid END) AS `页面曝光`,"
    ]

    const errorMessages = {
        'CM_M.CASH.REPAY_OFFER.MAIN_PROCESS_ERROR': [
            '无可用渠道',
            '还款方案调整页-查询初始信息retcode异常',
            '还款方案调整页-渠道值为空',
            '还款方案调整页-非yqq流程',
            '还款方案调整页-查询初始信息网络异常',
            '还款方案调整页-调查询拆单信息接口retcode异常',
            '待还方案列表错误',
            '待还信息错误',
            '还款日信息错误',
            '待还订单错误',
            '还款方案调整页-查询拆单信息接口网络异常',
            '分期数信息异常',
            '还款方案调整页-调用试算接口retcode异常',
            '还款方案调整页-调用试算接口试算信息异常',
            '还款方案调整页-查询默认银行卡信息retcode异常',
            '还款方案调整页-查询默认银行卡信息网络异常'
        ]
    }

    feventPosArray.forEach(pos => {
        if (pos === 'CM_M.CASH.REPAY_OFFER.MAIN_PROCESS_ERROR') {
            errorMessages[pos].forEach(msg => {
                sqlParts.push(
                    `  COUNT(DISTINCT CASE WHEN (fevent_pos = '${pos}' AND JSONExtractString(fextend_info, 'error_msg') = '${msg}') THEN fuid END) AS \`${msg}\`,`
                )
            })
        } else {
            sqlParts.push(
                `  COUNT(DISTINCT CASE WHEN (fevent_pos = '${pos}') THEN fuid END) AS \`${pos.split('.').pop()}\`,`
            )
        }
    })

    // 移除最后一个逗号
    sqlParts[sqlParts.length - 1] = sqlParts[sqlParts.length - 1].slice(0, -1)

    sqlParts.push(`FROM dp_click.t_user_behavior_business_log`)
    sqlParts.push(`WHERE fdate BETWEEN '${startDateFql}' AND '${endDateFql}'`)
    sqlParts.push(`  AND fevent_pos in (${feventPosArray.map(pos => `'${pos}'`).join(', ')})`)
    sqlParts.push(`  AND fpage_url LIKE '%https://cm.m.fenqile.com/entry/cash/repay_offer/index.html?cl=1500244%'`)
    sqlParts.push(`GROUP BY fdate`)

    return sqlParts.join('\n')
}

// 示例日期范围
const startDateFql = '2023-01-01'
const endDateFql = '2023-01-31'

// 生成 SQL 查询
const sqlQuery = generateSQL(feventPosArray)

// 将生成的 SQL 保存到 TXT 文件
fs.writeFile('generated_sql.txt', sqlQuery, err => {
    if (err) {
        console.error('Error writing file:', err)
    } else {
        console.log('SQL query has been saved to generated_sql.txt')
    }
})
