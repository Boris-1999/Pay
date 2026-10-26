/* ==========================================================================
   Google Pay Complete Application Logic (Dark Mode & Simulated UPI Flow)
   Zero real money debited - 100% authentic Google Pay experience
   ========================================================================== */

// DOM Elements
const btnScanQR = document.getElementById('btnScanQR');
const btnFloatingScanQR = document.getElementById('btnFloatingScanQR');
const scannerScreen = document.getElementById('scannerScreen');
const btnCloseScanner = document.getElementById('btnCloseScanner');
const btnTorch = document.getElementById('btnTorch');
const btnMyQR = document.getElementById('btnMyQR');
const myQrModal = document.getElementById('myQrModal');
const btnCloseMyQr = document.getElementById('btnCloseMyQr');
const myQrContainer = document.getElementById('myQrContainer');
const btnUploadGallery = document.getElementById('btnUploadGallery');
const galleryFileInput = document.getElementById('galleryFileInput');

const scannerVideo = document.getElementById('scannerVideo');
const scannerCanvas = document.getElementById('scannerCanvas');
const canvasCtx = scannerCanvas.getContext('2d');
const scanTargetLock = document.getElementById('scanTargetLock');
const scannerLaser = document.getElementById('scannerLaser');

// Payment Modal Elements
const paymentModalBackdrop = document.getElementById('paymentModalBackdrop');
const btnClosePaymentSheet = document.getElementById('btnClosePaymentSheet');
const payeeAvatar = document.getElementById('payeeAvatar');
const payeeNameDisplay = document.getElementById('payeeNameDisplay');
const payeeVpaDisplay = document.getElementById('payeeVpaDisplay');
const bankingNameText = document.getElementById('bankingNameText');
const paymentAmountInput = document.getElementById('paymentAmountInput');
const paymentNoteInput = document.getElementById('paymentNoteInput');
const btnConfirmPay = document.getElementById('btnConfirmPay');
const btnPayText = document.getElementById('btnPayText');

// UPI PIN Overlay Elements
const upiPinOverlay = document.getElementById('upiPinOverlay');
const pinPayingTo = document.getElementById('pinPayingTo');
const pinAmountVal = document.getElementById('pinAmountVal');
let enteredPin = '';

// Success Celebration Screen Elements
const successScreen = document.getElementById('successScreen');
const lottieSuccessAnim = document.getElementById('lottieSuccessAnim');
const successReceiptInfo = document.getElementById('successReceiptInfo');
const successAmountDisplay = document.getElementById('successAmountDisplay');
const successPayeeName = document.getElementById('successPayeeName');
const successBankingName = document.getElementById('successBankingName');
const successTxnTime = document.getElementById('successTxnTime');
const successStatusTime = document.getElementById('successStatusTime');
let successLottieInstance = null;

// Status Bar Time
const statusTime = document.getElementById('statusTime');

// Bank Balance & Transaction History State (Simulated)
let userBankBalance = 24580.50;
let transactionHistory = [
    { name: 'ZEPTO Groceries', vpa: 'zepto@icici', amount: 149, time: 'Today, 1:20 PM', status: 'Completed', type: 'debit' },
    { name: 'Rangesh', vpa: 'rangesh@oksbi', amount: 500, time: 'Yesterday, 8:45 PM', status: 'Completed', type: 'debit' },
    { name: 'Cashback Reward', vpa: 'googlepay.rewards@upi', amount: 20, time: '21 Oct, 11:15 AM', status: 'Received', type: 'credit' },
    { name: 'Vi Prepaid Recharge', vpa: 'vodafoneidea@upi', amount: 299, time: '19 Oct, 3:30 PM', status: 'Completed', type: 'debit' }
];

// Camera & Scanner State
let cameraStream = null;
let animationFrameId = null;
let isTorchOn = false;
let currentTrack = null;
let isScanningActive = false;
let currentUpiData = null;

// ==========================================================================
// 1. Android Status Bar Clock
// ==========================================================================
function updateStatusBarTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    if (statusTime) {
        statusTime.textContent = `${hours}:${minutes}`;
    }
}
setInterval(updateStatusBarTime, 10000);
updateStatusBarTime();

// ==========================================================================
// 2. Web Audio API - Google Pay Sound Effects
// ==========================================================================
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx && AudioContextClass) {
        audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Play QR scan detection beep
function playScanChime() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
    } catch (e) {
        console.warn('Audio chime error:', e);
    }
}

