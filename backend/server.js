const Fastify = require('fastify');
const fs = require('fs');
const path = require('path');
const fastifyCors = require('@fastify/cors');
const app = Fastify();

app.register(fastifyCors, {
    origin: '*', 
});

const FACE_FOLDER = path.join(__dirname, 'faces');

if (!fs.existsSync(FACE_FOLDER)) fs.mkdirSync(FACE_FOLDER);

app.post('/save-face', async (request, reply) => {
    const { faceData, fileName } = request.body;

    if (!faceData || !fileName) {
        return reply.status(400).send({ status:false ,error: 'Invalid data' });
    }
    const base64Data = faceData.replace(/^data:image\/jpeg;base64,/, '');

    const filePath = path.join(FACE_FOLDER, `${fileName}.jpg`);
    if (fs.existsSync(filePath)) {
        return reply.status(409).send({status:false, error: 'File already registered' });
    }
    try {
        fs.writeFileSync(filePath, base64Data, 'base64');
        return reply.status(200).send({ status:true ,message: 'Done' });  
    } catch (err) {
        console.error('Error saving face:', err);
        return reply.status(500).send({ status:false ,error: 'Failed to save face' });
    }
});

app.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server is running on ${address}`);
});
