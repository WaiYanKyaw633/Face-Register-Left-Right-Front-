import { loadModel, setupCamera, detectFace } from './faceDetection.js';
import { initializeSaveButton } from './saveFace.js';

export const video = document.getElementById('video');
export const statusText = document.getElementById('status');
export const saveButton = document.getElementById('saveButton');
export const canvas = document.getElementById('overlay');
export const ctx = canvas.getContext('2d');

(async () => {
    await loadModel();
    await setupCamera();
    video.play();
    detectFace();
    initializeSaveButton();
})();