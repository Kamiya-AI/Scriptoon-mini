// Scriptoon Mini App Logic


// --- Service Worker Registration ---
// Service Worker registration with update detection
if ('serviceWorker' in navigator) {
    let refreshing = false;

    // Detect controller change and reload
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        console.log('Controller changed, reloading page...');
        window.location.reload();
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);

                // Check for waiting service worker
                if (registration.waiting) {
                    showUpdateNotification(registration.waiting);
                }

                // Listen for new service worker
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('New service worker found, installing...');

                    newWorker.addEventListener('statechange', () => {
                        console.log('Service worker state changed to:', newWorker.state);

                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker is ready
                            console.log('New service worker installed, showing update notification');
                            showUpdateNotification(newWorker);
                        }
                    });
                });
            })
            .catch(error => console.log('ServiceWorker registration failed:', error));
    });
}

// Show update notification to user
function showUpdateNotification(worker) {
    // Create notification banner
    const banner = document.createElement('div');
    banner.id = 'update-notification';
    banner.className = 'update-notification';

    const message = document.createElement('div');
    message.className = 'update-message';
    message.textContent = '新しいバージョンがあります';

    const button = document.createElement('button');
    button.className = 'update-button';
    button.textContent = '更新する';
    button.onclick = () => {
        console.log('User clicked update button, sending SKIP_WAITING message');
        worker.postMessage({ type: 'SKIP_WAITING' });
        banner.remove();
    };

    banner.appendChild(message);
    banner.appendChild(button);
    document.body.appendChild(banner);

    console.log('Update notification shown to user');
}



// DOM elements
const promptInput = document.getElementById('prompt');
const numImagesSelect = document.getElementById('num_images');
const aspectRatioSelect = document.getElementById('aspect_ratio');
const resolutionSelect = document.getElementById('resolution');
const outputFormatSelect = document.getElementById('output_format');
const apiKeyInput = document.getElementById('api_key');
const generateImageBtn = document.getElementById('generateImageBtn');
const generateMangaBtn = document.getElementById('generateMangaBtn');
const editTextBtn = document.getElementById('editTextBtn');
const cancelBtn = document.getElementById('cancelBtn');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const apiWarning = document.getElementById('apiWarning');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
const deleteApiKeyBtn = document.getElementById('deleteApiKeyBtn');
const imageFileInput = document.getElementById('imageFileInput');
const cameraFileInput = document.getElementById('cameraFileInput');
const uploadControls = document.getElementById('uploadControls');
const cameraBtn = document.getElementById('cameraBtn');
const uploadDropZone = document.getElementById('uploadDropZone');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const customPromptsToggle = document.getElementById('customPromptsToggle');
const customPromptsContent = document.getElementById('customPromptsContent');
const customPromptsList = document.getElementById('customPromptsList');
const customPromptsButtons = document.getElementById('customPromptsButtons');
const imageLibraryToggle = document.getElementById('imageLibraryToggle');
const imageLibraryContent = document.getElementById('imageLibraryContent');
const libraryAddBtn = document.getElementById('libraryAddBtn');
const libraryFileInput = document.getElementById('libraryFileInput');
const imageLibraryGrid = document.getElementById('imageLibraryGrid');

const clearPromptBtn = document.getElementById('clearPromptBtn');
const clearImagesBtn = document.getElementById('clearImagesBtn');
const installButton = document.getElementById('installButton');
const imageViewerModal = document.getElementById('imageViewerModal');
const viewerImage = document.getElementById('viewerImage');
const closeViewerBtn = document.getElementById('closeViewerBtn');

// --- PWA Install Prompt ---
let deferredPrompt;

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show the install button
    if (installButton) {
        installButton.style.display = 'block';
    }
    console.log('beforeinstallprompt event fired, install button shown');
});

// Handle install button click
if (installButton) {
    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) {
            console.log('No deferred prompt available');
            return;
        }
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // Clear the deferred prompt
        deferredPrompt = null;
        // Hide the install button
        installButton.style.display = 'none';
    });
}

// Listen for app installed event
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    // Hide the install button
    if (installButton) {
        installButton.style.display = 'none';
    }
    deferredPrompt = null;
});

// Image upload state
let uploadedImages = [];

// Cancellation state
let isCancelled = false;
let activeGenerationBtn = null;

// Custom prompts state
const MAX_CUSTOM_PROMPTS = 4;
let customPrompts = [];

// Image library state
const MAX_LIBRARY_IMAGES = 20;
const MAX_IMAGE_SIZE_KB = 500;
let libraryImages = [];

// ==========================================
// Status Display Functions
// ==========================================

// Show status message to user
function showStatus(message, type = 'info') {
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.className = 'status';

    if (type === 'error') {
        statusDiv.classList.add('error');
    } else if (type === 'success') {
        statusDiv.classList.add('success');
    } else if (type === 'warning') {
        statusDiv.classList.add('warning');
    } else {
        statusDiv.classList.add('info');
    }

    statusDiv.style.display = 'block';
}

// Clear status message
function clearStatus() {
    if (!statusDiv) return;
    statusDiv.textContent = '';
    statusDiv.style.display = 'none';
    statusDiv.className = 'status';
}

// ==========================================



// Settings Modal    // --- Event Listeners ---

// Camera
if (cameraBtn) {
    cameraBtn.addEventListener('click', () => {
        cameraFileInput.click();
    });
}

if (cameraFileInput) {
    cameraFileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files);
    });
}

// Settings Modal
settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
    // Fill apiKey input if exists
    const storedKey = localStorage.getItem('fal_api_key');
    if (storedKey) {
        apiKeyInput.value = storedKey;
    }
});


if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
    }

    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', () => {
            const key = apiKeyInput.value.trim();
            if (key) {
                localStorage.setItem('fal_api_key', key);
                checkApiKey();
                alert('APIキーを保存しました');
                settingsModal.style.display = 'none';
            } else {
                alert('APIキーを入力してください');
            }
        });
    }

    if (deleteApiKeyBtn) {
        deleteApiKeyBtn.addEventListener('click', () => {
            if (confirm('APIキーを削除してもよろしいですか？')) {
                localStorage.removeItem('fal_api_key');
                apiKeyInput.value = '';
                checkApiKey();
                alert('APIキーを削除しました');
            }


        });
    }
}

// Image Viewer Modal events
if (imageViewerModal) {
    imageViewerModal.addEventListener('click', (e) => {
        if (e.target === imageViewerModal) {
            imageViewerModal.style.display = 'none';
        }
    });

    if (closeViewerBtn) {
        closeViewerBtn.addEventListener('click', () => {
            imageViewerModal.style.display = 'none';
        });
    }
}

// Custom prompts accordion toggle
if (customPromptsToggle && customPromptsContent) {
    customPromptsToggle.addEventListener('click', () => {
        customPromptsToggle.classList.toggle('active');
        customPromptsContent.classList.toggle('active');
    });
}

// Image library accordion toggle
if (imageLibraryToggle && imageLibraryContent) {
    imageLibraryToggle.addEventListener('click', () => {
        imageLibraryToggle.classList.toggle('active');
        imageLibraryContent.classList.toggle('active');
    });
}



// Check API key and update warning display
function checkApiKey() {
    const savedApiKey = localStorage.getItem('fal_api_key');
    const hasApiKey = savedApiKey && savedApiKey.trim().length > 0;

    if (hasApiKey) {
        apiWarning.classList.remove('show');
    } else {
        apiWarning.classList.add('show');
    }

    return hasApiKey;
}

