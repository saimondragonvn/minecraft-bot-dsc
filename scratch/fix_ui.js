const fs = require('fs');
let code = fs.readFileSync('src/utils/uiHelper.js', 'utf8');
code = code.replace("formatSlot('boots', 'Ủng giáp') + '\\n\\n` +", "formatSlot('boots', 'Ủng giáp') + '\\n\\n' +");
fs.writeFileSync('src/utils/uiHelper.js', code, 'utf8');
console.log('Fixed boots newline syntax!');