// Play key press click
function playKeyClick() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
}

// Authentic Google Pay celebration audio (E:\gpay\gpay.mp3)
const gpaySuccessAudio = new Audio('gpay.mp3');
gpaySuccessAudio.preload = 'auto';

function unlockAudio() {
    if (gpaySuccessAudio) {
        gpaySuccessAudio.load();
    }
}
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click', unlockAudio, { once: true });

// Play Google Pay celebration audio file (gpay.mp3)
function playSuccessChime() {
    try {
        if (gpaySuccessAudio) {
            gpaySuccessAudio.pause();
            gpaySuccessAudio.currentTime = 0;
            const playPromise = gpaySuccessAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.warn('gpay.mp3 play was prevented, falling back to Web Audio synthesis:', err);
                    playSynthesizedFanfare();
                });
            }
            return;
        }
    } catch (e) {
        console.warn('gpay.mp3 playback error:', e);
    }
    playSynthesizedFanfare();
}

function playSynthesizedFanfare() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.4);
        });
    } catch (e) {}
}

// ==========================================================================
// 3. QR Scanner Controls
// ==========================================================================
btnScanQR.addEventListener('click', openScanner);
if (btnFloatingScanQR) {
    btnFloatingScanQR.addEventListener('click', openScanner);
}
btnCloseScanner.addEventListener('click', closeScanner);

async function openScanner() {
    scannerScreen.classList.add('active');
    scannerScreen.setAttribute('aria-hidden', 'false');
    isScanningActive = true;
    scanTargetLock.classList.remove('active');
    scannerLaser.style.display = 'block';

    await startCamera();
}

function closeScanner() {
    isScanningActive = false;
    scannerScreen.classList.remove('active');
    scannerScreen.setAttribute('aria-hidden', 'true');
    stopCamera();
}

async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        drawKeyboardBackdrop();
        return;
    }

    const cameraOptions = [
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { facingMode: 'user' }, audio: false },
        { video: true, audio: false }
    ];

    let stream = null;
    for (const option of cameraOptions) {
        try {
            stream = await navigator.mediaDevices.getUserMedia(option);
            if (stream) break;
        } catch (e) {
            console.log('Trying next camera device...');
        }
    }

    if (stream) {
        cameraStream = stream;
        scannerVideo.srcObject = cameraStream;
        scannerVideo.style.display = 'block';
        try {
            await scannerVideo.play();
        } catch (playErr) {
            console.log('Video play error:', playErr);
        }

        const tracks = cameraStream.getVideoTracks();
        if (tracks.length > 0) {
            currentTrack = tracks[0];
        }

        requestAnimationFrame(processScannerFrame);
    } else {
        console.warn('Camera access denied or webcam not connected. Showing simulated keyboard backdrop.');
        drawKeyboardBackdrop();
    }
}

function stopCamera() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    currentTrack = null;
    if (isTorchOn) {
        toggleTorch();
    }
}

// Flashlight / Torch Toggle
btnTorch.addEventListener('click', toggleTorch);

async function toggleTorch() {
    isTorchOn = !isTorchOn;
    btnTorch.classList.toggle('active', isTorchOn);

    if (currentTrack && typeof currentTrack.applyConstraints === 'function') {
        try {
            const capabilities = currentTrack.getCapabilities ? currentTrack.getCapabilities() : {};
            if (capabilities.torch) {
                await currentTrack.applyConstraints({
                    advanced: [{ torch: isTorchOn }]
                });
            }
        } catch (e) {}
    }
}

function drawKeyboardBackdrop() {
    scannerCanvas.width = scannerScreen.clientWidth || 400;
    scannerCanvas.height = scannerScreen.clientHeight || 750;
    const w = scannerCanvas.width;
    const h = scannerCanvas.height;

    canvasCtx.fillStyle = '#18191B';
    canvasCtx.fillRect(0, 0, w, h);

    canvasCtx.strokeStyle = '#26282D';
    canvasCtx.lineWidth = 2;
    canvasCtx.fillStyle = '#222327';

    const keySize = 54;
    const gap = 12;
    const startX = 30;
    const startY = 160;

    for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 5; c++) {
            const x = startX + c * (keySize + gap);
            const y = startY + r * (keySize + gap);
            canvasCtx.beginPath();
            canvasCtx.roundRect(x, y, keySize, keySize, 8);
            canvasCtx.fill();
            canvasCtx.stroke();
        }
    }
}

