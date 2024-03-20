// const express = require('express');
// const mongoose= require('mongoose');
// const app=express();

// const PORT = 27017;

// app.get('/api/hello', (req, res) => {
//     res.send('Hello from the API!');
// });

// app.listen(PORT, () => {
//     console.log(`Server is listening on port ${PORT}`);
// });

// const mongouri = 'mongodb+srv://sarwesh:svc9090@cluster0.gc2qihz.mongodb.net/college';
// mongoose.connect(mongouri);
// mongoose.connection.on('connected', ()=>{
//     console.log("Connected to mongo instance");
// });
// mongoose.connection.on('error', (err)=>{
//     console.log('error connecting to mongo',err);
// });
// app.get('/', (req,rew)=>{
//     resizeBy.send('hi there1');
// });

const express = require('express');
const { MongoClient, GridFSBucket } = require('mongodb');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

// MongoDB Atlas connection URI
//const uri = 'mongodb+srv://<username>:<password>@<cluster-url>/<database>';
const uri = 'mongodb+srv://sarwesh:svc9090@cluster0.gc2qihz.mongodb.net/college';

// Create a new MongoClient
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to MongoDB Atlas and store the database reference
let database;

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB Atlas");
        database = client.db('college');
    } catch (error) {
        console.error('Error connecting to MongoDB Atlas:', error);
        process.exit(1); // Exit the application if unable to connect to MongoDB
    }
}

// Connect to the database when the server starts
connectToDatabase();


// Set up multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        // // Connect to the MongoDB cluster
        // await client.connect();

        // // Access the database
        // const database = client.db('college');
        if (!database) {
            return res.status(500).send('Database connection not established');
        }

        // Create a new GridFSBucket object
        const bucket = new GridFSBucket(database);

        // Create a readable stream from the uploaded file buffer
        const readableStream = require('stream').Readable.from(req.file.buffer);

        // Open a stream to upload the file to GridFS
        const uploadStream = bucket.openUploadStream(req.file.originalname);

        // Pipe the file data to the upload stream
        readableStream.pipe(uploadStream);

        // Wait for the upload stream to finish
        await new Promise((resolve, reject) => {
            uploadStream.on('finish', resolve);
            uploadStream.on('error', reject);
        });

        console.log('File saved to MongoDB Atlas successfully');
        res.send('File uploaded successfully');
    } catch (error) {
        console.error('Error saving file to MongoDB Atlas:', error);
        res.status(500).send('Error uploading file');
    }
    //finally {
    //     // Close the connection
    //     await client.close();
    // }

    // Download endpoint

});

app.get('/download/:filename', async (req, res) => {
    try {
        // // Connect to the MongoDB cluster
        // await client.connect();

        // // Access the database
        // const database = client.db('college');

        if (!database) {
            return res.status(500).send('Database connection not established');
        }
        // Create a new GridFSBucket object
        const bucket = new GridFSBucket(database);

        // Find the file in GridFS by filename
        const file = await bucket.find({ filename: req.params.filename }).toArray();


        if (!file || file.length === 0) {
            return res.status(404).send('File not found');
        }

        // Set the response headers
        res.set('Content-Type', file[0].contentType);
        res.set('Content-Disposition', `attachment; filename="${file[0].filename}"`);

        // Create a readable stream to pipe the file data to the response
        const downloadStream = bucket.openDownloadStream(file[0]._id);
        downloadStream.pipe(res);
    } catch (error) {
        console.error('Error downloading file from MongoDB Atlas:', error);
        res.status(500).send('Error downloading file');
    }
    // finally {
    //     // Close the connection
    //     await client.close();
    // }
});


// Get all uploaded files
app.get('/files', async (req, res) => {
    try {
        // if (!database) {
        //     return res.status(500).send('Database connection not established');
        // }
        // Connect to the MongoDB cluster
        await client.connect();

        // Access the database
        const database = client.db('college');

        const bucket = new GridFSBucket(database);

        // Find all files in GridFS
        const files = await bucket.find().toArray();

        if (!files || files.length === 0) {
            return res.status(404).send('No files found');
        }

        // Extract filenames from the files array
        const filenames = files.map(file => file.filename);

        // Send the list of filenames as the response
        res.json({ files: filenames });
    } catch (error) {
        console.error('Error fetching files from MongoDB Atlas:', error);
        res.status(500).send('Error fetching files');
    }
});

let docCollection;