// Load saved API key, custom prompts, and library images from localStorage
window.addEventListener('DOMContentLoaded', async () => {
    const savedApiKey = localStorage.getItem('fal_api_key');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }

    // Load generation settings
    const savedNumImages = localStorage.getItem('num_images');
    if (savedNumImages) {
        numImagesSelect.value = savedNumImages;
    }

    const savedAspectRatio = localStorage.getItem('aspect_ratio');
    if (savedAspectRatio) {
        aspectRatioSelect.value = savedAspectRatio;
    }

    const savedResolution = localStorage.getItem('resolution');
    if (savedResolution) {
        resolutionSelect.value = savedResolution;
    }

    const savedOutputFormat = localStorage.getItem('output_format');
    if (savedOutputFormat) {
        outputFormatSelect.value = savedOutputFormat;
    }

    // Load saved prompt
    const savedPrompt = localStorage.getItem('saved_prompt');
    if (savedPrompt) {
        promptInput.value = savedPrompt;
    }

    // Load saved reference images
    const savedReferenceImages = localStorage.getItem('reference_images');
    if (savedReferenceImages) {
        try {
            const savedImages = JSON.parse(savedReferenceImages);
            // fileオブジェクトを復元（dataUrlからBlobを作成）
            uploadedImages = [];
            for (const img of savedImages) {
                if (img.dataUrl) {
                    // dataUrlからBlobを作成してFileオブジェクトを復元
                    const response = await fetch(img.dataUrl);
                    const blob = await response.blob();
                    const file = new File([blob], img.fileName || 'image.jpg', { type: blob.type });
                    uploadedImages.push({
                        file: file,
                        dataUrl: img.dataUrl
                    });
                }
            }
        } catch (e) {
            console.error('Failed to load reference images:', e);
            uploadedImages = [];
        }
    }

    // Load saved output images
    const savedOutputImages = localStorage.getItem('output_images');
    if (savedOutputImages) {
        try {
            const outputImages = JSON.parse(savedOutputImages);
            if (outputImages && outputImages.length > 0) {
                // Display saved output images
                displaySavedOutputImages(outputImages);
            }
        } catch (e) {
            console.error('Failed to load saved output images:', e);
        }
    }

    // Load custom prompts
    const savedPrompts = localStorage.getItem('custom_prompts');
    if (savedPrompts) {
        try {
            customPrompts = JSON.parse(savedPrompts);
        } catch (e) {
            customPrompts = [];
        }
    }

    // Initialize custom prompts if different length or empty
    if (customPrompts.length !== MAX_CUSTOM_PROMPTS) {
        // Adjust length to exactly MAX_CUSTOM_PROMPTS
        while (customPrompts.length < MAX_CUSTOM_PROMPTS) {
            customPrompts.push({ name: '', text: '' });
        }
        if (customPrompts.length > MAX_CUSTOM_PROMPTS) {
            customPrompts = customPrompts.slice(0, MAX_CUSTOM_PROMPTS);
        }
    }

    // Load library images
    const savedLibraryImages = localStorage.getItem('library_images');
    if (savedLibraryImages) {
        try {
            libraryImages = JSON.parse(savedLibraryImages);
        } catch (e) {
            libraryImages = [];
        }
    }

    renderCustomPrompts();
    renderLibraryImages();
    renderLibraryImages();
    checkPromptInput();
    checkApiKey();

    // 画像が0枚の状態でも、狙いのレイアウトにする
    updateImagePreview();

    // Check and resume interrupted generation
    await checkAndResumeGeneration();
});





// Render custom prompts list
// Render custom prompts list
function renderCustomPrompts() {
    if (!customPromptsList || !customPromptsButtons) {
        return;
    }

    customPromptsList.innerHTML = '';
    customPromptsButtons.innerHTML = '';

    customPrompts.forEach((prompt, index) => {
        // Render edit area in accordion
        const item = document.createElement('div');
        item.className = 'custom-prompt-item';

        // Header row with name input only (copy button removed)
        const headerRow = document.createElement('div');
        headerRow.className = 'custom-prompt-header';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'custom-prompt-name-input';
        nameInput.placeholder = `プロンプト名 ${index + 1}`;
        nameInput.value = prompt.name;
        nameInput.addEventListener('input', (e) => {
            customPrompts[index].name = e.target.value;
            saveCustomPrompts();
            renderCustomPromptsButtons();
        });

        headerRow.appendChild(nameInput);

        const textArea = document.createElement('textarea');
        textArea.className = 'custom-prompt-text';
        textArea.placeholder = 'プロンプトを入力...';
        textArea.value = prompt.text;
        textArea.rows = 2;
        textArea.addEventListener('input', (e) => {
            customPrompts[index].text = e.target.value;
            saveCustomPrompts();
            renderCustomPromptsButtons();
        });

        item.appendChild(headerRow);
        item.appendChild(textArea);
        customPromptsList.appendChild(item);
    });

    renderCustomPromptsButtons();
}

// Render custom prompts buttons outside accordion
function renderCustomPromptsButtons() {
    customPromptsButtons.innerHTML = '';

    customPrompts.forEach((prompt, index) => {
        const useBtn = document.createElement('button');
        useBtn.type = 'button';
        useBtn.className = 'use-prompt-btn';
        useBtn.textContent = prompt.name || `カスタムプロンプト ${index + 1}`;
        useBtn.addEventListener('click', () => useCustomPrompt(index));
        customPromptsButtons.appendChild(useBtn);
    });
}

// Save custom prompts to localStorage
function saveCustomPrompts() {
    localStorage.setItem('custom_prompts', JSON.stringify(customPrompts));
}

// Use custom prompt
function useCustomPrompt(index) {
    const prompt = customPrompts[index];
    if (prompt.text.trim()) {
        const currentText = promptInput.value;
        const newText = currentText ? (currentText + ' ' + prompt.text) : prompt.text;
        promptInput.value = newText;
        checkPromptInput();
        showStatus(`「${prompt.name || 'カスタムプロンプト ' + (index + 1)}」を追加しました`, 'success');
        setTimeout(() => clearStatus(), 2000);
    } else {
        showStatus('プロンプトが設定されていません', 'error');
        setTimeout(() => clearStatus(), 2000);
    }
}

// Check prompt input and enable/disable generate button
// Check prompt input and enable/disable generate button
function checkPromptInput() {
    if (promptInput) {
        const hasPrompt = promptInput.value.trim().length > 0;
        if (generateImageBtn) generateImageBtn.disabled = !hasPrompt;
        if (generateMangaBtn) generateMangaBtn.disabled = false; // Always enabled for manga mode
        if (editTextBtn) editTextBtn.disabled = !hasPrompt;
    }
}

// Monitor prompt input and auto-save
if (promptInput) {
    promptInput.addEventListener('input', () => {
        checkPromptInput();
        // Auto-save prompt
        localStorage.setItem('saved_prompt', promptInput.value);
    });
}

// Save generation settings when changed
if (numImagesSelect) {
    numImagesSelect.addEventListener('change', () => {
        localStorage.setItem('num_images', numImagesSelect.value);
    });
}

if (aspectRatioSelect) {
    aspectRatioSelect.addEventListener('change', () => {
        localStorage.setItem('aspect_ratio', aspectRatioSelect.value);
    });
}

if (resolutionSelect) {
    resolutionSelect.addEventListener('change', () => {
        localStorage.setItem('resolution', resolutionSelect.value);
    });
}

if (outputFormatSelect) {
    outputFormatSelect.addEventListener('change', () => {
        localStorage.setItem('output_format', outputFormatSelect.value);
    });
}

// Image library add button
if (libraryAddBtn && libraryFileInput) {
    libraryAddBtn.addEventListener('click', () => {
        if (libraryImages.length >= MAX_LIBRARY_IMAGES) {
            showStatus(`画像ライブラリは最大${MAX_LIBRARY_IMAGES}個までです`, 'error');
            setTimeout(() => clearStatus(), 2000);
            return;
        }
        libraryFileInput.click();
    });
}

// Image library file input
if (libraryFileInput) {
    libraryFileInput.addEventListener('change', async (e) => {
        await handleLibraryFileSelect(e.target.files);
        libraryFileInput.value = '';
    });
}

// Image library drag and drop handlers
const imageLibrarySection = document.querySelector('.image-library-section');

if (imageLibrarySection) {
    imageLibrarySection.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageLibrarySection.classList.add('dragover');
    });

    imageLibrarySection.addEventListener('dragleave', (e) => {
        // Only remove dragover if leaving the section entirely
        if (e.target === imageLibrarySection) {
            imageLibrarySection.classList.remove('dragover');
        }
    });

    imageLibrarySection.addEventListener('drop', async (e) => {
        e.preventDefault();
        imageLibrarySection.classList.remove('dragover');
        await handleLibraryFileSelect(e.dataTransfer.files);
    });
}

// Handle library file selection
async function handleLibraryFileSelect(files) {
    if (libraryImages.length >= MAX_LIBRARY_IMAGES) {
        showStatus(`画像ライブラリは最大${MAX_LIBRARY_IMAGES}個までです`, 'error');
        setTimeout(() => clearStatus(), 2000);
        return;
    }

    const fileArray = Array.from(files);
    const remainingSlots = MAX_LIBRARY_IMAGES - libraryImages.length;
    const filesToAdd = fileArray.slice(0, remainingSlots);

    for (const file of filesToAdd) {
        if (file.type.startsWith('image/')) {
            try {
                const compressed = await compressImage(file, MAX_IMAGE_SIZE_KB);
                libraryImages.push(compressed);
            } catch (error) {
                console.error('Image compression error:', error);
                showStatus('画像の圧縮に失敗しました', 'error');
                setTimeout(() => clearStatus(), 2000);
            }
        }
    }

    saveLibraryImages();
    renderLibraryImages();
}

