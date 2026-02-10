import https from 'https';
import fs from 'fs';

const file = fs.createWriteStream("sendit_docs.json");
https.get("https://app.sendit.ma/docs/api-docs.json", function (response) {
    response.pipe(file);
    file.on('finish', function () {
        file.close(() => {
            console.log("Download Completed");
        });
    });
}).on('error', function (err) {
    fs.unlink("sendit_docs.json", () => { });
    console.error("Error downloading:", err.message);
});
