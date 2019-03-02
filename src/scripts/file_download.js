const http = require('follow-redirects').https;
const fs = require('fs');
const { exec } = require('child_process');

const fireUrl = process.argv[2];
const filename = fireUrl.match(/\/blob\/(.*)\?/)[1];
const file = fs.createWriteStream(filename);
http.get(fireUrl, (response) => {
  response.pipe(file);
  response.on('end', () => {
    const tokens = filename.split('.');
    if (tokens[tokens.length - 1] === 'doc' || tokens[tokens.length - 1] === 'docx') {
      exec(`libreconv ${filename} -f pdf`, (error) => {
        if (error) {
          console.error(error);
          process.stderr.write(error);
          fs.unlink(filename);
          process.exit(1);
        } else {
          process.stdout.write(`${filename.split('.')[0]}.pdf`);
          fs.unlink(filename);
          process.exit(0);
        }
      });
    } else {
      console.log(filename);
    }
  });
});