// Compress image to target size
async function compressImage(file, maxSizeKB) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Start with original size
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Try different quality levels to get under maxSizeKB
                let quality = 0.9;
                let dataUrl;
                let sizeKB;

                const compress = () => {
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                    const base64Length = dataUrl.split(',')[1].length;
                    sizeKB = Math.round((base64Length * 3) / 4 / 1024);

                    if (sizeKB > maxSizeKB && quality > 0.1) {
                        // If still too large, reduce quality or dimensions
                        if (quality > 0.5) {
                            quality -= 0.1;
                        } else {
                            // Reduce dimensions
                            width = Math.floor(width * 0.9);
                            height = Math.floor(height * 0.9);
                            canvas.width = width;
                            canvas.height = height;
                            ctx.drawImage(img, 0, 0, width, height);
                            quality = 0.9;
                        }
                        compress();
                    } else {
                        resolve({
                            id: Date.now() + Math.random(),
                            dataUrl: dataUrl,
                            sizeKB: sizeKB,
                            width: width,
                            height: height
                        });
                    }
                };

                compress();
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Render library images
function renderLibraryImages() {
    imageLibraryGrid.innerHTML = '';

    libraryImages.forEach((image, index) => {
        const item = document.createElement('div');
        item.className = 'library-image-item';
        item.dataset.index = index;

        const img = document.createElement('img');
        img.src = image.dataUrl;
        img.alt = `Library ${index + 1}`;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'library-image-remove';
        removeBtn.textContent = '×';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeLibraryImage(index);
        };

        const sizeLabel = document.createElement('div');
        sizeLabel.className = 'library-image-size';
        sizeLabel.textContent = `${image.sizeKB}KB`;

        item.appendChild(img);
        item.appendChild(removeBtn);
        item.appendChild(sizeLabel);

        // Click to add to reference images
        item.addEventListener('click', () => {
            addLibraryImageToReference(index);
        });

        imageLibraryGrid.appendChild(item);
    });
}

// Save library images to localStorage
// Save library images to localStorage
function saveLibraryImages() {
    try {
        localStorage.setItem('library_images', JSON.stringify(libraryImages));
    } catch (e) {
        console.error('Failed to save library images (Storage full?):', e);
        showStatus('ライブラリの保存に失敗しました（容量制限の可能性があります）', 'warning');
    }
}

// Save reference images to localStorage
function saveReferenceImages() {
    try {
        // uploadedImagesからfileを除いてdataUrlのみ保存（fileはシリアライズできない）
        const toSave = uploadedImages.map(img => ({
            dataUrl: img.dataUrl,
            fileName: img.file ? img.file.name : 'image.jpg'
        }));
        localStorage.setItem('reference_images', JSON.stringify(toSave));
    } catch (e) {
        console.error('Failed to save reference images (Storage full?):', e);
    }
}

// Save output images to localStorage
function saveOutputImages(images) {
    try {
        localStorage.setItem('output_images', JSON.stringify(images));
    } catch (e) {
        console.error('Failed to save output images (Storage full?):', e);
        showStatus('保存容量が一杯のため、履歴には保存されませんでした（表示はされます）', 'warning');
    }
}

// ========== Generation State Persistence Functions ==========

// Save generation state when request is submitted
function saveGenerationState(requestId, statusUrl, resultUrl, params, useEditMode) {
    const state = {
        requestId,
        statusUrl,
        resultUrl,
        timestamp: Date.now(),
        status: 'polling',
        displayedToUser: false,  // Important: initially false (not yet displayed)
        prompt: promptInput ? promptInput.value.trim() : '',
        referenceImages: uploadedImages.map(img => ({
            dataUrl: img.dataUrl,
            fileName: img.file ? img.file.name : 'image.jpg'
        })),
        params,
        useEditMode
    };

    try {
        localStorage.setItem('generation_state', JSON.stringify(state));
        console.log('Generation state saved:', state);
    } catch (e) {
        console.error('Failed to save generation state (Storage full?):', e);
    }
}

// Load generation state from localStorage
function loadGenerationState() {
    try {
        const stateJson = localStorage.getItem('generation_state');
        if (!stateJson) return null;

        const state = JSON.parse(stateJson);

        // Check if state is too old (24 hours)
        const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
        if (Date.now() - state.timestamp > MAX_AGE) {
            console.log('Generation state expired, removing...');
            clearGenerationState();
            return null;
        }

        return state;
    } catch (e) {
        console.error('Failed to load generation state:', e);
        return null;
    }
}

// Clear generation state from localStorage
function clearGenerationState() {
    localStorage.removeItem('generation_state');
    console.log('Generation state cleared');
}

// Update only the status field in saved state
function updateGenerationStatus(status) {
    const state = loadGenerationState();
    if (state) {
        state.status = status;
        try {
            localStorage.setItem('generation_state', JSON.stringify(state));
            console.log('Generation status updated to:', status);
        } catch (e) {
            console.error('Failed to update generation status (Storage full?):', e);
        }
    }
}

// Resume polling for an interrupted generation
async function resumeGenerationPolling(state) {
    const apiKey = localStorage.getItem('fal_api_key');
    if (!apiKey) {
        showStatus('APIキーが見つかりません', 'error');
        clearGenerationState();
        return;
    }

    console.log('Resuming generation polling for request:', state.requestId);
    showStatus('前回の画像生成を再開しています...', 'info');

    try {
        let attempts = 0;
        const maxAttempts = 60;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second wait

            const statusResponse = await fetch(state.statusUrl, {
                headers: { 'Authorization': `Key ${apiKey}` }
            });

            if (!statusResponse.ok) {
                throw new Error(`Status check failed: ${statusResponse.status}`);
            }

            const statusData = await statusResponse.json();
            console.log('Resume polling status:', statusData.status);

            if (statusData.status === 'COMPLETED') {
                // Fetch result
                let result = statusData;
                if (!statusData.images || statusData.images.length === 0) {
                    const resultResponse = await fetch(state.resultUrl, {
                        headers: { 'Authorization': `Key ${apiKey}` }
                    });
                    if (resultResponse.ok) {
                        result = await resultResponse.json();
                    }
                }

                const imageData = result.data || result;
                displayResults(imageData);

                updateGenerationStatus('completed');
                return;

            } else if (statusData.status === 'FAILED') {
                throw new Error(statusData.error || '画像生成に失敗しました');
            }

            if (statusData.logs && statusData.logs.length > 0) {
                const lastLog = statusData.logs[statusData.logs.length - 1];
                showStatus(`生成中: ${lastLog.message || '処理中...'}`, 'info');
            }

            attempts++;
        }

        throw new Error('タイムアウト: 画像生成に時間がかかりすぎています');

    } catch (error) {
        console.error('Resume polling error:', error);
        showStatus(`再開エラー: ${error.message}`, 'error');
        updateGenerationStatus('failed');

        // Keep state for 5 minutes for retry
        setTimeout(() => {
            const currentState = loadGenerationState();
            if (currentState && currentState.status === 'failed') {
                clearGenerationState();
            }
        }, 5 * 60 * 1000);
    }
}

// Check and resume interrupted generation on app startup
async function checkAndResumeGeneration() {
    const state = loadGenerationState();

    if (!state) {
        console.log('No generation state found');
        return;
    }

    console.log('Found generation state:', state);

    // Skip if already displayed to user
    if (state.displayedToUser) {
        console.log('Generation already displayed to user, clearing state');
        clearGenerationState();
        return;
    }

    // If completed but not displayed, restore from output_images
    if (state.status === 'completed') {
        console.log('Generation completed but not displayed, restoring from output_images');
        const outputImagesJson = localStorage.getItem('output_images');
        if (outputImagesJson) {
            try {
                const images = JSON.parse(outputImagesJson);
                if (images && images.length > 0) {
                    displaySavedOutputImages(images);
                    // Mark as displayed
                    state.displayedToUser = true;
                    localStorage.setItem('generation_state', JSON.stringify(state));
                    return;
                }
            } catch (e) {
                console.error('Failed to restore output images:', e);
            }
        }
        clearGenerationState();
        return;
    }

    // Resume polling for pending or polling status
    if (state.status === 'pending' || state.status === 'polling') {
        await resumeGenerationPolling(state);
    }
}

// =============================================================

// Check if device is iOS
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));
}

