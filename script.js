document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name');
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    const messageContainer = document.getElementById('message-container');
    const secretMessageInput = document.getElementById('secret-message');
    
    const actionBtn = document.getElementById('action-btn');
    const btnText = actionBtn.querySelector('.btn-text');
    const spinner = actionBtn.querySelector('.spinner');
    
    const resultSection = document.getElementById('result-section');
    const alertBox = document.getElementById('alert-box');
    const decodeResult = document.getElementById('decode-result');
    const encodeResult = document.getElementById('encode-result');
    const decodedTextDisplay = document.getElementById('decoded-text');
    const downloadBtn = document.getElementById('download-btn');

    // State
    let currentMode = 'encode'; // 'encode' or 'decode'
    let selectedFile = null;
    
    const MAX_ENCODE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_DECODE_SIZE = 20 * 1024 * 1024; // 20MB

    // Tabs Logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentMode = btn.dataset.tab;
            
            if (currentMode === 'encode') {
                messageContainer.classList.remove('hidden');
                btnText.textContent = 'Encode Image';
            } else {
                messageContainer.classList.add('hidden');
                btnText.textContent = 'Decode Image';
            }
            
            resetResults();
        });
    });

    // File Drag & Drop Logic
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
            showAlert('Please select a PNG or JPG image.', 'error');
            selectedFile = null;
            fileNameDisplay.textContent = '';
            return;
        }
        
        selectedFile = file;
        fileNameDisplay.textContent = file.name;
        resetResults();
        alertBox.className = 'alert hidden'; // Clear alerts
    }

    // Action Logic
    actionBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            showAlert('Please upload an image first.', 'error');
            return;
        }

        if (currentMode === 'encode') {
            const msg = secretMessageInput.value.trim();
            if (!msg) {
                showAlert('Please enter a secret message.', 'error');
                return;
            }
            if (selectedFile.size > MAX_ENCODE_SIZE) {
                showAlert('Image file is too large (max 10MB for encoding).', 'error');
                return;
            }
            await encodeImage(selectedFile, msg);
            
        } else {
            if (selectedFile.size > MAX_DECODE_SIZE) {
                showAlert('Image file is too large (max 20MB for decoding).', 'error');
                return;
            }
            await decodeImage(selectedFile);
        }
    });

    async function encodeImage(file, message) {
        setLoading(true);
        resetResults();
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('message', message);
        
        try {
            const response = await fetch('/encode', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to encode image.');
            }
            
            // Get binary blob
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            downloadBtn.href = url;
            downloadBtn.download = `encoded_${file.name.replace(/\.[^/.]+$/, "")}.png`;
            
            showAlert('Image encoded successfully!', 'success');
            resultSection.classList.remove('hidden');
            encodeResult.classList.remove('hidden');
            
        } catch (error) {
            showAlert(error.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    async function decodeImage(file) {
        setLoading(true);
        resetResults();
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('/decode', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Failed to decode image.');
            }
            
            decodedTextDisplay.textContent = data.message;
            
            showAlert('Message decoded successfully!', 'success');
            resultSection.classList.remove('hidden');
            decodeResult.classList.remove('hidden');
            
        } catch (error) {
            showAlert(error.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    // Helpers
    function setLoading(isLoading) {
        actionBtn.disabled = isLoading;
        if (isLoading) {
            btnText.classList.add('hidden');
            spinner.classList.remove('hidden');
        } else {
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    }
    
    function showAlert(msg, type) {
        resultSection.classList.remove('hidden');
        alertBox.textContent = msg;
        alertBox.className = `alert ${type}`;
    }
    
    function resetResults() {
        resultSection.classList.add('hidden');
        encodeResult.classList.add('hidden');
        decodeResult.classList.add('hidden');
        alertBox.className = 'alert hidden';
    }
});
