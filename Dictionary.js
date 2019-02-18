const path = require('path')

class Dictionary {
    constructor(dictionaryFile, ...args) {
        dictionaryFile = dictionaryFile || 'default.json'
        this.dict = require(`./locale/${dictionaryFile}`)
    }

    get(name) {
        let outputString = ''
        let tempString = ''
        let buildingTemp = false

        name.split('').forEach(c => {
            if(!buildingTemp && c == '{') {
                buildingTemp = true
            } else if (buildingTemp && c != '}') {
                tempString += c
            } else if (buildingTemp && c == "}") {
                buildingTemp = false
                outputString += this.dict.hasOwnProperty(tempString) ? this.dict[tempString] : `{${tempString}}`
                tempString = ""
            } else {
                outputString += c
            }
        })
    }
}

module.exports = Dictionary