// Display saved output images (on page load)
function displaySavedOutputImages(images) {
    resultsDiv.innerHTML = '';

    images.forEach((image, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';

        const img = document.createElement('img');
        img.src = image.url;
        img.alt = `Generated image ${index + 1}`;
        img.loading = 'lazy';
        img.style.cursor = 'pointer';
        img.title = 'クリックして編集';

        // Click to open image editor
        img.addEventListener('click', () => {
            openImageEditor(image.url);
        });

        const actions = document.createElement('div');
        actions.className = 'result-actions';

        const downloadLink = document.createElement('a');
        downloadLink.href = '#';
        downloadLink.textContent = 'ダウンロード';
        downloadLink.className = 'download-link';
        downloadLink.onclick = async (e) => {
            e.preventDefault();
            try {
                const response = await fetch(image.url);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);

                // Derive file extension from content type or URL
                let extension = '.png'; // Default fallback
                if (blob.type === 'image/jpeg') extension = '.jpg';
                else if (blob.type === 'image/webp') extension = '.webp';
                else if (blob.type === 'image/png') extension = '.png';
                else {
                    // Fallback: try to detect from URL
                    if (image.url.match(/\.jpe?g(\?|$)/i)) extension = '.jpg';
                    else if (image.url.match(/\.webp(\?|$)/i)) extension = '.webp';
                    else if (image.url.match(/\.png(\?|$)/i)) extension = '.png';
                }

                // Ensure filename has proper extension
                let filename = `scriptoon-${Date.now()}-${index}${extension}`;

                const tempLink = document.createElement('a');
                tempLink.href = blobUrl;
                tempLink.download = filename;
                document.body.appendChild(tempLink);
                tempLink.click();
                document.body.removeChild(tempLink);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
            } catch (error) {
                console.error('Download failed, using fallback:', error);
                // Fallback: try direct link with download attribute
                const fallbackFilename = `scriptoon-${Date.now()}-${index}.png`;
                const fallbackLink = document.createElement('a');
                fallbackLink.href = image.url;
                fallbackLink.download = fallbackFilename;
                fallbackLink.target = '_blank';
                document.body.appendChild(fallbackLink);
                fallbackLink.click();
                document.body.removeChild(fallbackLink);
            }
        };

        // Share button
        const shareBtn = document.createElement('button');
        shareBtn.textContent = '共有';
        shareBtn.className = 'share-btn';
        shareBtn.onclick = async (e) => {
            e.preventDefault();
            try {
                const response = await fetch(image.url);
                const blob = await response.blob();

                // Derive file extension from content type or URL
                let extension = '.png'; // Default fallback
                if (blob.type === 'image/jpeg') extension = '.jpg';
                else if (blob.type === 'image/webp') extension = '.webp';
                else if (blob.type === 'image/png') extension = '.png';
                else {
                    // Fallback: try to detect from URL
                    if (image.url.match(/\.jpe?g(\?|$)/i)) extension = '.jpg';
                    else if (image.url.match(/\.webp(\?|$)/i)) extension = '.webp';
                    else if (image.url.match(/\.png(\?|$)/i)) extension = '.png';
                }

                // Create filename with proper extension
                let filename = `scriptoon-${Date.now()}-${index}${extension}`;

                // Determine MIME type
                let mimeType = blob.type || 'image/png';
                if (extension === '.jpg') mimeType = 'image/jpeg';
                else if (extension === '.webp') mimeType = 'image/webp';
                else if (extension === '.png') mimeType = 'image/png';

                const file = new File([blob], filename, { type: mimeType });

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                    });
                } else if (navigator.share) {
                    await navigator.share({
                        url: image.url
                    });
                } else {
                    showStatus('この端末では共有機能が使えません', 'error');
                    setTimeout(() => clearStatus(), 2000);
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share failed:', error);
                    showStatus('共有に失敗しました', 'error');
                    setTimeout(() => clearStatus(), 2000);
                }
            }
        };

        actions.appendChild(downloadLink);
        actions.appendChild(shareBtn);

        // iOS hint for saving images
        if (isIOS()) {
            const iosHint = document.createElement('div');
            iosHint.className = 'ios-save-hint';
            iosHint.textContent = '💡 iPhoneは画像を長押しで保存';
            actions.appendChild(iosHint);
        }

        resultItem.appendChild(img);
        resultItem.appendChild(actions);
        resultsDiv.appendChild(resultItem);
    });
}



// Helper function to read file as data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Show confirmation dialog
function showConfirmDialog(message, onConfirm) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-dialog-overlay';

    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';

    // Message
    const messageEl = document.createElement('div');
    messageEl.className = 'confirm-dialog-message';
    messageEl.textContent = message;

    // Buttons container
    const buttonsEl = document.createElement('div');
    buttonsEl.className = 'confirm-dialog-buttons';

    // Yes button
    const yesBtn = document.createElement('button');
    yesBtn.className = 'confirm-dialog-btn yes';
    yesBtn.textContent = 'はい';
    yesBtn.onclick = () => {
        document.body.removeChild(overlay);
        onConfirm();
    };

    // No button
    const noBtn = document.createElement('button');
    noBtn.className = 'confirm-dialog-btn no';
    noBtn.textContent = 'いいえ';
    noBtn.onclick = () => {
        document.body.removeChild(overlay);
    };

    buttonsEl.appendChild(noBtn);
    buttonsEl.appendChild(yesBtn);

    dialog.appendChild(messageEl);
    dialog.appendChild(buttonsEl);
    overlay.appendChild(dialog);

    // Close on overlay click
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    };

    document.body.appendChild(overlay);
}

// Remove library image
function removeLibraryImage(index) {
    showConfirmDialog('ライブラリから削除しますか？', () => {
        libraryImages.splice(index, 1);
        saveLibraryImages();
        renderLibraryImages();
    });
}

// Add library image to reference images
function addLibraryImageToReference(index) {
    if (uploadedImages.length >= 5) {
        showStatus('参照画像は最大5枚までです', 'error');
        setTimeout(() => clearStatus(), 2000);
        return;
    }

    const libraryImage = libraryImages[index];

    // Convert dataUrl back to file
    fetch(libraryImage.dataUrl)
        .then(res => res.blob())
        .then(blob => {
            const file = new File([blob], `library-${index}.jpg`, { type: 'image/jpeg' });
            uploadedImages.push({
                file: file,
                dataUrl: libraryImage.dataUrl
            });
            updateImagePreview();
            showStatus('参照画像に追加しました', 'success');
            setTimeout(() => clearStatus(), 1500);
        });
}

// ... (skipping unchanged code)

// Image upload handlers - using capture phase to prevent bubbling issues
if (uploadDropZone && imageFileInput) {
    uploadDropZone.addEventListener('click', () => {
        imageFileInput.click();
    });

    // Fix: Add change listener for file input
    imageFileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files);
    });

    // Drag & drop handlers
    uploadDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadDropZone.classList.add('dragover');
    });

    uploadDropZone.addEventListener('dragleave', () => {
        uploadDropZone.classList.remove('dragover');
    });

    uploadDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadDropZone.classList.remove('dragover');
        handleFileSelect(e.dataTransfer.files);
    });
}

// ...

// Camera button handler removed (UI removed)

// Handle file selection (promoted to top level)

// Handle file selection
function handleFileSelect(files) {
    const remainingSlots = 5 - uploadedImages.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    filesToAdd.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImages.push({
                    file: file,
                    dataUrl: e.target.result
                });
                updateImagePreview();
            };
            reader.readAsDataURL(file);
        }
    });
}

// Update image preview
function updateImagePreview() {
    imagePreviewContainer.innerHTML = '';

    // Render uploaded images
    uploadedImages.forEach((img, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';

        const imgElement = document.createElement('img');
        imgElement.src = img.dataUrl;
        imgElement.alt = `Uploaded image ${index + 1}`;

        // Add click handler for viewer
        imgElement.onclick = (e) => {
            e.stopPropagation(); // Prevent file input open
            if (imageViewerModal && viewerImage) {
                viewerImage.src = img.dataUrl;
                imageViewerModal.style.display = 'flex';
            }
        };

        const removeBtn = document.createElement('button');
        removeBtn.className = 'image-remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeImage(index);
        };

        previewItem.appendChild(imgElement);
        previewItem.appendChild(removeBtn);
        imagePreviewContainer.appendChild(previewItem);
    });

    // Reset file input
    imageFileInput.value = '';
}


// Remove image
function removeImage(index) {
    uploadedImages.splice(index, 1);
    updateImagePreview();
}

// Convert base64 to Blob
function base64ToBlob(base64, mimeType) {
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeType });
}

// Upload image to FAL CDN
async function uploadFalImage(blob, mimeType, filename, apiKey) {
    // Step 1: Try 2-stage upload (Initiate + Upload)
    const restBase = 'https://rest.alpha.fal.ai/storage/upload';
    const initiateEndpoints = [
        `${restBase}/initiate?storage_type=fal-cdn-v3`,
        `${restBase}/initiate?storage_type=fal-cdn`,
        `${restBase}/initiate`
    ];

    for (const endpoint of initiateEndpoints) {
        try {
            // Initiate upload
            const initiateRes = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    content_type: mimeType,
                    file_name: filename
                })
            });

            if (!initiateRes.ok) continue;

            const data = await initiateRes.json();
            const uploadUrl = data.upload_url || data.uploadUrl;
            const fileUrl = data.file_url || data.fileUrl || data.url;

            if (!uploadUrl || !fileUrl) continue;

            // Upload file
            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': mimeType },
                body: blob
            });

            if (!uploadRes.ok) continue;

            // Success
            return { url: fileUrl, error: null };

        } catch (err) {
            console.warn('Initiate upload failed:', endpoint, err);
            continue;
        }
    }

    // Step 2: Fallback to FormData upload
    const legacyFormEndpoints = [
        'https://api.fal.ai/v1/storage/upload',
        'https://api.fal.run/v1/storage/upload',
        'https://fal.run/api/v1/storage/upload',
        'https://fal.ai/api/v1/storage/upload'
    ];

    for (const endpoint of legacyFormEndpoints) {
        try {
            const form = new FormData();
            form.append('file', blob, filename);
            form.append('content_type', mimeType);
            form.append('filename', filename);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Authorization': `Key ${apiKey}` },
                body: form
            });

            if (!response.ok) continue;

            const data = await response.json();
            const url = data.url || data.file_url || data.fileUrl;

            if (url) {
                return { url, error: null };
            }

        } catch (err) {
            console.warn('FormData upload failed:', endpoint, err);
            continue;
        }
    }

    // All upload attempts failed
    return { url: '', error: new Error('All upload attempts failed') };
}