// async function connectToCollection() {
//     try {
//         await client.connect();
//         console.log("Connected to MongoDB Atlas");
//         database = client.db('college');
//         docCollection = database.collection('doc'); // Reference to the 'doc' collection
//     } catch (error) {
//         console.error('Error connecting to MongoDB Atlas:', error);
//         process.exit(1);
//     }
// }

// // Connect to the database when the server starts
// connectToCollection();


const uploadC = multer({ storage: storage });

app.post('/uploadC', uploadC.single('file'), async (req, res) => {
    try {
        if (!database) {
            return res.status(500).send('Collection connection not established');
        }

        // Insert the file into the 'doc' collection
        await database.collection('doc').insertOne({
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            data: req.file.buffer
        });

        console.log('File saved to MongoDB Atlas successfully');
        res.send('File uploaded successfully');
    } catch (error) {
        console.error('Error saving file to MongoDB Atlas:', error);
        res.status(500).send('Error uploading file');
    }
});

app.get('/downloadC/:filename', async (req, res) => {
    try {
        if (!database) {
            return res.status(500).send('Collection connection not established');
        }

        // Find the file in the 'doc' collection by filename
        const file = await database.collection('doc').findOne({ filename: req.params.filename });

        if (!file) {
            return res.status(404).send('File not found');
        }

        // Set response headers and send the file data
        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
        res.send(file.data.buffer);
    } catch (error) {
        console.error('Error downloading file from MongoDB Atlas:', error);
        res.status(500).send('Error downloading file');
    }
});

// Get all uploaded files
app.get('/filesC', async (req, res) => {
    try {
        if (!database) {
            return res.status(500).send('Collection connection not established');
        }

        // Find all files in the 'doc' collection
        const files = await database.collection('doc').find().toArray();

        if (!files || files.length === 0) {
            return res.status(404).send('No files found');
        }

        // Extract filenames from the files array
        const filenames = files.map(file => file.filename);

        // Send the list of filenames as the response
        res.json({ files: filenames });
    } catch (error) {
        console.error('Error fetching files from MongoDB Atlas:', error);
        res.status(500).send('Error fetching files');
    }
});

// let perCollection;

// async function connectToPerCollection() {
//     try {
//         await client.connect();
//         console.log("Connected to MongoDB Atlas");
//         database = client.db('college');
//         perCollection = database.collection('perform'); // Reference to the 'doc' collection
//     } catch (error) {
//         console.error('Error connecting to MongoDB Atlas:', error);
//         process.exit(1);
//     }
// }

const upload_p = multer({ storage: storage });

app.post('/uploadCp', upload_p.single('file'), async (req, res) => {
    try {
        if (!database) {
            return res.status(500).send('Collection connection not established');
        }

        // Insert the file into the 'doc' collection
        await database.collection('perform').insertOne({
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            data: req.file.buffer
        });

        console.log('File saved to MongoDB Atlas successfully');
        res.send('File uploaded successfully');
    } catch (error) {
        console.error('Error saving file to MongoDB Atlas:', error);
        res.status(500).send('Error uploading file');
    }
});

app.get('/downloadCp/:filename', async (req, res) => {
    try {
        if (!database) {
            return res.status(500).send('Collection connection not established');
        }

        // Find the file in the 'doc' collection by filename
        const file = await database.collection('perform').findOne({ filename: req.params.filename });

        if (!file) {
            return res.status(404).send('File not found');
        }

        // Set response headers and send the file data
        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
        res.send(file.data.buffer);
    } catch (error) {
        console.error('Error downloading file from MongoDB Atlas:', error);
        res.status(500).send('Error downloading file');
    }
});

// Get all uploaded files
app.get('/filesCp', async (req, res) => {
    try {
        if (!database) {
            return res.status(500).send('Collection connection not established');
        }

        // Find all files in the 'doc' collection
        const files = await database.collection('perform').find().toArray();

        if (!files || files.length === 0) {
            return res.status(404).send('No files found');
        }

        // Extract filenames from the files array
        const filenames = files.map(file => file.filename);

        // Send the list of filenames as the response
        res.json({ files: filenames });
    } catch (error) {
        console.error('Error fetching files from MongoDB Atlas:', error);
        res.status(500).send('Error fetching files');
    }
});

// Connect to the database when the server starts
//connectToPerCollection();

app.get('/', (req, rew)=>{
    rew.send('hi there1');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
