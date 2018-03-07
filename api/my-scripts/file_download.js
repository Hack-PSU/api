var http = require('follow-redirects').https;
var fs = require('fs');
const { exec } = require('child_process');

const file_url = process.argv[2];
const filename = file_url.match(/\/blob\/(.*)\?/)[1];
var file = fs.createWriteStream(filename);
var request = http.get(file_url, function(response) {
  response.pipe(file);
    response.on('end', () => {
        if (filename.split('.')[1] === 'doc' || filename.split('.')[1] === 'docx') {
            exec('libreconv '+filename+' -f pdf', (error, stdout, strerr) => {
                if (error) {
                    console.error(error);
                    process.stderr.write(error);
                    fs.unlink(filename);
                    process.exit(1);
                } else {
                    process.stdout.write(filename.split('.')[0]+'.pdf');
                    fs.unlink(filename);
                    process.exit(0);
                }
            });
        } else {
            console.log(filename);
        }
    })
});