// Set loading state
// Set loading state
// Set loading state
function setLoading(isLoading, buttonEl) {
    if (isLoading) {
        // Track the active button if provided
        if (buttonEl) activeGenerationBtn = buttonEl;

        const targetBtn = activeGenerationBtn || generateImageBtn;
        if (!targetBtn) return;

        // Find children elements
        const textSpan = targetBtn.querySelector('.btn-text');
        const loaderSpan = targetBtn.querySelector('.btn-loader');

        // Disable ALL buttons to prevent parallel generation
        if (generateImageBtn) generateImageBtn.disabled = true;
        if (generateMangaBtn) generateMangaBtn.disabled = true;
        if (editTextBtn) editTextBtn.disabled = true;

        if (textSpan) textSpan.style.display = 'none';
        if (loaderSpan) loaderSpan.style.display = 'inline-block';
        if (cancelBtn) cancelBtn.style.display = 'block';
        isCancelled = false;
    } else {
        // Use tracking button to restore state
        const targetBtn = activeGenerationBtn || generateImageBtn;

        if (targetBtn) {
            const textSpan = targetBtn.querySelector('.btn-text');
            const loaderSpan = targetBtn.querySelector('.btn-loader');

            if (textSpan) textSpan.style.display = 'inline-block';
            if (loaderSpan) loaderSpan.style.display = 'none';
        }

        // Reset tracking
        activeGenerationBtn = null;

        checkPromptInput(); // Re-enable based on prompt
        if (cancelBtn) cancelBtn.style.display = 'none';
    }
}

// Cancel generation
if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
        isCancelled = true;
        setLoading(false);
        showStatus('生成をキャンセルしました', 'info');
        console.log('Generation cancelled by user');
    });
}

// Call FAL API

// ==========================================
// Generation API & State Management
// ==========================================

// Save generation state for recovery
function saveGenerationState(requestId, statusUrl, resultUrl, params, useEditMode) {
    const state = {
        requestId,
        statusUrl,
        resultUrl,
        params,
        useEditMode,
        timestamp: Date.now(),
        status: 'polling',
        displayedToUser: false
    };
    localStorage.setItem('generation_state', JSON.stringify(state));
}

// Load generation state
function loadGenerationState() {
    const state = localStorage.getItem('generation_state');
    return state ? JSON.parse(state) : null;
}

// Update generation status in state
function updateGenerationStatus(status) {
    const state = loadGenerationState();
    if (state) {
        state.status = status;
        localStorage.setItem('generation_state', JSON.stringify(state));
    }
}

// Clear generation state
function clearGenerationState() {
    localStorage.removeItem('generation_state');
}

// Display results and save them
function displayResults(images) {
    // Standardize image format
    const standardizedImages = Array.isArray(images) ? images : (images.images || []);
    const processedImages = standardizedImages.map(img => ({
        url: img.url,
        width: img.width,
        height: img.height,
        content_type: img.content_type
    }));

    // Save to localStorage
    localStorage.setItem('output_images', JSON.stringify(processedImages));

    // Display
    displaySavedOutputImages(processedImages);
}



// Save reference images to localStorage
function saveReferenceImages() {
    const imagesToSave = uploadedImages.map(img => ({
        fileName: img.file ? img.file.name : 'image.jpg',
        dataUrl: img.dataUrl
    }));
    localStorage.setItem('reference_images', JSON.stringify(imagesToSave));
}

// Save output images to localStorage
function saveOutputImages(images) {
    localStorage.setItem('output_images', JSON.stringify(images));
}

// Check if device is iOS
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));
}

// Convert base64 to Blob
function base64ToBlob(base64, mimeType) {
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeType });
}

// Upload image to FAL CDN
async function uploadFalImage(blob, mimeType, filename, apiKey) {
    // Step 1: Try 2-stage upload (Initiate + Upload)
    const restBase = 'https://rest.alpha.fal.ai/storage/upload';
    const initiateEndpoints = [
        `${restBase}/initiate?storage_type=fal-cdn-v3`,
        `${restBase}/initiate?storage_type=fal-cdn`,
        `${restBase}/initiate`
    ];

    for (const endpoint of initiateEndpoints) {
        try {
            // Initiate upload
            const initiateRes = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    content_type: mimeType,
                    file_name: filename
                })
            });

            if (!initiateRes.ok) continue;

            const data = await initiateRes.json();
            const uploadUrl = data.upload_url || data.uploadUrl;
            const fileUrl = data.file_url || data.fileUrl || data.url;

            if (!uploadUrl || !fileUrl) continue;

            // Upload file
            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': mimeType },
                body: blob
            });

            if (!uploadRes.ok) continue;

            // Success
            return { url: fileUrl, error: null };

        } catch (err) {
            console.warn('Initiate upload failed:', endpoint, err);
            continue;
        }
    }

    // Step 2: Fallback to FormData upload
    const legacyFormEndpoints = [
        'https://api.fal.ai/v1/storage/upload',
        'https://api.fal.run/v1/storage/upload',
        'https://fal.run/api/v1/storage/upload',
        'https://fal.ai/api/v1/storage/upload'
    ];

    for (const endpoint of legacyFormEndpoints) {
        try {
            const form = new FormData();
            form.append('file', blob, filename);
            form.append('content_type', mimeType);
            form.append('filename', filename);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Authorization': `Key ${apiKey}` },
                body: form
            });

            if (!response.ok) continue;

            const data = await response.json();
            const url = data.url || data.file_url || data.fileUrl;

            if (url) {
                return { url, error: null };
            }

        } catch (err) {
            console.warn('FormData upload failed:', endpoint, err);
            continue;
        }
    }

    // All upload attempts failed
    return { url: '', error: new Error('All upload attempts failed') };
}

// Resume polling (simplified version)
async function resumeGenerationPolling(state) {
    const apiKey = localStorage.getItem('fal_api_key');
    if (!apiKey) return;

    console.log('Resuming polling...');
}

// Check and resume interrupted generation
async function checkAndResumeGeneration() {
    const state = loadGenerationState();
    if (!state) return;

    if (state.displayedToUser) {
        return;
    }

    if (state.status === 'completed') {
        const savedOutput = localStorage.getItem('output_images');
        if (savedOutput) {
            try {
                const images = JSON.parse(savedOutput);
                displaySavedOutputImages(images);
                // Mark as displayed
                state.displayedToUser = true;
                localStorage.setItem('generation_state', JSON.stringify(state));
            } catch (e) { console.error(e); }
        }
    }
}

