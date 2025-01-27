import { canvas, statusText, video } from './main.js';

export function initializeSaveButton() {
    const saveButton = document.getElementById('saveButton');
    
    saveButton.addEventListener('click', () => {
        statusText.innerText = 'Saving face...';
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const faceData = tempCanvas.toDataURL('image/jpeg', 0.9);
        
        fetch('http://localhost:3000/save-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                faceData,
                fileName: `face_${Date.now()}`,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message) {
                    alert(data.message);
                } else {
                    alert(data.error || 'An error occurred');
                }
                statusText.innerText = 'Face saved successfully!';
            })
            .catch((error) => {
                console.error(error);
                statusText.innerText = 'Failed to save face.';
            });
    });
}