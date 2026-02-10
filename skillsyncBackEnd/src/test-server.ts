import express from 'express';
const app = express();
app.listen(4005, () => {
    console.log('Test server is running on port 4005');
});
setInterval(() => {
    console.log('Event loop still alive...');
}, 5000);
