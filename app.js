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
    const storedKey = localStorage.getItem('fal_key');
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

        // Header row with name input and copy button
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

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'custom-prompt-copy-btn';
        copyBtn.textContent = 'コピー';
        copyBtn.onclick = async () => {
            if (prompt.text) {
                try {
                    await navigator.clipboard.writeText(prompt.text);
                    copyBtn.textContent = 'コピー済';
                    setTimeout(() => {
                        copyBtn.textContent = 'コピー';
                    }, 1500);
                } catch (err) {
                    console.error('Copy failed:', err);
                }
            }
        };

        headerRow.appendChild(nameInput);
        headerRow.appendChild(copyBtn);

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
        if (generateMangaBtn) generateMangaBtn.disabled = !hasPrompt;
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
        img.crossOrigin = 'anonymous'; // Enable cross-origin image saving

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
                const tempLink = document.createElement('a');
                tempLink.href = blobUrl;
                tempLink.download = image.file_name || `banana-${Date.now()}-${index}.png`;
                document.body.appendChild(tempLink);
                tempLink.click();
                document.body.removeChild(tempLink);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
            } catch (error) {
                console.error('Download failed:', error);
                window.open(image.url, '_blank');
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
                const file = new File([blob], image.file_name || `banana-${Date.now()}-${index}.png`, { type: blob.type });

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

        // Disable BOTH buttons to prevent parallel generation
        if (generateImageBtn) generateImageBtn.disabled = true;
        if (generateMangaBtn) generateMangaBtn.disabled = true;

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
async function generateImages(mode = 'image') {
    // Determine which button triggered this
    const targetBtn = mode === 'manga' ? generateMangaBtn : generateImageBtn;

    // Check if required elements exist
    if (!promptInput || !apiKeyInput) {
        showStatus('ページの読み込みに失敗しました。ページを再読み込みしてください。', 'error');
        return;
    }

    const prompt = promptInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    // Validation
    if (!prompt) {
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
    const params = {
        prompt: prompt,
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
// iOS PWA Install Guide
// ==========================================
// Detect iOS and show install guide if not in standalone mode
(function () {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    const iosPwaGuide = document.getElementById('iosPwaGuide');

    if (isIOS && !isStandalone && iosPwaGuide) {
        iosPwaGuide.style.display = 'block';
        console.log('iOS detected, showing PWA install guide');
    }
})();