function processScannerFrame() {
    if (!isScanningActive) return;

    if (scannerVideo.readyState === scannerVideo.HAVE_ENOUGH_DATA) {
        scannerCanvas.width = scannerVideo.videoWidth;
        scannerCanvas.height = scannerVideo.videoHeight;
        canvasCtx.drawImage(scannerVideo, 0, 0, scannerCanvas.width, scannerCanvas.height);

        if (typeof jsQR !== 'undefined') {
            const imageData = canvasCtx.getImageData(0, 0, scannerCanvas.width, scannerCanvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
            });

            if (code && code.data) {
                handleScannedQRCode(code.data);
                return;
            }
        }
    }

    animationFrameId = requestAnimationFrame(processScannerFrame);
}

// ==========================================================================
// 4. Handle Scanned QR Code & Extract UPI Information
// ==========================================================================
function handleScannedQRCode(rawData) {
    if (!isScanningActive) return;
    isScanningActive = false;

    // Direct transition without green animation or sound
    scannerLaser.style.display = 'none';
    if (navigator.vibrate) {
        navigator.vibrate(40);
    }

    const upiData = parseUPIData(rawData);
    currentUpiData = upiData;

    setTimeout(() => {
        closeScanner();
        displayPaymentSheet(upiData);
    }, 150);
}

function parseUPIData(rawText) {
    console.log('Parsing QR data:', rawText);
    const result = {
        raw: rawText,
        payeeName: '',
        vpa: '',
        amount: '',
        note: '',
        bankingName: ''
    };

    if (rawText.startsWith('upi://pay') || rawText.includes('pa=')) {
        try {
            const queryString = rawText.includes('?') ? rawText.split('?')[1] : rawText;
            const params = new URLSearchParams(queryString);
            
            result.vpa = params.get('pa') || '';
            result.payeeName = params.get('pn') ? decodeURIComponent(params.get('pn')).replace(/\+/g, ' ') : '';
            result.amount = params.get('am') || '';
            result.note = params.get('tn') ? decodeURIComponent(params.get('tn')).replace(/\+/g, ' ') : '';
            result.bankingName = result.payeeName;
        } catch (e) {}
    } else if (rawText.includes('@')) {
        result.vpa = rawText.trim();
        const username = result.vpa.split('@')[0];
        result.payeeName = formatUsernameToName(username);
        result.bankingName = result.payeeName;
    } else {
        result.payeeName = rawText.length > 28 ? rawText.substring(0, 28) + '...' : rawText;
        result.vpa = 'verified.merchant@upi';
        result.bankingName = result.payeeName;
    }

    if (!result.payeeName && result.vpa) {
        const username = result.vpa.split('@')[0];
        result.payeeName = formatUsernameToName(username);
    }
    if (!result.bankingName) {
        result.bankingName = result.payeeName;
    }

    return result;
}

