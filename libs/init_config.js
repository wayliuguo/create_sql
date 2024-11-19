const fs = require('fs')
const { configFileName } = require('../libs/utils/constant')

function getTemplateConfig() {
    return fs.readFileSync('createsql.cfg.template.json', 'utf-8')
}
function initConfig() {
    const fileName = configFileName
    fs.writeFile(fileName, getTemplateConfig(), err => {
        if (err) {
            console.error('生成错误:', err)
        } else {
            console.log(`${fileName} 已生成`)
        }
    })
}
module.exports = {
    initConfig
}