// Call FAL API
async function callFalAPI(apiKey, params, useEditMode = false) {
    const baseUrl = 'https://queue.fal.run/fal-ai/nano-banana-pro';
    const FAL_API_URL = useEditMode ? `${baseUrl}/edit` : baseUrl;

    try {
        const submitResponse = await fetch(FAL_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...params,
                sync_mode: false
            })
        });

        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(errorData.detail || `HTTP error! status: ${submitResponse.status}`);
        }

        const submitData = await submitResponse.json();
        const requestId = submitData.request_id;
        const statusUrl = submitData.status_url || `${baseUrl}/requests/${requestId}/status`;
        const resultUrl = submitData.response_url || `${baseUrl}/requests/${requestId}`;

        console.log('API Request submitted:', {
            endpoint: FAL_API_URL,
            requestId: requestId,
            statusUrl: statusUrl,
            resultUrl: resultUrl,
            useEditMode: useEditMode
        });

        // Save generation state for recovery
        saveGenerationState(requestId, statusUrl, resultUrl, params, useEditMode);

        showStatus('リクエストを送信しました。画像を生成中...', 'info');

        // Poll for results
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max (5s interval)

        while (attempts < maxAttempts) {
            // Check if cancelled
            if (isCancelled) {
                console.log('Generation cancelled during polling');
                throw new Error('生成がキャンセルされました');
            }

            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

            // Check again after wait
            if (isCancelled) {
                console.log('Generation cancelled during polling');
                throw new Error('生成がキャンセルされました');
            }

            const statusResponse = await fetch(statusUrl, {
                headers: {
                    'Authorization': `Key ${apiKey}`,
                }
            });

            if (!statusResponse.ok) {
                throw new Error(`Status check failed: ${statusResponse.status}`);
            }

            const statusData = await statusResponse.json();
            console.log('Status check response:', {
                status: statusData.status,
                hasImages: !!(statusData.images && statusData.images.length > 0),
                attempt: attempts + 1
            });

            if (statusData.status === 'COMPLETED') {
                // Update generation status to completed
                updateGenerationStatus('completed');

                // Check if result is already in statusData
                if (statusData.images && statusData.images.length > 0) {
                    console.log('✓ Result found in status response, returning directly');
                    return statusData;
                }

                // Otherwise, fetch the actual result
                console.log('Fetching result from:', resultUrl);
                try {
                    const resultResponse = await fetch(resultUrl, {
                        headers: {
                            'Authorization': `Key ${apiKey}`,
                        }
                    });

                    console.log('Result fetch response status:', resultResponse.status);

                    if (!resultResponse.ok) {
                        console.warn(`✗ Result fetch failed with status ${resultResponse.status}`);
                        // If result fetch fails but we have statusData, try to use it
                        if (statusData) {
                            console.log('Using statusData as fallback (response not ok)');
                            return statusData;
                        }
                        throw new Error(`Result fetch failed: ${resultResponse.status}`);
                    }

                    const result = await resultResponse.json();
                    console.log('✓ Result fetched successfully:', {
                        hasImages: !!(result.images && result.images.length > 0),
                        hasData: !!(result.data)
                    });
                    return result;
                } catch (resultError) {
                    console.error('✗ Result fetch error:', resultError);
                    // If result fetch fails but we have completed status, try to use statusData
                    if (statusData) {
                        console.log('Using statusData as fallback (error caught)');
                        return statusData;
                    }
                    throw resultError;
                }
            } else if (statusData.status === 'FAILED') {
                // Update generation status to failed
                updateGenerationStatus('failed');
                throw new Error(statusData.error || '画像生成に失敗しました');
            }

            // Show progress if available
            if (statusData.logs && statusData.logs.length > 0) {
                const lastLog = statusData.logs[statusData.logs.length - 1];
                showStatus(`生成中: ${lastLog.message || '処理中...'}`, 'info');
            }

            attempts++;
        }

        throw new Error('タイムアウト: 画像生成に時間がかかりすぎています');
    } catch (error) {
        console.error('API Error Details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
}

// Display results
function displayResults(data) {
    resultsDiv.innerHTML = '';

    if (!data.images || data.images.length === 0) {
        showStatus('画像が生成されませんでした', 'error');
        return;
    }

    // Standardize image format (handle both direct array and result object)
    const images = Array.isArray(data.images) ? data.images : (data.data || []);

    // Save output images to localStorage
    saveOutputImages(images);

    // Use the comprehensive display function
    displaySavedOutputImages(images);

    showStatus(`${images.length}枚の画像を生成しました！`, 'success');

    // Mark generation as displayed to user
    const state = loadGenerationState();
    if (state) {
        state.displayedToUser = true;
        localStorage.setItem('generation_state', JSON.stringify(state));
        console.log('Generation marked as displayed to user');
    }
}

// Generate images
async function generateImages(mode = 'image', promptPrefix = '') {
    // Determine which button triggered this
    const targetBtn = mode === 'manga' ? generateMangaBtn : generateImageBtn;

    // Check if required elements exist
    if (!promptInput || !apiKeyInput) {
        showStatus('ページの読み込みに失敗しました。ページを再読み込みしてください。', 'error');
        return;
    }

    // Get prompt and apply optional prefix (without modifying the input field)
    const userPrompt = promptInput.value.trim();
    const prompt = promptPrefix ? promptPrefix + userPrompt : userPrompt;
    const apiKey = apiKeyInput.value.trim();

    // Validation
    // Validation
    // Manga mode can run without user prompt (uses default manga prompt)
    if (!userPrompt && mode !== 'manga') {
        showStatus('プロンプトを入力してください', 'error');
        return;
    }

    if (!apiKey) {
        showStatus('APIキーを入力してください', 'error');
        return;
    }

    // Check if API key contains only ASCII characters (to prevent fetch header errors)
    if (!/^[\x00-\x7F]*$/.test(apiKey)) {
        showStatus('APIキーに無効な文字が含まれています。英数字と記号のみ使用できます。', 'error');
        return;
    }

    // Save API key
    localStorage.setItem('fal_api_key', apiKey);

    // Check if using edit mode (with reference images)
    const useEditMode = uploadedImages.length > 0;

    // Prepare request parameters
    // Define manga creation prompt to append when in manga mode
    const MANGA_PROMPT_SUFFIX = `
"request type": "Generate ultra-high-quality and expressive Japanese manga pages ",
 "description": "アップロードされている資料を詳細に分析し、読み取った漫画のストーリーを**アップロードされているキャラクター画像の外見の特徴を忠実に反映させ**ステップバイステップにストーリーが伝わるプロフェッショナルな漫画1ページを日本の漫画家の技法を最大限用いて作成してください

"step": 1,
"name": アップロードされている画像の役割を判別する
"action": "アップロードされている画像を１枚ずつ４つの役割のいずれかに慎重に仕分けする"
"details":
-アップロードされている画像を、漫画に登場するキャラクターシート、漫画の舞台、既に作成済みの清書された漫画、漫画のストーリーの下書き、これら4つの役割に仕分ける

"step": 2,
"name": "漫画のストーリーの重要度を判断する
"action":既に作成済みの清書された漫画と漫画のストーリーの下書きを読み解き物語のそれぞれの場面の重要性を判断する",

"step": 3,
"name": ストーリーに合わせた漫画のコマ形状・コマ配置計画",
"action": "読み取った漫画のストーリーの下書きを漫画にするため、コマ割り計画をプロフェッショナルな漫画のテクニックを用いてストーリーが読みやすく内容を魅力的に伝える計画を行う",
"details":
-ストーリーの進行は日本の漫画形式に合わせて**右上から左下**の順番に進める。
-キャラクターの感情変化や激しい動きに合わせて変則的または自由配置なコマ構成とする。
-ストーリーを最大限伝える描写をイメージしながらコマの数は極力少ないものとする
-コマ毎に表現する内容の重要性や意味に基づき、コマのサイズと形を決定する
  - **大コマ**：重要性がもっとも高い。激しい動き、激しい感情変化、話の結論シーン、動作完了のシーン、セリフ量が多いシーン 
  - **中・小コマ**：説明、会話、経過  
  - **重なる浮きコマ**：会話や動作によって即座に起こる次のシーンを印象付ける
  - **ぶち抜きコマ**：キャラクターの身体がコマから飛び出る表現、キャラクターの動作や会話を超印象付ける重要なシーンに使用
  - **斜めコマ**：勢いや迫力、驚きやスピード感を出す
-キャラクターの感情変化や激しい動きが無い場合は四角のコマ構成とする
-漫画の始めのコマは右上からスタートする
-漫画１ページの構成は１段のみの構成、２段構成、3段構成のいずれかとする
-いずれかの段を右と左に分ける2コマで構成する場合、その下部のコマは横に長い1コマとする
-コマの配置は空きスペースを確認して常に空きスペースに対して上につめる
-コマの配置は段ごとに下線部を揃える
-コマの配置は常に右詰めとする

"step": 4,
"name": "ストーリーに合わせたキャラクターの構図決定",
"action": "ストーリーを魅力的に表現するため漫画のテクニックを用いてコマ毎にキャラクターの構図を計画する",
"details":
【テクニック】
-**他のキャラクターと描き分けるためアップロードされている漫画に登場するキャラクターの画像を参照する**
【テクニック】
-**アップロードされている漫画に登場するキャラクターの服装と髪型の特徴を詳細に漫画に反映する**
【テクニック】描写対象の構図を変える
- **禁止事項**：キャラクターの正面バストアップ描写の連続
- 対策：  
  - キャラクターの全身姿や物語の舞台を広く見せるロングショット  
  - 動きのある手元・動きのある足元・小物のインサート  
  - 背中で語る構図  
  - 背中超しから話者を見るショルダーショットの構図  
  - 全てのコマの構図または表現方法に変化をつける

【テクニック】アングルでキャラクターの置かれた状況や心境を表現する
- **俯瞰**：状況説明、孤独・弱さ  
- **アオリ**：迫力、威圧、希望、存在感

【テクニック】効果的なフレーミングを行う
- 表情の一部だけを見せる、身体の一部をアップにするなどで心理描写を強調  
- 伝えたい意図が最も伝わる「被写体の切り取り方」を常に模索し、感情や行動、思考の様子を最大限表現する 

"step": 5,
"name": "ストーリーに合わせたキャラクターとセリフの描写",
"action": "ストーリーに合わせて計画されているキャラクターや背景、吹き出しを高品質で傑作となるように描写する
"details":
- アップロードされているキャラクター画像の色から描写する画風と色調を判断。    
-ストーリーは漫画の技法、映画の演出技法、アニメの演出技法を用いて表現豊かなものとする 
-ストーリーを直感的にダイナミックに伝えるためエフェクトを加えてストーリーを情緒豊かに加筆する"
-動きの軌跡を描く、動作の方向性を表現する
-キャラクター動作に合わせ動作の方向性を表現するアクション線・スピード線・効果線・モーションブラーを加える
-キャラクター画像の顔の特徴を分析し、キャラクターの感情に合わせて陰影を加える、デフォルト顔にする、劇画風にする等テクニックを用いて表情豊かにする
-**禁止事項**アップロードされているキャラクターの**特徴(特に髪型や服装や画風やフォルム)**を反映させない完全な別人へのアレンジ  
-アップロードされているキャラクター独自の特有の個性や象徴となるシンボルを確実に反映させる
-ストーリーの「」内のセリフや心の声は感情表現に合わせて最適な形を選定して情緒豊かな吹き出しにする
-日本のタイポグラファ－エージェントを入れて、吹き出し内にセリフ文字を正しく描写する
-**禁止事項**漫画の吹き出し内のセリフにフリガナをつけることや同じ単語の繰り返し。
-ストーリーに書かれているセリフや心の声以外の文章は漫画には記載しない
-**禁止事項**「」内のセリフを英語にすること。「」内に英語指示がある場合は指示に従う
- セリフだけでなく、背景（色ベタ・効果線など）や、吹き出し色付け、レンズ効果、被写体深度で心理描写を行う
-**禁止事項**オノマトペ(擬音語)や効果音を記載する。
-読み取った漫画のストーリーの内容は全てイラストで表現する
-吹き出しの**中心を結んだ線**が右から左、上から下に自然と進むように吹き出し配置を行いストーリーの順に合わせて視線を誘導する

"step": 6,
"name": "出力前チェック",
"action": "計画された漫画１ページの画像を出力する前にこれまでのstepで指示されている内容を確認し、現在の計画に不適合があれば是正する ",
"details":
-**各step毎に禁止されていることを確認して現在の計画が適切になるように画像出力前に計画の修正を行う**
-漫画のストーリーの下書き内に書かれたセリフ以外の文章(ストーリー)を作成予定の漫画１ページに文字で記載予定ならば削除して、その内容はイラスト化する
-右上から始まる漫画になっているか確認を行い、不適切な場合は是正する
-高品質な漫画になっていないことを疑い、最高傑作で最高品質となったものを出力する
-**アップロードされている画像のキャラクターがストーリーの指示通りに登場する漫画になっているか髪型や服装や外見的な特徴の確認を行い不適切な場合は是正する**
`;

    // Build the final prompt - append manga suffix if in manga mode
    let finalPrompt = prompt;
    if (mode === 'manga') {
        finalPrompt = prompt + '\n\n' + MANGA_PROMPT_SUFFIX;
        console.log('Manga mode: Appended manga creation instructions to prompt');
    }

    const params = {
        prompt: finalPrompt,
        num_images: numImagesSelect ? parseInt(numImagesSelect.value) : 1,
        aspect_ratio: aspectRatioSelect ? aspectRatioSelect.value : '1:1',
        resolution: resolutionSelect ? resolutionSelect.value : '1K',
        output_format: outputFormatSelect ? outputFormatSelect.value : 'jpeg',
    };

    setLoading(true, targetBtn);
    clearStatus();
    resultsDiv.innerHTML = '';

    try {
        // Upload reference images to FAL CDN if in edit mode
        if (useEditMode) {
            showStatus('参照画像をアップロード中...', 'info');
            const imageUrls = [];

            for (let i = 0; i < uploadedImages.length; i++) {
                const img = uploadedImages[i];

                // Extract base64 from data URL
                const base64Match = img.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
                if (!base64Match) {
                    // Fallback to data URI
                    imageUrls.push(img.dataUrl);
                    continue;
                }

                const mimeType = base64Match[1];
                const base64Data = base64Match[2];
                const filename = img.file.name || `image-${i}.jpg`;

                // Convert to blob and upload
                const blob = base64ToBlob(base64Data, mimeType);
                const uploadResult = await uploadFalImage(blob, mimeType, filename, apiKey);

                if (uploadResult.url) {
                    // Use CDN URL
                    imageUrls.push(uploadResult.url);
                    console.log(`✓ Uploaded ${filename} to FAL CDN:`, uploadResult.url);
                } else {
                    // Fallback to base64 data URI
                    console.warn(`✗ Upload failed for ${filename}, using base64 fallback`);
                    imageUrls.push(img.dataUrl);
                }
            }

            params.image_urls = imageUrls;
        }

        showStatus('画像生成リクエストを送信中...', 'info');
        const result = await callFalAPI(apiKey, params, useEditMode);
        console.log('API Result:', result);

        // FAL APIのレスポンス構造に対応
        // resultに直接imagesがある場合と、result.dataにある場合の両方に対応
        const imageData = result.data || result;
        displayResults(imageData);
    } catch (error) {
        showStatus(`エラー: ${error.message}`, 'error');
        console.error('Generation error:', error);
    } finally {
        setLoading(false, targetBtn);
    }
}

// Event listener
// Event listeners for dual generation buttons
if (generateImageBtn) {
    generateImageBtn.addEventListener('click', () => {
        // Mode 1: Image Generation
        generateImages('image');
    });
}

if (generateMangaBtn) {
    generateMangaBtn.addEventListener('click', () => {
        // Mode 2: Manga Generation
        // Currently shares the same logic but allows for future differentiation
        generateImages('manga');
    });
}

// Edit Text button with special prompt prepending
if (editTextBtn) {
    editTextBtn.addEventListener('click', () => {
        // Mode 3: Text Editing - prepend special prompt for manga text editing
        const textEditPrompt = `アップロードされている画像で**赤く塗りつぶされている四角い場所に指定する文字をルールに従って画像で描写してください**。

＃ルール

-指定文字を画像で配置する順番は「」毎に赤く塗りつぶしされた場所に日本の漫画形式に従って右から左、上から下の順に配置する。

-指定文字の「」内に書かれた文字を配置する

-赤く塗りつぶされた四角を完全に削除する。

-赤く塗りつぶされた四角い場所は画像の背景に合うように修正する

-指定文字を画像で描写する際は不均一な配置を許可する

-指定文字は全て描写する

-描写する文字画像全体の計画を立てた後に日本語が正しいか確認を行い描写する

＃指定文字

`;
        // Pass the special prompt prefix without modifying the input field
        generateImages('image', textEditPrompt);
    });
}

// Clear prompt button
if (clearPromptBtn) {
    clearPromptBtn.addEventListener('click', () => {
        if (promptInput) {
            promptInput.value = '';
        }
        localStorage.setItem('saved_prompt', '');
        checkPromptInput();
    });
}

// Clear images button
if (clearImagesBtn) {
    clearImagesBtn.addEventListener('click', () => {
        uploadedImages = [];
        saveReferenceImages();
        updateImagePreview();
    });
}

// ==========================================
// PWA Install Logic
// ==========================================
let deferredPrompt;

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    if (installButton) {
        installButton.style.display = 'flex';
        console.log('PWA installation available: Install button shown');
    }
});

