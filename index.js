const express = require('express');
const fs = require('fs');
const path = require('path'); 
const busboy = require('busboy'); 
const { marked } = require('marked');

const app = express();
const port = 4001;

const uploadDir = path.join(__dirname, 'uploads');  
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.set('view engine', 'ejs');
app.set('views', path.resolve("./views"));

// Serve the Homepage
app.get('/', (req, res) => {
    return res.render('Homepage');
});

// Handle file upload
app.post('/uploads', (req, res) => {
    const bb = busboy({ headers: req.headers }); // ✅ Correct way to use busboy
    let fileData = '';
    let fileRejected = false;

    bb.on('file', (fieldname, file, info) => {
        const { filename } = info;
        const ext = path.extname(filename).toLowerCase();

        if (ext !== '.md') {
            fileRejected = true;
            file.resume(); // Ignore file
        } else {
            file.setEncoding('utf8');
            file.on('data', (chunk) => {
                fileData += chunk;
            });
        }
    });

    bb.on('finish', () => {
        if (fileRejected) {
            return res.status(400).send("Error: Only Markdown (.md) files are allowed!");
        }

        const htmlContent = marked(fileData);
        fs.writeFile(path.join(uploadDir, 'converted.html'), htmlContent, (err) => {
            if (err) {
                return res.status(500).send("Error: Unable to save the file!");
            }
            res.render('converted', { downloadPath: '/download/converted.html' });
        });

    });

    req.pipe(bb); // ✅ Pipe request to busboy
    
});

app.use('/download', express.static(uploadDir));

// Start Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
