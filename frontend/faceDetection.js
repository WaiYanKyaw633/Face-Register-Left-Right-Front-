import { video, statusText, saveButton, canvas, ctx } from './main.js';

let model;
let currentStep = 'leftFace';
let faceTimeOut = null;
let lastFaceFeatures = null;
let positionBuffer = [];
const BUFFER_SIZE = 10; 
const POSITION_TOLERANCE = 0.15; 

export async function loadModel() {
    statusText.innerText = 'Loading ....';
    model = await blazeface.load();
    statusText.innerText = 'Please position your face.';
}

export async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            video.style.width = `${video.videoWidth}px`;
            video.style.height = `${video.videoHeight}px`;
            canvas.style.width = `${video.videoWidth}px`;
            canvas.style.height = `${video.videoHeight}px`;
            resolve(video);
        };
    });
}

function resetDetection() {
    currentStep = 'leftFace';
    lastFaceFeatures = null;
    positionBuffer = [];
    clearTimeout(faceTimeOut);
    faceTimeOut = null;
    saveButton.style.display = 'none';
    saveButton.disabled = true;
    statusText.innerText = '"မျက်နှာ"ကိုဘယ်ဖက်လှည့်ပေးပါ';
}

function calculateFaceFeatures(face, landmarks) {
    const leftEye = landmarks[0];
    const rightEye = landmarks[1];
    const nose = landmarks[2];
    
    const faceWidth = face.bottomRight[0] - face.topLeft[0];
    const faceHeight = face.bottomRight[1] - face.topLeft[1];
    const midpointEyes = (leftEye[0] + rightEye[0]) / 2;
    
    const relativeNosePosition = (nose[0] - midpointEyes) / faceWidth;
    
    return {
        relativeNosePosition,
        faceWidth,
        faceHeight,
        eyeDistance: Math.abs(rightEye[0] - leftEye[0]) / faceWidth
    };
}

function isSameFace(currentFeatures) {
    if (!lastFaceFeatures || positionBuffer.length < BUFFER_SIZE) {
        return true;
    }

    const avgFeatures = positionBuffer.reduce((acc, curr) => ({
        relativeNosePosition: acc.relativeNosePosition + curr.relativeNosePosition / BUFFER_SIZE,
        faceWidth: acc.faceWidth + curr.faceWidth / BUFFER_SIZE,
        faceHeight: acc.faceHeight + curr.faceHeight / BUFFER_SIZE,
        eyeDistance: acc.eyeDistance + curr.eyeDistance / BUFFER_SIZE
    }), {
        relativeNosePosition: 0,
        faceWidth: 0,
        faceHeight: 0,
        eyeDistance: 0
    });

    const widthDiff = Math.abs(currentFeatures.faceWidth - avgFeatures.faceWidth) / avgFeatures.faceWidth;
    const heightDiff = Math.abs(currentFeatures.faceHeight - avgFeatures.faceHeight) / avgFeatures.faceHeight;
    const eyeDistanceDiff = Math.abs(currentFeatures.eyeDistance - avgFeatures.eyeDistance) / avgFeatures.eyeDistance;

    return widthDiff < POSITION_TOLERANCE && 
           heightDiff < POSITION_TOLERANCE && 
           eyeDistanceDiff < POSITION_TOLERANCE;
}

function updatePositionBuffer(features) {
    positionBuffer.push(features);
    if (positionBuffer.length > BUFFER_SIZE) {
        positionBuffer.shift();
    }
}

function determineOrientation(features) {
    const { relativeNosePosition } = features;
    const tolerance = 0.1; 

    if (relativeNosePosition < -tolerance) {
        return 'Left Face';
    } else if (relativeNosePosition > tolerance) {
        return 'Right Face';
    } else {
        return 'Front Face';
    }
}

