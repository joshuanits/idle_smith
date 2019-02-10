const path = require('path')

class Dictionary {
    constructor(dictionaryFile, ...args) {
        dictionaryFile = dictionaryFile || 'default.json'
        this.dict = require(`./locale/${dictionaryFile}`)
    }

    get(id, type) {
        const fullId = id + (type ? `_${type}` : "")
        if(this.dict.hasOwnProperty(fullId)) {
            return this.dict[fullId]
        } else {
            // couldn't find a localisd string, just spit the id back
            return fullId
        }
    }
}

module.exports = Dictionary