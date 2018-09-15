import dados from '/dados.json'

//Wildcards
const C_OBJECT = '*{ object'
const C_CLOSE_OBJ = '*} object was closed'
const C_ARRAY = '*[ array'
const C_CLOSE_ARR = '*] object was closed'
const C_VALUE_SEP = '*: value separator'
const C_COMMA = '*, comma'
const C_OTHER = '*other'

//Grab DOM elements
const app = document.getElementById('app')
const extra = document.getElementById('extra')

//Transform it to a string since that's how it will be seen in the RPG ILE API
const dadosStr = JSON.stringify(dados)

//Removes " from a string
const stripValue = str => {
  return str.split('"').join('')
}

//Determines the Type to be used in decisions
const getType = char => {
  const map = {
    '{': C_OBJECT,
    '}': C_CLOSE_OBJ,
    '[': C_ARRAY,
    ']': C_CLOSE_ARR,
    ':': C_VALUE_SEP,
    ',': C_COMMA
  }
  //If none of the required then set default as C_OTHER
  return map[char] !== undefined ? map[char] : C_OTHER
}

let result = [],
  k = '',
  i = 0,
  str,
  end,
  structs = [],
  structI = 0,
  curStruct = '',
  curChar = '',
  curType = ''

//Update the structure array so we know how to determine the breaks
const updStructs = type => {
  let l = structs.length
  let struct = { t: type, x: l, i: 0 }
  //We need to know if we're in an object or array because rules change
  if ([C_OBJECT, C_ARRAY].indexOf(type) !== -1) structs.push(struct)
  else if ([C_CLOSE_OBJ, C_CLOSE_ARR].indexOf(type) !== -1) structs.pop()
  l = structs.length
  return structs[l - 1]
}

while (i <= dadosStr.length) {
  //Current Character
  curChar = dadosStr.charAt(i)
  curType = getType(curChar)
  curStruct = updStructs(curType)

  //COMMA indicates new element at same level, aplicable to OBJ and ARR
  //Closing OBJ or ARR also has to remove the last key
  if ([C_COMMA, C_CLOSE_OBJ, C_CLOSE_ARR].indexOf(curType) !== -1) {
    //Removes the last key added to K
    k = k.substr(0, k.lastIndexOf('.'))
  } else if (curStruct.t === C_OBJECT) {
    //If we're extracting KEYS from an OBJECT
    if ([C_OBJECT, C_COMMA].indexOf(curType) !== -1) {
      str = i + 1
      end = dadosStr.indexOf(':', str)
      if (k) k += '.'
      k += stripValue(dadosStr.substr(str, end - str))
      // console.log('FOUND OBJ', i, k, end, curType, curStruct)
      i = end
      //If we're extracting VALUES from an OBJECT
    } else if (curType === C_OTHER) {
      str = i
      let strend = dadosStr.indexOf('"', str + 1)
      let comma = dadosStr.indexOf(',', str)
      let close = dadosStr.indexOf('}', str)
      end = curChar === '"' ? strend : Math.min(comma, close)
      let v = stripValue(dadosStr.substr(str, end - str))
      result.push({ k: k, v: v, kl: k.length, vl: v.length })
      i = end
    }
  } else if (curStruct.t === C_ARRAY) {
    //Defining KEY for array, based on index
    if ([C_ARRAY, C_COMMA].indexOf(curType) !== -1) {
      if (curType === C_ARRAY) structs[curStruct.x].i = 0
      if (curType === C_COMMA) structs[curStruct.x].i++
      structI = structs[curStruct.x].i
      if (k) k += '.'
      k += structI
      //Extracting VALUES from an ARRAY
    } else if (curType === C_OTHER) {
      let str = i
      let strend = dadosStr.indexOf('"', str + 1)
      let comma = dadosStr.indexOf(',', str)
      let close = dadosStr.indexOf(']', str)
      end = curChar === '"' ? strend : Math.min(comma, close)
      let v = stripValue(dadosStr.substr(str, end - str))
      result.push({ k: k, v: v, kl: k.length, vl: v.length })
      i = end
    }
  }
  //Keep moving along the string
  i++
  //Lock this because Chrome thinks i'll go infinite loop
  if (i >= 1500) break
}

//Determining the max value length (d.vl) or key length (d.kl)
let test = result.map(d => d.vl).reduce((a, b) => {
  return Math.max(a, b)
})

app.innerHTML = JSON.stringify(result, 0, 2)
extra.innerHTML = JSON.stringify(dados, 0, 2)
// extra.innerHTML = JSON.stringify(test, 0, 2)