function handleFaceOrientation(orientation, face, landmarks) {
    const currentFeatures = calculateFaceFeatures(face, landmarks);  
    updatePositionBuffer(currentFeatures);
    if (!isSameFace(currentFeatures)) {
        resetDetection();
        return;
    }   
    lastFaceFeatures = currentFeatures;
    if (currentStep === 'leftFace') {
        handleLeftFaceStep(orientation);
    } else if (currentStep === 'rightFace') {
        handleRightFaceStep(orientation);
    } else if (currentStep === 'frontFace') {
        handleFrontFaceStep(orientation);       
    } else if (currentStep === 'done') {
        handleDoneStep(orientation);
    }

    drawFaceDetection(face, landmarks, orientation);
}
function handleLeftFaceStep(orientation) {
    statusText.classList.add('bold-text');
    statusText.innerText = '"မျက်နှာ"ကိုဘယ်ဖက်လှည့်ပေးပါ။';
    if (orientation === 'Left Face') {
        statusText.innerText = 'ခနလောက် ငြိမ်နေပေးပါ။🛑';
        if (!faceTimeOut) {
            faceTimeOut = setTimeout(() => {
                currentStep = 'rightFace';
                statusText.innerText = 'ရပါပီ "မျက်နှာ"ကိုညာဖက်လှည့်ပေးပါ။';
                faceTimeOut = null;
            }, 3000);
        }
    } else {
        clearTimeout(faceTimeOut);
        faceTimeOut = null;
        statusText.innerText = '"မျက်နှာ" ကိုဘယ်ဖက်လှည့်ပေးပါ။';
    }
}

function handleRightFaceStep(orientation) {
    statusText.classList.add('bold-text');
    statusText.innerText = '"မျက်နှာ" ကိုညာဖက်လှည့်ပေးပါ။';
    if (orientation === 'Right Face') {
        statusText.innerText = ' ခနလောက် ငြိမ်နေပေးပါ🛑';
        if (!faceTimeOut) {
            faceTimeOut = setTimeout(() => {
                currentStep = 'frontFace';
                statusText.innerText = 'ရပါပီ "မျက်နှာ"ကိုရှေ့တည့်တည့်ထားပေးပါ။';
                faceTimeOut = null;
            }, 3000);
        }
    } else {
        clearTimeout(faceTimeOut);
        faceTimeOut = null;
        statusText.innerText = '"မျက်နှာ" ကိုညာဖက်လှည့်ပေးပါ။';
    }
}

function handleFrontFaceStep(orientation) {
    statusText.classList.add('bold-text');
    statusText.innerText = '"မျက်နှာ" ရှေ့တည့်တည့်ထားပေးပါ။';
    if (orientation === 'Front Face') {
        statusText.innerText = 'ခနလောက် ငြိမ်နေပေးပါ🛑';
        if (!faceTimeOut) {
            faceTimeOut = setTimeout(() => {
                statusText.innerText = '"မျက်နှာ"အတည်ပြုချက် (အောင်မြင်ပါပီ)။';
                currentStep = 'done';
                handleDoneStep(orientation);
                faceTimeOut = null;
            }, 3000);
        }
    } else {
        if (faceTimeOut) {
            clearTimeout(faceTimeOut);
            faceTimeOut = null;
            statusText.innerText = '"မျက်နှာ" ရှေ့တည့်တည့်ထားပေးပါ။';
        }
    }
}

function handleDoneStep(orientation) {
    if (orientation === 'Front Face') {
        statusText.innerText = 'Registered Successfully!✅'; 
        saveButton.style.display = 'inline-block';
        saveButton.disabled = false;
        saveButton.onclick
    } else {
        statusText.innerText = 'မျက်နှာကို ရှေ့တည့်တည့်ပြန်ထားပေးပါ⚠️';
        saveButton.style.display = 'none';
        saveButton.disabled = true;
    }
}

function drawFaceDetection(face, landmarks, orientation) {
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 3;
    ctx.strokeRect(
        face.topLeft[0],
        face.topLeft[1],
        face.bottomRight[0] - face.topLeft[0],
        face.bottomRight[1] - face.topLeft[1]
    );

    ctx.fillStyle = '#f7147a'; 
    landmarks.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x - 3, y - 3, 3,  Math.PI, false);   
        ctx.arc(x + 3, y - 3, 3,  Math.PI, false);        
        ctx.lineTo(x, y + 4); 
        ctx.closePath();
        ctx.fill(); 
    });
    
    ctx.fillStyle = '#fd19ee';
    ctx.font = 'bold 25px Arial';
    ctx.fillText(`${orientation} Detected`, face.topLeft[0], face.topLeft[1] -10);
}

export async function detectFace() {
    if (!model) return;

    const predictions = await model.estimateFaces(video, false);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (predictions.length > 0) {
        const face = predictions[0];
        const landmarks = face.landmarks;
        const features = calculateFaceFeatures(face, landmarks);
        const orientation = determineOrientation(features);
        handleFaceOrientation(orientation, face, landmarks);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        statusText.innerText = 'No face detected';
        saveButton.style.display = 'none';
        saveButton.disabled = true;
        resetDetection();
    }

    requestAnimationFrame(detectFace);
}