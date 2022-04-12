const fs = require('fs');

const deepai = require('deepai'); // OR include deepai.min.js as a script tag in your HTML

//////////////////Convert Image into Cartoon/////////////////////////

deepai.setApiKey('quickstart-QUdJIGlzIGNvbWluZy4uLi4K');

(async function() {
    var resp = await deepai.callStandardApi("toonify", {
            image: fs.createReadStream("/path/to/your/file.jpg"),
    });
    console.log(resp);
})()