// Handle the install click
if (installButton) {
    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again, discard it
        deferredPrompt = null;
        // Hide the install button
        installButton.style.display = 'none';
    });
}

// Log when the app has been installed
window.addEventListener('appinstalled', () => {
    if (installButton) installButton.style.display = 'none';
    deferredPrompt = null;
    console.log('PWA was installed');
});

// ==========================================
// Image Editor Functionality
// ==========================================

// Image Editor State
const imageEditorModal = document.getElementById('imageEditorModal');
const editorCanvas = document.getElementById('editorCanvas');
const editorCanvasContainer = document.getElementById('editorCanvasContainer');
const closeEditorBtn = document.getElementById('closeEditorBtn');
const cancelEditorBtn = document.getElementById('cancelEditorBtn');
const saveEditorBtn = document.getElementById('saveEditorBtn');
const addRedFrameBtn = document.getElementById('addRedFrameBtn');
const deleteFrameBtn = document.getElementById('deleteFrameBtn');

let editorCtx = editorCanvas ? editorCanvas.getContext('2d') : null;
let editorImage = null;
let editorImageType = 'image/png'; // Track original image type
let redFrames = [];
let selectedFrame = null;
let isDragging = false;
let isResizing = false;
let isRotating = false;
let dragStartX = 0;
let dragStartY = 0;
let resizeHandle = null;

// Red Frame class
class RedFrame {
    constructor(x, y, width = 100, height = 60) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.rotation = 0;
        this.selected = false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // Draw filled red rectangle
        ctx.fillStyle = 'rgba(255, 0, 0, 1)';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Draw border if selected
        if (this.selected) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.setLineDash([]);

            // Draw resize handles
            const handleSize = 10;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;

            // Corner handles
            const corners = [
                { x: -this.width / 2, y: -this.height / 2 },
                { x: this.width / 2, y: -this.height / 2 },
                { x: -this.width / 2, y: this.height / 2 },
                { x: this.width / 2, y: this.height / 2 }
            ];

            corners.forEach(corner => {
                ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
                ctx.strokeRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
            });

            // Rotation handle
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 2);
            ctx.lineTo(0, -this.height / 2 - 25);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, -this.height / 2 - 30, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#4CAF50';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
        }

        ctx.restore();
    }

    contains(x, y) {
        // Transform point to local coordinates
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);
        const dx = x - cx;
        const dy = y - cy;
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        return Math.abs(localX) <= this.width / 2 && Math.abs(localY) <= this.height / 2;
    }

    getHandleAt(x, y) {
        if (!this.selected) return null;

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);
        const dx = x - cx;
        const dy = y - cy;
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        const handleSize = 15;

        // Check rotation handle
        if (Math.abs(localX) < handleSize && localY < -this.height / 2 - 15 && localY > -this.height / 2 - 45) {
            return 'rotate';
        }

        // Check corner handles
        const corners = [
            { name: 'nw', x: -this.width / 2, y: -this.height / 2 },
            { name: 'ne', x: this.width / 2, y: -this.height / 2 },
            { name: 'sw', x: -this.width / 2, y: this.height / 2 },
            { name: 'se', x: this.width / 2, y: this.height / 2 }
        ];

        for (const corner of corners) {
            if (Math.abs(localX - corner.x) < handleSize && Math.abs(localY - corner.y) < handleSize) {
                return corner.name;
            }
        }

        return null;
    }
}