function formatUsernameToName(str) {
    return str
        .replace(/[._]/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

// "Upload from gallery"
btnUploadGallery.addEventListener('click', () => {
    galleryFileInput.value = '';
    galleryFileInput.click();
});

galleryFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = img.width;
            offscreenCanvas.height = img.height;
            const ctx = offscreenCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            if (typeof jsQR !== 'undefined') {
                const imgData = ctx.getImageData(0, 0, img.width, img.height);
                const decoded = jsQR(imgData.data, img.width, img.height);
                if (decoded && decoded.data) {
                    handleScannedQRCode(decoded.data);
                } else {
                    alert('No QR code detected in this photo. Please upload a clear UPI QR code or click one of the quick test chips!');
                }
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

window.simulateScanUPI = function(name, vpa, amount = '') {
    const upiUri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(name)}${amount ? `&am=${amount}` : ''}&cu=INR&tn=Payment`;
    handleScannedQRCode(upiUri);
};

// ==========================================================================
// 5. Scanned UPI Payment Bottom Sheet
// ==========================================================================
// ==========================================================================
// 5. Scanned UPI Payment Bottom Sheet (Google Pay Dark Mode)
// ==========================================================================
const payeeAvatarColors = ['#5C6BC0', '#D81B60', '#00897B', '#FB8C00', '#1E88E5', '#8E24AA', '#43A047'];

function getPayeeColor(name) {
    if (!name) return '#5C6BC0';
    if (name.toLowerCase().includes('razorpay')) return '#5C6BC0';
    if (name.toLowerCase().includes('daya')) return '#D81B60';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return payeeAvatarColors[Math.abs(hash) % payeeAvatarColors.length];
}

function formatUpiNumber(valStr) {
    if (!valStr) return '';
    const clean = valStr.toString().replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    let intPart = parts[0];
    const decPart = parts.length > 1 ? '.' + parts[1].slice(0, 2) : '';
    if (intPart && !isNaN(intPart)) {
        intPart = Number(intPart).toLocaleString('en-IN');
    }
    return intPart + decPart;
}

function adjustAmountInputWidth() {
    if (!paymentAmountInput) return;
    const val = paymentAmountInput.value || paymentAmountInput.placeholder || '0';
    if (!adjustAmountInputWidth.canvas) {
        adjustAmountInputWidth.canvas = document.createElement('canvas');
    }
    const ctx = adjustAmountInputWidth.canvas.getContext('2d');
    const compStyle = window.getComputedStyle(paymentAmountInput);
    const font = `${compStyle.fontWeight || '400'} ${compStyle.fontSize || '54px'} ${compStyle.fontFamily || "'Google Sans', Roboto, sans-serif"}`;
    ctx.font = font;
    const textWidth = Math.ceil(ctx.measureText(val).width);
    // Add 4px for caret breathing room so digits are never clipped and stay strictly centered
    paymentAmountInput.style.width = Math.max(textWidth + 4, 32) + 'px';
}

function handleAmountInputLive() {
    const original = paymentAmountInput.value;
    const cursorPos = paymentAmountInput.selectionStart || original.length;
    
    // Count digit characters before cursor
    const digitsBefore = original.slice(0, cursorPos).replace(/[^0-9.]/g, '').length;
    
    // Sanitize to only numbers and at most one decimal point
    const raw = original.replace(/[^0-9.]/g, '');
    const firstDot = raw.indexOf('.');
    let clean = raw;
    if (firstDot !== -1) {
        clean = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, '').slice(0, 2);
    }
    
    if (!clean) {
        paymentAmountInput.value = '';
        btnPayText.textContent = 'Pay ₹0';
        adjustAmountInputWidth();
        return;
    }
    
    // Format integer part with Indian commas (e.g. 1,000 / 10,000 / 1,00,000)
    const parts = clean.split('.');
    let intFormatted = parts[0];
    if (intFormatted && !isNaN(intFormatted)) {
        intFormatted = Number(intFormatted).toLocaleString('en-IN');
    }
    const decFormatted = parts.length > 1 ? '.' + parts[1] : (clean.endsWith('.') ? '.' : '');
    const formatted = intFormatted + decFormatted;
    
    paymentAmountInput.value = formatted;
    
    // Dynamically adjust input width so it grows precisely with digits and stays centered
    adjustAmountInputWidth();
    
    // Update Pay button text
    btnPayText.textContent = `Pay ₹${formatted}`;
    
    // Restore cursor position seamlessly
    let newCursorPos = 0;
    let countedDigits = 0;
    for (let i = 0; i < formatted.length; i++) {
        if (/[0-9.]/.test(formatted[i])) {
            countedDigits++;
        }
        if (countedDigits >= digitsBefore) {
            newCursorPos = i + 1;
            break;
        }
    }
    if (countedDigits < digitsBefore) {
        newCursorPos = formatted.length;
    }
    paymentAmountInput.setSelectionRange(newCursorPos, newCursorPos);
}

function updatePaymentButton() {
    const rawVal = paymentAmountInput.value.replace(/,/g, '').trim();
    adjustAmountInputWidth();

    if (rawVal && !isNaN(rawVal) && parseFloat(rawVal) > 0) {
        const formatted = formatUpiNumber(rawVal);
        btnPayText.textContent = `Pay ₹${formatted}`;
    } else {
        btnPayText.textContent = `Pay ₹0`;
    }
}

function displayPaymentSheet(data) {
    payeeNameDisplay.textContent = data.payeeName || 'Merchant';
    payeeVpaDisplay.textContent = data.vpa || 'merchant@upi';
    if (bankingNameText) {
        bankingNameText.textContent = `Banking name: ${data.bankingName || data.payeeName}`;
    }
    
    const initial = (data.payeeName || 'U').trim().charAt(0).toUpperCase();
    payeeAvatar.textContent = initial;
    payeeAvatar.style.backgroundColor = getPayeeColor(data.payeeName);

    if (data.amount && parseFloat(data.amount) > 0) {
        paymentAmountInput.value = formatUpiNumber(data.amount);
        updatePaymentButton();
    } else {
        paymentAmountInput.value = '';
        btnPayText.textContent = `Pay ₹0`;
        adjustAmountInputWidth();
    }

    if (data.note) {
        paymentNoteInput.value = data.note;
    } else {
        paymentNoteInput.value = '';
        paymentNoteInput.placeholder = 'Add note';
    }

    paymentModalBackdrop.classList.add('active');
    setTimeout(() => {
        paymentAmountInput.focus();
        adjustAmountInputWidth();
    }, 300);
}

window.openPaymentFor = function(name, vpa, prefillAmount = '') {
    const data = {
        payeeName: name,
        vpa: vpa,
        bankingName: name,
        amount: prefillAmount,
        note: ''
    };
    currentUpiData = data;
    displayPaymentSheet(data);
};

btnClosePaymentSheet.addEventListener('click', () => {
    paymentModalBackdrop.classList.remove('active');
});

// Live dynamic comma formatting as digits are typed!
paymentAmountInput.addEventListener('input', handleAmountInputLive);

// When "Pay ₹..." is clicked, open the authentic NPCI UPI PIN Screen!
btnConfirmPay.addEventListener('click', () => {
    const cleanVal = paymentAmountInput.value.replace(/,/g, '').trim();
    const amountVal = parseFloat(cleanVal) || 1;
    
    // Close payment sheet and open UPI PIN Screen
    paymentModalBackdrop.classList.remove('active');
    openUpiPinScreen(amountVal);
});

// ==========================================================================
// 6. Authentic NPCI 4-Digit UPI PIN Screen Workflow
// ==========================================================================
function openUpiPinScreen(amount) {
    enteredPin = '';
    updatePinDots();
    
    if (pinPayingTo) {
        pinPayingTo.textContent = currentUpiData ? currentUpiData.payeeName : 'Razorpay';
    }
    if (pinAmountVal) {
        pinAmountVal.textContent = `₹${formatUpiNumber(amount.toFixed(2))}`;
    }
    
    upiPinOverlay.classList.add('active');
}

window.closeUpiPinScreen = function() {
    upiPinOverlay.classList.remove('active');
    paymentModalBackdrop.classList.add('active');
};

function updatePinDots() {
    for (let i = 0; i < 4; i++) {
        const dot = document.getElementById(`pdot-${i}`);
        if (dot) {
            if (i < enteredPin.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        }
    }
}

window.pressPinKey = function(digit) {
    if (enteredPin.length < 4) {
        enteredPin += digit;
        playKeyClick();
        updatePinDots();
        // Payment will proceed when user clicks the blue PAY button
    }
};

window.deletePinKey = function() {
    if (enteredPin.length > 0) {
        enteredPin = enteredPin.slice(0, -1);
        playKeyClick();
        updatePinDots();
    }
};

window.submitPin = function() {
    // 1. Immediately trigger the audio and lottie animation simultaneously on click
    playSuccessChime();
    
    // Proceed with payment simulation
    upiPinOverlay.classList.remove('active');
    
    const amountVal = parseFloat(paymentAmountInput.value.replace(/,/g, '').trim()) || 1;
    
    // Simulated bank balance update (Zero real money is ever debited)
    userBankBalance = Math.max(0, userBankBalance - amountVal);
    const newTxn = {
        name: currentUpiData ? currentUpiData.payeeName : 'Merchant',
        vpa: currentUpiData ? currentUpiData.vpa : 'upi@bank',
        amount: amountVal,
        time: 'Just now',
        status: 'Completed',
        type: 'debit'
    };
    transactionHistory.unshift(newTxn);

    // Show celebration screen
    showSuccessCelebration(amountVal);
};

// ==========================================================================
// 7. Payment Success Screen Celebration (Google Pay Authentic)
// ==========================================================================
function initSuccessLottie() {
    if (!lottieSuccessAnim || typeof lottie === 'undefined') return;
    if (successLottieInstance) return;

    const animData = (typeof window.SUCCESS_LOTTIE_DATA !== 'undefined' ? window.SUCCESS_LOTTIE_DATA : null);

    try {
        successLottieInstance = lottie.loadAnimation({
            container: lottieSuccessAnim,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            animationData: animData,
            path: animData ? undefined : 'success-animation.json'
        });
    } catch (e) {
        console.warn('Lottie load error:', e);
    }
}

function showSuccessCelebration(amount) {
    // 1. Status bar clock update for transaction page
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
    if (successStatusTime) {
        successStatusTime.textContent = `${displayHours}:${displayMinutes}`;
    }

    // 2. Format details to match reference image: 24 October 2026, 2:51 pm
    const fullMonths = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dateStr = `${now.getDate()} ${fullMonths[now.getMonth()]} ${now.getFullYear()}, ${displayHours}:${displayMinutes} ${ampm}`;

    // Clean amount formatting (e.g., ₹1 or ₹150 or ₹1,000)
    const rawNumStr = (amount % 1 === 0) ? amount.toString() : amount.toFixed(2);
    const formattedAmount = formatUpiNumber(rawNumStr);

    const displayName = (currentUpiData && currentUpiData.payeeName && currentUpiData.payeeName !== 'Merchant')
        ? currentUpiData.payeeName.toUpperCase()
        : 'HARIS PAJAN S K';
    const displayBankingName = (currentUpiData && (currentUpiData.bankingName || currentUpiData.payeeName) && currentUpiData.payeeName !== 'Merchant')
        ? (currentUpiData.bankingName || currentUpiData.payeeName).toUpperCase()
        : 'HARIS PAJAN S K';

    if (successAmountDisplay) successAmountDisplay.textContent = `₹${formattedAmount}`;
    if (successPayeeName) successPayeeName.textContent = displayName;
    if (successBankingName) successBankingName.textContent = displayBankingName;
    if (successTxnTime) successTxnTime.textContent = dateStr;

    // 3. Reset visual phases
    const successBottomBar = document.getElementById('successBottomBar');
    if (successReceiptInfo) successReceiptInfo.classList.remove('visible');
    if (successBottomBar) successBottomBar.classList.remove('visible');

    // 4. Activate screen immediately
    successScreen.classList.add('active');

    // 5. Play the Lottie micro-animation simultaneously with the audio
    if (!successLottieInstance) {
        initSuccessLottie();
    }
    if (successLottieInstance) {
        successLottieInstance.goToAndPlay(0, true);
    }

    // 6. Transition smoothly to settled receipt view and bottom buttons
    setTimeout(() => {
        if (successReceiptInfo) successReceiptInfo.classList.add('visible');
        if (successBottomBar) successBottomBar.classList.add('visible');
    }, 950);
}

window.closeSuccessReceipt = function() {
    const successBottomBar = document.getElementById('successBottomBar');
    successScreen.classList.remove('active');
    if (successReceiptInfo) successReceiptInfo.classList.remove('visible');
    if (successBottomBar) successBottomBar.classList.remove('visible');
};

window.openSuccessDetails = function() {
    const amount = successAmountDisplay ? successAmountDisplay.textContent : '₹1';
    const payee = successPayeeName ? successPayeeName.textContent : 'HARIS PAJAN S K';
    
    // Short date for details page: e.g. 24 Oct 2026, 2:24 pm
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const shortDateStr = `${now.getDate()} ${shortMonths[now.getMonth()]} ${now.getFullYear()}, ${displayHours}:${displayMinutes} ${ampm}`;

    const detailsPageScreen = document.getElementById('detailsPageScreen');
    const detailsMainAmount = document.getElementById('detailsMainAmount');
    const detailsPayeeTitle = document.getElementById('detailsPayeeTitle');
    const detailsDateTimeDisplay = document.getElementById('detailsDateTimeDisplay');
    const detailsAvatarLetter = document.getElementById('detailsAvatarLetter');
    const detailsToLabel = document.getElementById('detailsToLabel');
    const detailsFromLabel = document.getElementById('detailsFromLabel');
    
    if (detailsMainAmount) detailsMainAmount.textContent = amount;
    // e.g. "To HARIS PAJAN"
    const cleanedShortName = payee.replace(/\s+S\s*K$/i, '').trim();
    if (detailsPayeeTitle) detailsPayeeTitle.textContent = `To ${cleanedShortName || payee}`;
    if (detailsDateTimeDisplay) detailsDateTimeDisplay.textContent = shortDateStr;
    if (detailsAvatarLetter) detailsAvatarLetter.textContent = (payee.trim()[0] || 'H').toUpperCase();
    if (detailsToLabel) detailsToLabel.textContent = `To: ${payee}`;
    if (detailsFromLabel) detailsFromLabel.textContent = `From: ${payee} (Union Bank of India)`;

    if (detailsPageScreen) {
        detailsPageScreen.classList.add('active');
        const scrollArea = detailsPageScreen.querySelector('.details-scroll-content');
        if (scrollArea) scrollArea.scrollTop = 0;
    }
};

window.closeSuccessDetails = function() {
    const detailsPageScreen = document.getElementById('detailsPageScreen');
    if (detailsPageScreen) {
        detailsPageScreen.classList.remove('active');
    }
};

window.payAgainFromDetails = function() {
    closeSuccessDetails();
    closeSuccessReceipt();
    const cleanVal = paymentAmountInput ? paymentAmountInput.value.replace(/,/g, '').trim() : '1';
    openUpiPinScreen(parseFloat(cleanVal) || 1);
};

window.shareSuccessReceipt = function() {
    if (navigator.share) {
        navigator.share({
            title: 'Google Pay Receipt',
            text: `Payment of ${successAmountDisplay ? successAmountDisplay.textContent : 'amount'} was successful.`,
            url: window.location.href
        }).catch(() => {});
    } else {
        alert('Payment screenshot ready to share!');
    }
};

window.addEventListener('DOMContentLoaded', () => {
    initSuccessLottie();
});
setTimeout(initSuccessLottie, 400);

// ==========================================================================
// 8. Transaction History & Bank Balance Modals
// ==========================================================================
window.openTransactionHistory = function() {
    const container = document.getElementById('historyListContainer');
    container.innerHTML = '';

    transactionHistory.forEach(txn => {
        const item = document.createElement('div');
        item.className = 'history-item';
        const initial = (txn.name || 'M').charAt(0).toUpperCase();
        item.innerHTML = `
            <div class="history-avatar">${initial}</div>
            <div class="history-info">
                <div class="history-name">${txn.name}</div>
                <div class="history-time">${txn.time} • ${txn.vpa}</div>
            </div>
            <div class="history-amount" style="color: ${txn.type === 'credit' ? '#81C995' : '#FFFFFF'}">
                ${txn.type === 'credit' ? '+' : '-'}₹${txn.amount}
            </div>
        `;
        container.appendChild(item);
    });

    document.getElementById('historyModal').classList.add('active');
};

window.openBankBalance = function() {
    const balanceElem = document.getElementById('bankBalanceDisplay');
    balanceElem.textContent = `₹${userBankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('balanceModal').classList.add('active');
};

window.closeModal = function(id) {
    document.getElementById(id).classList.remove('active');
};

window.openPromo = function(feature) {
    alert(`${feature} - Accessible in Google Pay demo simulator.`);
};

window.openContactSelector = function() {
    openPaymentFor('Rangesh', 'rangesh@oksbi', '200');
};

window.openBankTransferModal = function() {
    openPaymentFor('Bank Account Transfer', 'sbi.account@upi', '1000');
};

window.openRechargeModal = function(type) {
    openPaymentFor(`${type} Recharge`, 'recharge@upi', '299');
};

window.toggleMoreContacts = function() {
    openPaymentFor('Vignesh Muthaiyan', 'vignesh@okhdfcbank');
};

// ==========================================================================
// 9. My QR Code Modal
// ==========================================================================
btnMyQR.addEventListener('click', () => {
    myQrModal.classList.add('active');
    if (myQrContainer && myQrContainer.children.length === 0 && typeof QRCode !== 'undefined') {
        new QRCode(myQrContainer, {
            text: 'upi://pay?pa=user@okhdfcbank&pn=User%20Account&cu=INR',
            width: 180,
            height: 180,
            colorDark: '#1F1F1F',
            colorLight: '#FFFFFF',
            correctLevel: QRCode.CorrectLevel.H
        });
    }
});

btnCloseMyQr.addEventListener('click', () => {
    myQrModal.classList.remove('active');
});

// ==========================================================================
// 10. Bottom Navigation Tabs Interaction
// ==========================================================================
const navButtons = document.querySelectorAll('.nav-btn');
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});
