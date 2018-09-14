import dados from '/dados.json'

//Wildcards
const C_OBJECT = '*{ object'
const C_CLOSE_OBJ = '*} object was closed'
const C_ARRAY = '*[ array'
const C_CLOSE_ARR = '*] object was closed'
const C_VALUE_SEP = '*: value separator'
const C_COMMA = '*, comma'
const C_OTHER = '*other'

const app = document.getElementById('app')
const extra = document.getElementById('extra')

const dadosStr = JSON.stringify(dados)

const stripValue = str => {
  return str.split('"').join('')
}

const getType = char => {
  const map = {
    '{': C_OBJECT,
    '}': C_CLOSE_OBJ,
    '[': C_ARRAY,
    ']': C_CLOSE_ARR,
    ':': C_VALUE_SEP,
    ',': C_COMMA
  }

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

const updStructs = type => {
  let l = structs.length
  let struct = { t: type, x: l, i: 0 }
  //We need to know if we're in an object or array because rules change
  if ([C_OBJECT, C_ARRAY].indexOf(type) !== -1) structs.push(struct)
  else if ([C_CLOSE_OBJ, C_CLOSE_ARR].indexOf(type) !== -1) structs.pop()
  l = structs.length
  // console.log('type', type, l)
  if (l === 0) return { t: type, x: 0, i: 0 }
  return structs[l - 1]
}

while (i <= dadosStr.length) {
  //Current Character
  curChar = dadosStr.charAt(i)
  curType = getType(curChar)
  curStruct = updStructs(curType)
  // if (curStruct === undefined) {
  //   console.log('jumped', JSON.stringify(structs[0]))
  //   i++
  //   continue
  // }
  //COMMA indicates new element at same level, aplicable to OBJ and ARR
  //Closing OBJ or ARR also has to remove the last key
  if ([C_COMMA, C_CLOSE_OBJ, C_CLOSE_ARR].indexOf(curType) !== -1) {
    //Removes the last key added to K
    k = k.substr(0, k.lastIndexOf('.'))
  }

  //If we're extracting KEYS from an OBJECT
  if (
    curType === C_OBJECT ||
    (curType === C_COMMA && curStruct.t === C_OBJECT)
  ) {
    str = i + 1
    end = dadosStr.indexOf(':', str)
    if (k) k += '.'
    k += stripValue(dadosStr.substr(str, end - str))
    // console.log('FOUND OBJ', i, k, end, curType, curStruct)
    i = end
    //If we're extracting KEYS from an OBJECT
  } else if (curType === C_OTHER && curStruct.t === C_OBJECT) {
    str = i
    let strend = dadosStr.indexOf('"', str + 1)
    let comma = dadosStr.indexOf(',', str)
    let close = dadosStr.indexOf('}', str)
    end = curChar === '"' ? strend : Math.min(comma, close)
    let v = stripValue(dadosStr.substr(str, end - str))
    result.push({ k: k, v: v, kl: k.length, vl: v.length })
    i = end
  } else if (curStruct.t === C_ARRAY) {
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
    // console.log('ARR_KEY', curStruct.x, curChar, structI)
  }
  // console.log('END_LOOP', curStruct, curChar, k)
  i++
  if (i >= 9500) break
}

let test = result.map(d => d.vl).reduce((a, b) => {
  return Math.max(a, b)
})

app.innerHTML = JSON.stringify(result, 0, 2)
// extra.innerHTML = JSON.stringify(dados, 0, 2)
extra.innerHTML = JSON.stringify(test, 0, 2)