// Open image editor
function openImageEditor(imageUrl) {
    if (!imageEditorModal || !editorCanvas) return;

    imageEditorModal.style.display = 'flex';
    redFrames = [];
    selectedFrame = null;

    // Detect image type from URL or fetch
    editorImageType = 'image/png'; // Default
    if (imageUrl.match(/\.jpe?g(\?|$)/i)) {
        editorImageType = 'image/jpeg';
    } else if (imageUrl.match(/\.webp(\?|$)/i)) {
        editorImageType = 'image/webp';
    } else if (imageUrl.match(/\.png(\?|$)/i)) {
        editorImageType = 'image/png';
    }

    // Load image
    editorImage = new Image();
    editorImage.crossOrigin = 'anonymous';
    editorImage.onload = () => {
        // Set canvas size based on image and container
        const containerWidth = editorCanvasContainer.clientWidth - 40;
        const containerHeight = editorCanvasContainer.clientHeight - 40;

        let scale = Math.min(
            containerWidth / editorImage.width,
            containerHeight / editorImage.height,
            1
        );

        editorCanvas.width = editorImage.width * scale;
        editorCanvas.height = editorImage.height * scale;

        renderEditor();
    };
    editorImage.onerror = () => {
        console.error('Failed to load image for editing');
        showStatus('画像の読み込みに失敗しました', 'error');
        setTimeout(() => clearStatus(), 2000);
        closeImageEditor();
    };
    editorImage.src = imageUrl;

    updateDeleteButtonState();
}

// Close image editor
function closeImageEditor() {
    if (imageEditorModal) {
        imageEditorModal.style.display = 'none';
    }
    redFrames = [];
    selectedFrame = null;
    editorImage = null;
}

// Render editor canvas
function renderEditor() {
    if (!editorCtx || !editorImage) return;

    // Clear canvas
    editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);

    // Draw image
    editorCtx.drawImage(editorImage, 0, 0, editorCanvas.width, editorCanvas.height);

    // Draw all red frames
    redFrames.forEach(frame => frame.draw(editorCtx));
}

// Add red frame
function addRedFrame() {
    const x = editorCanvas.width / 2 - 50;
    const y = editorCanvas.height / 2 - 30;
    const frame = new RedFrame(x, y);
    frame.selected = true;

    // Deselect others
    redFrames.forEach(f => f.selected = false);

    redFrames.push(frame);
    selectedFrame = frame;
    updateDeleteButtonState();
    renderEditor();
}

// Delete selected frame
function deleteSelectedFrame() {
    if (selectedFrame) {
        const index = redFrames.indexOf(selectedFrame);
        if (index > -1) {
            redFrames.splice(index, 1);
        }
        selectedFrame = null;
        updateDeleteButtonState();
        renderEditor();
    }
}

// Update delete button state
function updateDeleteButtonState() {
    if (deleteFrameBtn) {
        deleteFrameBtn.disabled = !selectedFrame;
    }
}

// Get canvas coordinates from event
function getCanvasCoords(e) {
    const rect = editorCanvas.getBoundingClientRect();
    const scaleX = editorCanvas.width / rect.width;
    const scaleY = editorCanvas.height / rect.height;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// Handle pointer down
function handlePointerDown(e) {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);

    // Check if clicking on a handle of selected frame
    if (selectedFrame) {
        const handle = selectedFrame.getHandleAt(x, y);
        if (handle) {
            if (handle === 'rotate') {
                isRotating = true;
            } else {
                isResizing = true;
                resizeHandle = handle;
            }
            dragStartX = x;
            dragStartY = y;
            return;
        }
    }

    // Check if clicking on a frame
    let clickedFrame = null;
    for (let i = redFrames.length - 1; i >= 0; i--) {
        if (redFrames[i].contains(x, y)) {
            clickedFrame = redFrames[i];
            break;
        }
    }

    // Update selection
    redFrames.forEach(f => f.selected = false);
    if (clickedFrame) {
        clickedFrame.selected = true;
        selectedFrame = clickedFrame;
        isDragging = true;
        dragStartX = x - clickedFrame.x;
        dragStartY = y - clickedFrame.y;
    } else {
        selectedFrame = null;
    }

    updateDeleteButtonState();
    renderEditor();
}

// Handle pointer move
function handlePointerMove(e) {
    if (!selectedFrame) return;

    const { x, y } = getCanvasCoords(e);

    if (isDragging) {
        selectedFrame.x = x - dragStartX;
        selectedFrame.y = y - dragStartY;
        renderEditor();
    } else if (isResizing) {
        const cx = selectedFrame.x + selectedFrame.width / 2;
        const cy = selectedFrame.y + selectedFrame.height / 2;

        // Calculate new size based on handle
        const cos = Math.cos(-selectedFrame.rotation);
        const sin = Math.sin(-selectedFrame.rotation);
        const dx = x - cx;
        const dy = y - cy;
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        const minSize = 30;

        if (resizeHandle.includes('e')) {
            selectedFrame.width = Math.max(minSize, localX * 2);
        }
        if (resizeHandle.includes('w')) {
            selectedFrame.width = Math.max(minSize, -localX * 2);
        }
        if (resizeHandle.includes('s')) {
            selectedFrame.height = Math.max(minSize, localY * 2);
        }
        if (resizeHandle.includes('n')) {
            selectedFrame.height = Math.max(minSize, -localY * 2);
        }

        // Recenter
        selectedFrame.x = cx - selectedFrame.width / 2;
        selectedFrame.y = cy - selectedFrame.height / 2;

        renderEditor();
    } else if (isRotating) {
        const cx = selectedFrame.x + selectedFrame.width / 2;
        const cy = selectedFrame.y + selectedFrame.height / 2;
        selectedFrame.rotation = Math.atan2(x - cx, -(y - cy));
        renderEditor();
    }
}

// Handle pointer up
function handlePointerUp() {
    isDragging = false;
    isResizing = false;
    isRotating = false;
    resizeHandle = null;
}

// Save edited image
function saveEditedImage() {
    if (!editorCanvas || !editorImage) return;

    // Create high-resolution canvas for export
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = editorImage.width;
    exportCanvas.height = editorImage.height;
    const exportCtx = exportCanvas.getContext('2d');

    // Calculate scale
    const scaleX = editorImage.width / editorCanvas.width;
    const scaleY = editorImage.height / editorCanvas.height;

    // Draw original image
    exportCtx.drawImage(editorImage, 0, 0);

    // Draw red frames at full resolution
    redFrames.forEach(frame => {
        exportCtx.save();
        exportCtx.translate((frame.x + frame.width / 2) * scaleX, (frame.y + frame.height / 2) * scaleY);
        exportCtx.rotate(frame.rotation);

        exportCtx.fillStyle = 'rgba(255, 0, 0, 1)';
        exportCtx.fillRect(
            -frame.width * scaleX / 2,
            -frame.height * scaleY / 2,
            frame.width * scaleX,
            frame.height * scaleY
        );

        exportCtx.restore();
    });

    // Determine file extension based on image type
    let fileExtension = '.png';
    if (editorImageType === 'image/jpeg') fileExtension = '.jpg';
    else if (editorImageType === 'image/webp') fileExtension = '.webp';

    // Export in original format
    const quality = editorImageType === 'image/png' ? undefined : 0.92;
    exportCanvas.toBlob((blob) => {
        if (!blob) {
            showStatus('画像の保存に失敗しました', 'error');
            setTimeout(() => clearStatus(), 2000);
            return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scriptoon-edited-${Date.now()}${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showStatus('編集画像を保存しました', 'success');
        setTimeout(() => clearStatus(), 2000);
        closeImageEditor();
    }, editorImageType, quality);
}

// Event listeners for image editor
if (editorCanvas) {
    editorCanvas.addEventListener('mousedown', handlePointerDown);
    editorCanvas.addEventListener('mousemove', handlePointerMove);
    editorCanvas.addEventListener('mouseup', handlePointerUp);
    editorCanvas.addEventListener('mouseleave', handlePointerUp);

    editorCanvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    editorCanvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    editorCanvas.addEventListener('touchend', handlePointerUp);
    editorCanvas.addEventListener('touchcancel', handlePointerUp);
}

if (closeEditorBtn) {
    closeEditorBtn.addEventListener('click', closeImageEditor);
}

if (cancelEditorBtn) {
    cancelEditorBtn.addEventListener('click', closeImageEditor);
}

if (saveEditorBtn) {
    saveEditorBtn.addEventListener('click', saveEditedImage);
}

if (addRedFrameBtn) {
    addRedFrameBtn.addEventListener('click', addRedFrame);
}

if (deleteFrameBtn) {
    deleteFrameBtn.addEventListener('click', deleteSelectedFrame);
}

// Close modal on overlay click
if (imageEditorModal) {
    imageEditorModal.addEventListener('click', (e) => {
        if (e.target === imageEditorModal) {
            closeImageEditor();
        }
    });
}
