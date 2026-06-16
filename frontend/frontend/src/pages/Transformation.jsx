import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import FileUploader from '../components/FileUploader';
import RichTextEditor from '../components/RichTextEditor';
import {
  Upload, Mic, MicOff, Camera, CameraOff, PenTool, Download,
  Share2, FileText, Wand2, RefreshCw, Type, Zap, ArrowRightLeft,
  Eye, Palette, LayoutGrid, AlignLeft, AlignCenter, AlignRight, AlignJustify, Sparkles, RotateCcw,
  ChevronDown, ChevronUp, Sliders, Image, Check, X, Copy, Filter
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* 20 Google Handwriting fonts loaded in index.html */
const handwritingFonts = [
  'Caveat', 'Indie Flower', 'Dancing Script', 'Patrick Hand',
  'Shadows Into Light', 'Kalam', 'Architects Daughter', 'Coming Soon',
  'Gochi Hand', 'Handlee', 'Just Another Hand', 'Loved by the King',
  'Nothing You Could Do', 'Reenie Beanie', 'Rock Salt', 'Sacramento',
  'Satisfy', 'Homemade Apple', 'La Belle Aurore', 'Cedarville Cursive',
];

/* ── Background Pre-sets ──────────────────────────────────────── */
const paperPresets = [
  { id: 'plain-white', label: 'Plain White', bg: '#ffffff', lines: false, lineColor: '', marginColor: '' },
  { id: 'plain-cream', label: 'Plain Cream', bg: '#fffef5', lines: false, lineColor: '', marginColor: '' },
  { id: 'plain-yellow', label: 'Plain Yellow', bg: '#fef9c3', lines: false, lineColor: '', marginColor: '' },
  { id: 'plain-pink', label: 'Plain Pink', bg: '#fce7f3', lines: false, lineColor: '', marginColor: '' },
  { id: 'plain-blue', label: 'Plain Blue', bg: '#dbeafe', lines: false, lineColor: '', marginColor: '' },
  { id: 'plain-green', label: 'Plain Green', bg: '#dcfce7', lines: false, lineColor: '', marginColor: '' },
  { id: 'plain-dark', label: 'Dark Paper', bg: '#1a1a2e', lines: false, lineColor: '', marginColor: '' },
  { id: 'lined-white', label: 'Lined White', bg: '#ffffff', lines: true, lineColor: 'rgba(0,100,200,0.12)', marginColor: 'rgba(255,100,100,0.3)' },
  { id: 'lined-cream', label: 'Lined Cream', bg: '#fffef5', lines: true, lineColor: 'rgba(0,80,160,0.1)', marginColor: 'rgba(220,80,80,0.25)' },
  { id: 'lined-yellow', label: 'Yellow Ruled', bg: '#fef9c3', lines: true, lineColor: 'rgba(180,150,0,0.15)', marginColor: 'rgba(255,100,100,0.3)' },
  { id: 'lined-blue', label: 'Blue Ruled', bg: '#eef6ff', lines: true, lineColor: 'rgba(0,100,200,0.18)', marginColor: 'rgba(255,50,50,0.25)' },
  { id: 'grid-white', label: 'Grid White', bg: '#ffffff', lines: 'grid', lineColor: 'rgba(0,100,200,0.08)', marginColor: '' },
  { id: 'grid-cream', label: 'Grid Cream', bg: '#fffef5', lines: 'grid', lineColor: 'rgba(0,80,160,0.08)', marginColor: '' },
  { id: 'dot-white', label: 'Dot Grid', bg: '#ffffff', lines: 'dot', lineColor: 'rgba(0,0,0,0.15)', marginColor: '' },
];

/* ── Pen Presets ────────────────────────────────────────── */
const penPresets = [
  { id: 'ballpoint-blue', label: '🔵 Ballpoint (Blue)', color: '#002fbe', stroke: 0.9, pressure: 0.12, letterGap: 0 },
  { id: 'ballpoint-black', label: '⚫ Ballpoint (Black)', color: '#1a1a1a', stroke: 0.9, pressure: 0.12, letterGap: 0 },
  { id: 'gel-blue', label: '🌀 Gel Pen (Blue)', color: '#004aa6', stroke: 1.25, pressure: 0.04, letterGap: -0.5 },
  { id: 'gel-black', label: '🖋️ Gel Pen (Black)', color: '#090a0c', stroke: 1.3, pressure: 0.04, letterGap: -0.5 },
  { id: 'gel-red', label: '🔴 Gel Pen (Red)', color: '#c00000', stroke: 1.2, pressure: 0.05, letterGap: -0.5 },
  { id: 'gel-green', label: '🟢 Gel Pen (Green)', color: '#0c603a', stroke: 1.2, pressure: 0.05, letterGap: -0.5 },
  { id: 'gel-orange', label: '🟠 Gel Pen (Orange)', color: '#d95d00', stroke: 1.2, pressure: 0.05, letterGap: -0.5 },
  { id: 'fountain-blue', label: '✒️ Fountain Pen (Blue)', color: '#103070', stroke: 1.6, pressure: 0.20, letterGap: 0.5 },
];

/* ── Color Contrast Helper ──────────────────────────────── */
const getLuminance = (colorStr) => {
  if (!colorStr) return 0;
  let r = 0, g = 0, b = 0;
  const cleaned = colorStr.trim().toLowerCase();
  
  if (cleaned.startsWith('#')) {
    let hex = cleaned.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(x => x + x).join('');
    }
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else if (cleaned.startsWith('rgb')) {
    const parts = cleaned.match(/\d+/g);
    if (parts) {
      r = parseInt(parts[0]);
      g = parseInt(parts[1]);
      b = parseInt(parts[2]);
    }
  } else {
    return 0.5; // neutral fallback
  }
  
  r /= 255; g /= 255; b /= 255;
  const rc = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gc = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bc = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  return 0.2126 * rc + 0.7152 * gc + 0.0722 * bc;
};

const bgColorOptions = [
  '#ffffff', '#fffef5', '#fef9c3', '#fce7f3', '#dbeafe',
  '#dcfce7', '#f5f3ff', '#fef2f2', '#ecfdf5', '#1a1a2e',
  '#16213e', '#0f0f23', '#ffe4c9', '#e0f7fa',
];

export default function Transformation() {
  const { api, addToast, user } = useAuth();
  const location = useLocation();

  /* ── Transformation Mode ──────────────────────────────────── */
  const [transformMode, setTransformMode] = useState('ai_to_handwriting');

  /* ── Input ───────────────────────────────────────────────── */
  const [tab, setTab] = useState('upload');
  const [file, setFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [transformed, setTransformed] = useState(false);
  const [transformedText, setTransformedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState(null);

  /* ── Style Controls ──────────────────────────────────────── */
  const [selectedFont, setSelectedFont] = useState('Caveat');
  const [fontSize, setFontSize] = useState(22);
  const [fontColor, setFontColor] = useState('#1a1a2e');
  const [activePen, setActivePen] = useState('gel-blue');
  const selectedPenObj = useMemo(() => penPresets.find(pen => pen.id === activePen) || penPresets[2], [activePen]);
  const [lineHeight, setLineHeight] = useState(2.0);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [wordSpacing, setWordSpacing] = useState(0);
  const [textTilt, setTextTilt] = useState(0);
  const [textAlignment, setTextAlignment] = useState('left'); // 'left' | 'center' | 'right' | 'justify'
  const [showAdvanced, setShowAdvanced] = useState(false);

  /* ── Humanization Engine ────────────────────────────────── */
  const [humanizeEnabled, setHumanizeEnabled] = useState(true);
  const [variationIntensity, setVariationIntensity] = useState(65);

  /* ── Custom Handwriting Style Engine ────────────────────── */
  const [savedStyles, setSavedStyles] = useState([]);
  const [activeStyle, setActiveStyle] = useState(null);  // {id, name, font_match, ink_color, params, ...}
  const [styleFile, setStyleFile] = useState(null);
  const [analyzingStyle, setAnalyzingStyle] = useState(false);
  const [styleName, setStyleName] = useState('');

  /* ── Load saved styles on mount ─────────────────────────── */
  useEffect(() => {
    fetchSavedStyles();
  }, []);

  const fetchSavedStyles = async () => {
    try {
      const res = await api.get('/styles');
      setSavedStyles(res.data.styles || []);
      // Auto-select most recent style if none active
      if (!activeStyle && res.data.styles?.length > 0) {
        applyCustomStyle(res.data.styles[0]);
      }
    } catch (err) {
      console.log('Failed to load styles:', err);
    }
  };

  const uploadNewStyle = async () => {
    if (!styleFile) {
      addToast('Please select a handwriting sample image', 'warning');
      return;
    }
    setAnalyzingStyle(true);
    try {
      const formData = new FormData();
      formData.append('file', styleFile);
      if (styleName.trim()) formData.append('name', styleName.trim());
      const res = await api.post('/styles/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast(`Style "${res.data.style.name}" analyzed & saved! ✨`, 'success');
      setStyleFile(null);
      setStyleName('');
      await fetchSavedStyles();
      applyCustomStyle(res.data.style);
    } catch (err) {
      addToast('Failed to analyze handwriting: ' + (err.response?.data?.error || 'Unknown error'), 'error');
    } finally {
      setAnalyzingStyle(false);
    }
  };

  const deleteCustomStyle = async (styleId) => {
    if (!window.confirm('Delete this handwriting style?')) return;
    try {
      await api.delete(`/styles/${styleId}`);
      addToast('Style deleted', 'success');
      if (activeStyle?.id === styleId) setActiveStyle(null);
      fetchSavedStyles();
    } catch {
      addToast('Failed to delete style', 'error');
    }
  };

  const applyCustomStyle = (style) => {
    setActiveStyle(style);
    setSelectedFont(style.font_match);
    setHumanizeEnabled(true);

    // Apply detected ink color with contrast check
    let ink = style.ink_color || '#1a1a2e';
    try {
      const bgLum = getLuminance(bgColor);
      const inkLum = getLuminance(ink);
      const lighter = Math.max(bgLum, inkLum);
      const darker = Math.min(bgLum, inkLum);
      if ((lighter + 0.05) / (darker + 0.05) < 2.5) {
        ink = bgLum > 0.5 ? '#1a1a2e' : '#e8e8e8';
      }
    } catch { /* ignore */ }
    setFontColor(ink);

    // Apply analyzed parameters
    const p = style.params || {};
    if (p.fontSize) setFontSize(p.fontSize);
    if (p.lineHeight) setLineHeight(p.lineHeight);
    if (p.slant) setTextTilt(p.slant > 3 ? 2 : p.slant < -1 ? -1 : 0);

    const avgIntensity = Math.min(100, Math.round(
      ((p.rotation || 1.5) / 3.5 + (p.baselineShift || 0.8) / 2.0 +
       (p.sizeVariation || 0.04) / 0.10 + (p.pressure || 0.06) / 0.20) * 25
    ));
    setVariationIntensity(avgIntensity);
    addToast(`Applied "${style.name}" — matched to ${style.font_match} ✍️`, 'success');
  };

  /* ── Auto-load file from Dashboard ──────────────────────── */
  useEffect(() => {
    const fileId = location.state?.fileId;
    if (fileId) {
      (async () => {
        try {
          setLoading(true);
          const res = await api.get(`/files/${fileId}`);
          const f = res.data.file;
          setUploadedFileId(f.id);
          setTextContent(f.content_text || '');
          setEditorContent(f.content_text || '');
          if (f.transformed_text) {
            setTransformedText(f.transformed_text);
            setTransformed(true);
          }
          setTab('text');
          addToast(`Loaded file: ${f.original_name}`, 'success');
        } catch {
          addToast('Failed to load file', 'error');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, []);

  /* ── Background Options ──────────────────────────────────── */
  const [paperPreset, setPaperPreset] = useState('lined-cream');
  const [bgColor, setBgColor] = useState('#fffef5');
  const [showLines, setShowLines] = useState(true);
  const [lineType, setLineType] = useState('ruled'); // ruled | grid | dot | none
  const [lineColor, setLineColor] = useState('rgba(0,80,160,0.1)');
  const [marginColor, setMarginColor] = useState('rgba(220,80,80,0.25)');
  const [showMargin, setShowMargin] = useState(true);
  const [bgTab, setBgTab] = useState('presets'); // presets | color | custom

  /* ── Speech ─────────────────────────────────────────────── */
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);
  const baseTextRef = useRef('');

  /* ── Camera ─────────────────────────────────────────────── */
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  /* ── Preview ────────────────────────────────────────────── */
  const previewRef = useRef(null);
  const [fontPreview, setFontPreview] = useState(null);

  /* ── Paper preset selection ─────────────────────────────── */
  const selectPaperPreset = (preset) => {
    setPaperPreset(preset.id);
    setBgColor(preset.bg);
    if (preset.lines === 'grid') {
      setShowLines(true);
      setLineType('grid');
    } else if (preset.lines === 'dot') {
      setShowLines(true);
      setLineType('dot');
    } else if (preset.lines) {
      setShowLines(true);
      setLineType('ruled');
    } else {
      setShowLines(false);
      setLineType('none');
    }
    if (preset.lineColor) setLineColor(preset.lineColor);
    if (preset.marginColor) {
      setMarginColor(preset.marginColor);
      setShowMargin(true);
    } else {
      setShowMargin(false);
    }
    // Auto-select a good ink color for dark backgrounds
    if (preset.bg === '#1a1a2e' || preset.bg === '#16213e' || preset.bg === '#0f0f23') {
      setFontColor('#e0e0e0');
    } else {
      setFontColor('#1a1a2e');
    }
  };

  /* ── File Upload ──────────────────────────────────────────── */
  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const isPdf = ext === 'pdf';
    const isImage = ['jpg','jpeg','png','bmp','tiff','gif','webp'].includes(ext);

    try {
      setLoading(true);
      if (isPdf || isImage) {
        addToast(
          isPdf
            ? '📄 Uploading PDF — handwriting OCR may take a moment…'
            : '🖼️ Uploading image — running OCR extraction…',
          'info'
        );
      }
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 min timeout for OCR processing
      });
      setUploadedFileId(res.data.file.id);
      const extracted = res.data.file.content_text || '';
      setTextContent(extracted);
      setEditorContent(extracted);

      // Check if OCR returned an error/status message
      const isOcrError = extracted.startsWith('[') && extracted.endsWith(']');

      if (isOcrError) {
        addToast(extracted.slice(1, -1), 'warning');
      } else if (extracted && extracted.length > 10) {
        addToast(`File uploaded & text extracted! ✨ (${extracted.length} characters)`, 'success');
      } else if (extracted) {
        addToast('File uploaded. Only a small amount of text was extracted — the handwriting may be unclear.', 'warning');
      } else {
        addToast('File uploaded but no text could be extracted. Ensure the handwriting is clear with dark ink on light paper.', 'warning');
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        addToast('Upload timed out — the file may be too large or OCR is taking too long. Try a smaller file.', 'error');
      } else {
        addToast(err.response?.data?.error || 'Upload failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Text Paste ───────────────────────────────────────────── */
  const handleTextSubmit = async () => {
    if (!textContent.trim()) {
      addToast('Please enter some text', 'warning');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/files/upload-text', {
        text: textContent,
        name: 'Pasted Text'
      });
      setUploadedFileId(res.data.file.id);
      setEditorContent(textContent);
      addToast('Text saved! ✅', 'success');
    } catch (err) {
      addToast('Failed to save text', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Speech Recognition ──────────────────────────────────── */
  const getErrorMessage = (error) => {
    switch (error) {
      case 'not-allowed':
        return '🚫 Microphone access denied. Please click the lock icon in your browser\'s address bar and allow microphone access, then try again.';
      case 'no-speech':
        return '🔇 No speech detected. Please speak louder or move closer to your microphone.';
      case 'network':
        return '🌐 Network error. Speech recognition requires an internet connection. Please check your connection and try again.';
      case 'audio-capture':
        return '🎤 No microphone found. Please connect a microphone and try again.';
      case 'aborted':
        return 'Recording stopped.';
      case 'service-not-allowed':
        return '⚠️ Speech service not available. This may require HTTPS. Try using Chrome or Edge browser.';
      default:
        return `Speech recognition error: ${error}. Please try again.`;
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setVoiceStatus('Stopped');
      setInterimText('');
      setTimeout(() => setVoiceStatus(''), 2000);
      return;
    }

    // Check HTTPS (speech recognition requires secure context except localhost)
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isSecure) {
      addToast('⚠️ Speech recognition requires HTTPS or localhost. Your current connection is not secure.', 'warning');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.', 'warning');
      return;
    }

    // Request microphone permission first
    try {
      setVoiceStatus('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Permission granted — stop the stream immediately (SpeechRecognition manages its own audio)
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? '🚫 Microphone access denied. Please allow microphone access in your browser settings and try again.'
        : err.name === 'NotFoundError'
          ? '🎤 No microphone found. Please connect a microphone and try again.'
          : `Microphone error: ${err.message}`;
      addToast(msg, 'error');
      setVoiceStatus('');
      return;
    }

    // Save current text as base so we append to it
    baseTextRef.current = textContent;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      setVoiceStatus('🎤 Listening... Speak now');
      addToast('Listening… Speak now 🎤', 'info');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          currentInterim += transcript;
        }
      }

      if (finalTranscript) {
        // Append finalized speech to the base text
        const separator = baseTextRef.current && !baseTextRef.current.endsWith(' ') && !baseTextRef.current.endsWith('\n') ? ' ' : '';
        const newText = baseTextRef.current + separator + finalTranscript;
        baseTextRef.current = newText;
        setTextContent(newText);
        setEditorContent(newText);
        setInterimText('');
        setVoiceStatus('✅ Recognized: ' + finalTranscript.substring(0, 50) + (finalTranscript.length > 50 ? '...' : ''));
      }

      if (currentInterim) {
        setInterimText(currentInterim);
        setVoiceStatus('👂 Hearing: ' + currentInterim.substring(0, 50) + (currentInterim.length > 50 ? '...' : ''));
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      const msg = getErrorMessage(event.error);
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        addToast(msg, 'error');
      }
      setVoiceStatus(msg);
      setIsRecording(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText('');
      if (!voiceStatus.startsWith('🚫') && !voiceStatus.startsWith('⚠️')) {
        setVoiceStatus('');
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      addToast('Failed to start speech recognition: ' + err.message, 'error');
      setVoiceStatus('');
    }
  };

  /* ── Camera ───────────────────────────────────────────────── */
  const toggleCamera = async () => {
    if (cameraActive) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      setCameraActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
      addToast('Camera active — capture text with the button below.', 'info');
    } catch {
      addToast('Camera permission denied', 'error');
    }
  };

  const captureCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    addToast('Image captured! Text extraction is simulated in this demo.', 'info');
    setTextContent(prev => prev + '\n[Camera captured text would appear here via OCR]');
  };

  /* ── Transform ────────────────────────────────────────────── */
  const handleTransform = async () => {
    const content = editorContent || textContent;
    if (!content.trim()) {
      addToast('Please add some text first', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (transformMode === 'ai_to_handwriting' || transformMode === 'handwriting_to_handwriting') {
        // Style it as handwriting visually — the text stays the same
        // but optionally we can humanize it too
        let resultText = content;
        if (uploadedFileId) {
          const res = await api.post(`/files/${uploadedFileId}/transform`, {
            transform_type: 'humanized',
            text_content: content,
          });
          resultText = res.data.transformed_text || content;
        } else {
          try {
            const res = await api.post('/files/transform-text', {
              text: content,
              transform_type: 'humanized',
            });
            resultText = res.data.transformed_text || content;
          } catch {
            resultText = content;
          }
        }
        setTransformedText(resultText);
        setTransformed(true);
        addToast('Transformed to handwriting! ✍️', 'success');
      } else {
        // handwriting_to_ai — formalize
        let resultText = content;
        if (uploadedFileId) {
          const res = await api.post(`/files/${uploadedFileId}/transform`, {
            transform_type: 'ai_generated',
            text_content: content,
          });
          resultText = res.data.transformed_text || content;
        } else {
          try {
            const res = await api.post('/files/transform-text', {
              text: content,
              transform_type: 'ai_generated',
            });
            resultText = res.data.transformed_text || content;
          } catch {
            resultText = content;
          }
        }
        setTransformedText(resultText);
        setTransformed(true);
        addToast('Transformed to AI text! 🤖', 'success');
      }
    } catch (err) {
      addToast('Transform failed: ' + (err.response?.data?.error || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Download Original ─────────────────────────────────────── */
  const downloadOriginal = async () => {
    if (!uploadedFileId) {
      addToast('No file uploaded to download', 'warning');
      return;
    }
    try {
      const res = await api.get(`/files/${uploadedFileId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = file?.name || 'download';
      link.click();
      window.URL.revokeObjectURL(url);
      addToast('File downloaded! 📥', 'success');
    } catch {
      addToast('Download failed', 'error');
    }
  };

  /* ── Download Output ─────────────────────────────────────── */
  const downloadPDF = async () => {
    if (!previewRef.current) return;
    try {
      addToast('Generating PDF…', 'info');
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: bgColor,
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;

      // Handle multi-page
      let remainingHeight = pdfH;
      let yOffset = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      while (remainingHeight > 0) {
        pdf.addImage(imgData, 'PNG', 0, yOffset, pdfW, pdfH);
        remainingHeight -= pageHeight;
        if (remainingHeight > 0) {
          pdf.addPage();
          yOffset -= pageHeight;
        }
      }

      pdf.save('handwriting-output.pdf');
      addToast('PDF downloaded! 📄', 'success');
    } catch {
      addToast('Failed to generate PDF', 'error');
    }
  };

  const downloadPNG = async () => {
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: bgColor,
        scale: 2,
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = 'handwriting-output.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      addToast('Image downloaded! 🖼️', 'success');
    } catch {
      addToast('Failed to generate image', 'error');
    }
  };

  const getPlainText = (html) => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const copyTransformed = () => {
    const text = getPlainText(transformedText || editorContent || textContent);
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard! 📋', 'success');
  };

  const renderHTMLToHandwriting = (htmlString) => {
    if (!htmlString) return ' ';

    // Parse the HTML string
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    
    // Seeded Random helper
    const getSeededRandom = (seedString) => {
      let hash = 0;
      for (let i = 0; i < seedString.length; i++) {
        hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
      }
      let currentSeed = hash;
      return () => {
        const x = Math.sin(currentSeed++) * 10000;
        return x - Math.floor(x);
      };
    };

    const cursiveFontList = [
      'Caveat', 'Dancing Script', 'Sacramento', 'Satisfy', 
      'Cedarville Cursive', 'Homemade Apple', 'La Belle Aurore', 
      'Loved by the King', 'Reenie Beanie', 'Nothing You Could Do'
    ];
    const targetFont = selectedFont;
    const isCursiveFont = cursiveFontList.includes(targetFont);
    
    const p = activeStyle?.params || null;
    const intensity = variationIntensity / 100;

    // Check if the style overrides pen preset details
    const selectedPenObj = penPresets.find(pen => pen.id === activePen);
    const strokeW = p?.strokeWeight || selectedPenObj?.stroke || 1.0;
    const sizeVarParam = p?.sizeVariation ?? 0.04;
    const baselineShiftParam = p?.baselineShift ?? (selectedPenObj?.pressure ? selectedPenObj.pressure * 8.0 : 0.8);
    const rotationParam = p?.rotation ?? 1.5;
    const xDriftParam = p?.xDrift ?? 0.3;
    const pressureParam = p?.pressure ?? selectedPenObj?.pressure ?? 0.06;
    const rhythmParam = p?.rhythm ?? 0.10;
    const letterGapParam = p?.letterGap ?? selectedPenObj?.letterGap ?? 0;

    const isCursive = p ? (p.connectedness > 0.55 || isCursiveFont) : isCursiveFont;

    let textShadow = 'none';
    if (strokeW > 1) {
      const sw = (strokeW - 1) * 0.18 * intensity;
      textShadow = `${sw * 0.4}px ${sw * 0.3}px 0.05px currentColor`;
    } else {
      textShadow = `0 0 0.1px currentColor`;
    }

    const renderTextNode = (text, key, parentStyles) => {
      if (!text) return null;
      
      // If humanization is disabled, return normal styled span
      if (!humanizeEnabled) {
        return (
          <span key={key} style={{
            fontWeight: parentStyles.bold ? 'bold' : 'normal',
            fontStyle: parentStyles.italic ? 'italic' : 'normal',
            textDecoration: parentStyles.underline ? 'underline' : 'none',
            color: parentStyles.color || fontColor,
            fontSize: parentStyles.fontSize || `${fontSize}px`,
          }}>
            {text}
          </span>
        );
      }

      // Split into words and spacing
      const words = text.split(/(\s+)/);
      const elements = [];

      for (let wi = 0; wi < words.length; wi++) {
        const word = words[wi];
        if (!word) continue;

        if (/^\s+$/.test(word)) {
          const spaceRng = getSeededRandom(`space-${key}-${wi}`);
          const spaceVariation = spaceRng() * 4 - 2; // -2px to +2px
          const extraSpace = rhythmParam * 3 * spaceVariation * intensity;
          elements.push(
            <span key={`space-${wi}`} style={{
              display: 'inline',
              whiteSpace: 'pre-wrap',
              wordSpacing: `${extraSpace}px`,
            }}>{word}</span>
          );
          continue;
        }

        const wordRng = getSeededRandom(`word-${key}-${wi}-${word}`);
        const wordYShift = (wordRng() - 0.5) * (baselineShiftParam * 0.8 * intensity);
        const wordRotation = (wordRng() - 0.5) * (rotationParam * 0.3 * intensity);
        const wordOpacity = 1 - wordRng() * (pressureParam * 0.15 * intensity);
        const extraWordSpacing = (wordRng() - 0.5) * (xDriftParam * 1.5 * intensity);
        const wordScaleX = 1 + (wordRng() - 0.5) * (sizeVarParam * 0.8 * intensity);
        const wordScaleY = 1 + (wordRng() - 0.5) * (sizeVarParam * 0.8 * intensity);
        const wordSkewX = (wordRng() - 0.5) * (rotationParam * 0.5 * intensity);

        const inlineWordStyles = {
          display: 'inline-block',
          transform: `translateY(${wordYShift}px) rotate(${wordRotation}deg) scale(${wordScaleX}, ${wordScaleY}) skewX(${wordSkewX}deg)`,
          transformOrigin: 'center bottom',
          opacity: wordOpacity,
          textShadow,
          marginRight: `${extraWordSpacing}px`,
          fontWeight: parentStyles.bold ? 'bold' : 'normal',
          fontStyle: parentStyles.italic ? 'italic' : 'normal',
          textDecoration: parentStyles.underline ? 'underline' : 'none',
          color: parentStyles.color || fontColor,
          fontSize: parentStyles.fontSize || `${fontSize}px`,
        };

        if (isCursive) {
          elements.push(
            <span key={`w-${wi}`} style={inlineWordStyles}>
              {word}
            </span>
          );
        } else {
          const charElements = word.split('').map((char, ci) => {
            const charRng = getSeededRandom(`char-${key}-${wi}-${ci}-${char}`);
            const charYShift = (charRng() - 0.5) * (baselineShiftParam * 0.7 * intensity);
            const charRotation = (charRng() - 0.5) * (rotationParam * 0.8 * intensity);
            const charScaleX = 1 + (charRng() - 0.5) * (sizeVarParam * 1.6 * intensity);
            const charScaleY = 1 + (charRng() - 0.5) * (sizeVarParam * 1.6 * intensity);
            const charSkewX = (charRng() - 0.5) * (rotationParam * 0.8 * intensity);
            const charOpacity = 1 - charRng() * (pressureParam * 0.12 * intensity);
            const charSpacing = letterGapParam + (charRng() - 0.5) * (xDriftParam * 1.8 * intensity);

            return (
              <span key={ci} style={{
                display: 'inline-block',
                transform: `translateY(${charYShift}px) rotate(${charRotation}deg) scale(${charScaleX}, ${charScaleY}) skewX(${charSkewX}deg)`,
                transformOrigin: 'center bottom',
                opacity: charOpacity,
                marginRight: `${charSpacing}px`,
              }}>
                {char}
              </span>
            );
          });

          elements.push(
            <span key={`w-${wi}`} style={{
              ...inlineWordStyles,
              transform: `translateY(${wordYShift}px) rotate(${wordRotation}deg)`,
            }}>
              {charElements}
            </span>
          );
        }
      }

      return <span key={key}>{elements}</span>;
    };

    const walk = (node, key, parentStyles = {}) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return renderTextNode(node.textContent, key, parentStyles);
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        
        // Extract inline styles of this element and adjust contrast
        let customColor = node.style.color || parentStyles.color || fontColor;
        const bgLum = getLuminance(bgColor);
        const textLum = getLuminance(customColor);
        const lighter = Math.max(bgLum, textLum);
        const darker = Math.min(bgLum, textLum);
        if ((lighter + 0.05) / (darker + 0.05) < 3.0) {
          customColor = fontColor;
        }
        let customFontSize = parentStyles.fontSize || `${fontSize}px`;
        if (node.style.fontSize) {
          customFontSize = node.style.fontSize;
        }

        const childStyles = {
          ...parentStyles,
          bold: parentStyles.bold || tagName === 'strong' || tagName === 'b' || node.style.fontWeight === 'bold',
          italic: parentStyles.italic || tagName === 'em' || tagName === 'i' || node.style.fontStyle === 'italic',
          underline: parentStyles.underline || tagName === 'u' || node.style.textDecoration?.includes('underline'),
          color: customColor,
          fontSize: customFontSize,
        };

        const children = Array.from(node.childNodes).map((child, idx) => 
          walk(child, `${key}-${idx}`, childStyles)
        );

        if (tagName === 'p' || tagName.startsWith('h') || tagName === 'blockquote' || tagName === 'li') {
          const align = node.style.textAlign || node.getAttribute('align') || parentStyles.textAlign || textAlignment;
          const indent = node.style.paddingLeft || node.style.marginLeft || '0px';

          // Apply natural baseline wobble to block elements as well
          const blockRng = getSeededRandom(`block-${key}`);
          const blockDrift = (blockRng() - 0.5) * (baselineShiftParam * 0.9 * intensity);
          const blockRot = (blockRng() - 0.5) * (rotationParam * 0.15 * intensity);
          const blockMargin = (blockRng() - 0.5) * (xDriftParam * 4.0 * intensity);

          let blockStyles = {
            display: 'block',
            textAlign: align,
            textAlignLast: align === 'justify' ? 'justify' : 'auto',
            transform: `translateY(${blockDrift}px) rotate(${blockRot}deg)`,
            transformOrigin: 'left center',
            marginLeft: `calc(${indent} + ${blockMargin}px)`,
            minHeight: `${parseInt(customFontSize) * lineHeight}px`,
            marginBottom: tagName.startsWith('h') ? '12px' : '8px',
            marginTop: tagName.startsWith('h') ? '16px' : '0px',
            lineHeight: lineHeight,
          };

          if (tagName === 'blockquote') {
            blockStyles = {
              ...blockStyles,
              borderLeft: '3px solid rgba(255, 215, 0, 0.4)',
              paddingLeft: '16px',
              fontStyle: 'italic',
              background: 'rgba(255,255,255,0.01)',
              margin: '12px 0 12px 8px',
            };
          }

          if (tagName === 'li') {
            // Render bullet or item list item layout
            return (
              <li key={key} style={{
                ...blockStyles,
                display: 'list-item',
                marginLeft: `calc(16px + ${indent} + ${blockMargin}px)`,
              }}>
                {children}
              </li>
            );
          }

          return (
            <div key={key} style={blockStyles}>
              {children}
            </div>
          );
        }

        if (tagName === 'ul') {
          return (
            <ul key={key} style={{ listStyleType: 'disc', paddingLeft: '20px', margin: '8px 0' }}>
              {children}
            </ul>
          );
        }

        if (tagName === 'ol') {
          return (
            <ol key={key} style={{ listStyleType: 'decimal', paddingLeft: '20px', margin: '8px 0' }}>
              {children}
            </ol>
          );
        }

        if (tagName === 'span' || tagName === 'strong' || tagName === 'em' || tagName === 'u' || tagName === 'a') {
          return (
            <span key={key} style={{
              fontWeight: childStyles.bold ? 'bold' : 'normal',
              fontStyle: childStyles.italic ? 'italic' : 'normal',
              textDecoration: childStyles.underline ? 'underline' : 'none',
              color: childStyles.color,
            }}>
              {children}
            </span>
          );
        }

        if (tagName === 'img') {
          const src = node.getAttribute('src');
          const alt = node.getAttribute('alt') || '';
          return (
            <div key={key} style={{
              display: 'block',
              margin: '16px auto',
              maxWidth: '100%',
              textAlign: 'center',
              pointerEvents: 'auto',
            }}>
              <img src={src} alt={alt} style={{
                maxWidth: '90%',
                maxHeight: '350px',
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.15)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                display: 'inline-block',
                background: '#fff',
                padding: '4px',
              }} />
            </div>
          );
        }

        return <span key={key}>{children}</span>;
      }

      return null;
    };

    const elements = Array.from(doc.body.childNodes).map((node, idx) => 
      walk(node, `root-${idx}`)
    );
    return elements;
  };

  /* ── Render Grid / Dot Lines ─────────────────────────────── */
  const renderBackgroundPattern = () => {
    if (!showLines || lineType === 'none') return null;

    const gap = fontSize * lineHeight;

    if (lineType === 'ruled') {
      return (
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `repeating-linear-gradient(transparent, transparent ${gap - 1}px, ${lineColor} ${gap - 1}px, ${lineColor} ${gap}px)`,
          backgroundSize: `100% ${gap}px`,
          marginTop: `${gap}px`,
        }} />
      );
    }

    if (lineType === 'grid') {
      const gap = fontSize * lineHeight;
      return (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <pattern id="grid" width={gap} height={gap} patternUnits="userSpaceOnUse">
              <path d={`M ${gap} 0 L 0 0 0 ${gap}`} fill="none" stroke={lineColor} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      );
    }

    if (lineType === 'dot') {
      const gap = fontSize * lineHeight;
      return (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <pattern id="dots" width={gap} height={gap} patternUnits="userSpaceOnUse">
              <circle cx={gap / 2} cy={gap / 2} r="1.2" fill={lineColor} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      );
    }
    return null;
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className="page-wrapper">
      {/* SVG filter for natural ink appearance */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id="natural-ink-filter">
            {/* Hand tremor / high-frequency noise */}
            <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="2" result="tremor" />
            {/* Paper fiber bleed / low-frequency noise */}
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" result="bleed" />
            {/* Blend tremor and bleed */}
            <feBlend in="tremor" in2="bleed" mode="multiply" result="mixedNoise" />
            
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="mixedNoise" 
              scale={Math.max(0.6, Math.min(3.5, (fontSize / 22) * (selectedPenObj?.stroke || 1.25) * 1.2 * (variationIntensity / 100)))} 
              xChannelSelector="R" 
              yChannelSelector="G" 
              result="displaced" 
            />
            <feGaussianBlur in="displaced" stdDeviation={0.35 * (variationIntensity / 100)} result="blurred" />
            <feComponentTransfer in="blurred" result="finalInk">
              <feFuncA type="linear" slope="2.2" intercept="-0.6" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="finalInk" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.main}>

          {/* ── Header ──────────────────────────────────────── */}
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}><Wand2 size={24} /> Transformation Studio</h1>
              <p style={styles.subtitle}>
                Upload files, paste text, speak or capture — transform between handwriting & AI text
              </p>
            </div>
          </div>

          {/* ── Transform Mode Toggle ──────────────────────── */}
          <div style={styles.modeToggle}>
            <button
              id="mode-ai-to-handwriting"
              onClick={() => setTransformMode('ai_to_handwriting')}
              style={{
                ...styles.modeBtn,
                ...(transformMode === 'ai_to_handwriting' ? styles.modeBtnActive : {}),
              }}
            >
              <Sparkles size={18} />
              <span>AI → Handwriting</span>
              <span style={styles.modeSub}>Convert typed/AI text into handwritten style</span>
            </button>
            
            <div style={styles.modeArrow}><ArrowRightLeft size={20} /></div>

            <button
              id="mode-handwriting-to-handwriting"
              onClick={() => setTransformMode('handwriting_to_handwriting')}
              style={{
                ...styles.modeBtn,
                ...(transformMode === 'handwriting_to_handwriting' ? styles.modeBtnActive : {}),
              }}
            >
              <PenTool size={18} />
              <span>Handwriting → My Handwriting</span>
              <span style={styles.modeSub}>Convert classmate's/other handwriting to your own style</span>
            </button>

            <div style={styles.modeArrow}><ArrowRightLeft size={20} /></div>
            
            <button
              id="mode-handwriting-to-ai"
              onClick={() => setTransformMode('handwriting_to_ai')}
              style={{
                ...styles.modeBtn,
                ...(transformMode === 'handwriting_to_ai' ? styles.modeBtnActive : {}),
              }}
            >
              <Zap size={18} />
              <span>Handwriting → AI</span>
              <span style={styles.modeSub}>Convert handwritten/casual text to formal AI text</span>
            </button>
          </div>

          {/* ── Input Tabs ─────────────────────────────────── */}
          <div style={styles.tabs}>
            {[
              { id: 'upload', label: 'Upload File', icon: Upload },
              { id: 'text', label: 'Paste Text', icon: Type },
              { id: 'voice', label: 'Voice Input', icon: Mic },
              { id: 'camera', label: 'Camera OCR', icon: Camera },
            ].map(t => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                onClick={() => setTab(t.id)}
                style={{
                  ...styles.tab,
                  ...(tab === t.id ? styles.tabActive : {}),
                }}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab Content ────────────────────────────────── */}
          <div style={styles.tabContent}>
            {tab === 'upload' && (
              <div>
                <FileUploader onFileSelect={handleFileSelect} />
                {loading && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '16px 20px', marginTop: '12px',
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 'var(--radius-lg)',
                  }}>
                    <RefreshCw size={18} style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0 }}>
                        Processing file…
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        {file?.name?.endsWith('.pdf')
                          ? 'Running OCR on PDF pages — this may take 15-30 seconds for handwritten documents'
                          : 'Extracting text content from the uploaded file'}
                      </p>
                    </div>
                  </div>
                )}
                {file && uploadedFileId && !loading && (
                  <div style={styles.uploadedInfo}>
                    <div style={styles.uploadedBadge}>
                      <Check size={14} style={{ color: 'var(--accent-green)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{file.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        — {textContent.startsWith('[') && textContent.endsWith(']')
                          ? 'OCR notice (see below)'
                          : `Text extracted (${textContent.length} chars)`}
                      </span>
                    </div>
                    <button onClick={downloadOriginal} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                      <Download size={14} /> Download Original
                    </button>
                  </div>
                )}
                {file && uploadedFileId && !loading && textContent && textContent.startsWith('[') && textContent.endsWith(']') && (
                  <div style={{
                    padding: '12px 16px', marginTop: '8px',
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem', color: 'var(--text-secondary)',
                  }}>
                    ⚠️ {textContent.slice(1, -1)}
                  </div>
                )}
                <p style={styles.formatHint}>
                  Supports: <strong>PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, JPEG, PNG, TXT</strong> — Max 250MB
                  <br />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    📝 Handwritten PDFs and images are processed with OCR (Tesseract) for text extraction
                  </span>
                </p>
              </div>
            )}

            {tab === 'text' && (
              <div>
                {/* ── Your Handwriting Style ───────────────────── */}
                <div style={styles.quickStylePanel}>
                  <div style={styles.quickStyleHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} style={{ color: 'var(--accent-gold)' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Your Handwriting Style</span>
                    </div>
                    {activeStyle && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                        ✓ {activeStyle.name} ({activeStyle.font_match})
                      </span>
                    )}
                  </div>

                  {/* Upload new style */}
                  <div style={{
                    display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
                    padding: '10px 0',
                  }}>
                    <label style={{
                      flex: 1, minWidth: '180px',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 14px',
                      background: 'var(--bg-glass)',
                      border: '1px dashed var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      color: styleFile ? 'var(--accent-green)' : 'var(--text-muted)',
                      transition: 'all 0.2s',
                    }}>
                      <Upload size={16} />
                      {styleFile ? styleFile.name : 'Upload handwriting sample (JPG/PNG/PDF)'}
                      <input type="file" accept=".jpg,.jpeg,.png,.bmp,.tiff,.webp,.pdf"
                        onChange={(e) => setStyleFile(e.target.files[0] || null)}
                        style={{ display: 'none' }} />
                    </label>
                    <input
                      value={styleName}
                      onChange={(e) => setStyleName(e.target.value)}
                      placeholder="Style name (optional)"
                      className="input-field"
                      style={{ width: '150px', fontSize: '0.82rem' }}
                    />
                    <button
                      onClick={uploadNewStyle}
                      disabled={!styleFile || analyzingStyle}
                      className="btn btn-primary btn-sm"
                      style={{ flexShrink: 0 }}
                    >
                      {analyzingStyle ? (
                        <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</>
                      ) : (
                        <><Wand2 size={14} /> Analyze & Save</>
                      )}
                    </button>
                  </div>

                  {/* Saved styles list */}
                  {savedStyles.length > 0 && (
                    <div style={styles.quickStyleChips}>
                      {savedStyles.map(s => (
                        <button
                          key={s.id}
                          onClick={() => applyCustomStyle(s)}
                          style={{
                            ...styles.quickStyleChip,
                            borderColor: activeStyle?.id === s.id ? 'var(--accent-gold)' : 'var(--border-subtle)',
                            background: activeStyle?.id === s.id
                              ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,180,0,0.08))'
                              : 'var(--bg-glass)',
                            boxShadow: activeStyle?.id === s.id
                              ? '0 0 12px rgba(255,215,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
                              : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            padding: '10px 14px',
                            minWidth: '150px',
                            position: 'relative',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.15rem' }}>✍️</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1px', flex: 1 }}>
                              <span style={{
                                fontWeight: 700, fontSize: '0.78rem',
                                color: activeStyle?.id === s.id ? 'var(--accent-gold)' : 'var(--text-primary)',
                              }}>
                                {s.name}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                {s.font_match}
                              </span>
                            </div>
                            {activeStyle?.id === s.id && (
                              <Check size={14} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteCustomStyle(s.id); }}
                              style={{
                                background: 'none', border: 'none', color: 'var(--text-muted)',
                                cursor: 'pointer', padding: '2px', fontSize: '0.7rem',
                                opacity: 0.5, transition: 'opacity 0.2s',
                              }}
                              title="Delete style"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          {/* Font preview */}
                          <div style={{
                            fontFamily: `'${s.font_match}', cursive`,
                            fontSize: '1.05rem',
                            color: s.ink_color || '#1a1a2e',
                            lineHeight: 1.4,
                            marginTop: '6px',
                            padding: '6px 8px',
                            background: 'rgba(255,255,255,0.92)',
                            borderRadius: '6px',
                            textAlign: 'left',
                          }}>
                            Hello world
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {savedStyles.length === 0 && !styleFile && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '8px 0 0', textAlign: 'center' }}>
                      Upload a sample of your handwriting to get started — the system will analyze your style and match it
                    </p>
                  )}

                  {/* Quick controls row */}
                  <div style={styles.quickControlsRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Size:</span>
                      <button onClick={() => setFontSize(s => Math.max(14, s - 2))} style={styles.quickSizeBtn}>A−</button>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, minWidth: '32px', textAlign: 'center' }}>{fontSize}px</span>
                      <button onClick={() => setFontSize(s => Math.min(48, s + 2))} style={styles.quickSizeBtn}>A+</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Ink:</span>
                      {[
                        { color: '#1e293b', label: 'Navy' },
                        { color: '#1a3a8a', label: 'Royal Blue' },
                        { color: '#222222', label: 'Black' },
                        { color: '#0d4f2b', label: 'Emerald' },
                        { color: '#4a1942', label: 'Purple' },
                        { color: '#8b0000', label: 'Crimson' },
                      ].map(ink => (
                        <button
                          key={ink.color}
                          title={ink.label}
                          onClick={() => setFontColor(ink.color)}
                          style={{
                            ...styles.quickInkDot,
                            background: ink.color,
                            boxShadow: fontColor === ink.color
                              ? `0 0 0 2px var(--bg-card), 0 0 0 4px var(--accent-gold)`
                              : 'none',
                            transform: fontColor === ink.color ? 'scale(1.2)' : 'scale(1)',
                          }}
                        />
                      ))}
                      <div style={{ position: 'relative' }}>
                        <input
                          type="color"
                          value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          title="Custom color"
                          style={styles.quickColorInput}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Styled Textarea ──────────────────────────── */}
                <textarea
                  id="text-input"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Start typing in your chosen handwriting style…"
                  className="input-field"
                  style={{
                    minHeight: '240px',
                    resize: 'vertical',
                    fontFamily: `'${selectedFont}', cursive`,
                    fontSize: `${Math.max(fontSize, 18)}px`,
                    lineHeight: lineHeight,
                    letterSpacing: `${letterSpacing}px`,
                    wordSpacing: `${wordSpacing}px`,
                    color: fontColor,
                    transform: textTilt ? `rotate(${textTilt * 0.3}deg)` : 'none',
                    transformOrigin: 'top left',
                    transition: 'font-family 0.3s ease, color 0.2s ease, font-size 0.2s ease',
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center' }}>
                  <button onClick={handleTextSubmit} className="btn btn-primary" disabled={loading}>
                    <FileText size={16} /> Save Text
                  </button>
                  {activeStyle && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      fontSize: '0.78rem', color: 'var(--accent-gold)',
                      background: 'rgba(255,215,0,0.08)', padding: '4px 12px',
                      borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,215,0,0.2)',
                    }}>
                      <PenTool size={12} /> Writing in: {activeStyle.name}
                    </span>
                  )}
                  {textContent && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', alignSelf: 'center', marginLeft: 'auto' }}>
                      {textContent.length} characters
                    </span>
                  )}
                </div>
              </div>
            )}

            {tab === 'voice' && (
              <div style={styles.voicePanel}>
                {/* Mic button */}
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  {isRecording && (
                    <div style={{
                      position: 'absolute', inset: '-8px', borderRadius: '50%',
                      border: '3px solid rgba(239,68,68,0.4)',
                      animation: 'pulse 1.5s infinite',
                    }} />
                  )}
                  <button
                    id="voice-record-btn"
                    onClick={toggleRecording}
                    style={{
                      ...styles.micBtn,
                      background: isRecording
                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : 'var(--gradient-gold)',
                      animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                    }}
                  >
                    {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                  </button>
                </div>

                {/* Status message */}
                <p style={{
                  color: isRecording ? '#ef4444' : 'var(--text-secondary)',
                  marginTop: '16px', fontSize: '0.95rem', fontWeight: isRecording ? 600 : 400,
                  minHeight: '24px',
                }}>
                  {voiceStatus || (isRecording ? '🔴 Listening… Click to stop' : 'Click the mic to start speaking')}
                </p>

                {/* HTTPS info */}
                {typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', padding: '8px 12px', background: 'rgba(255,200,0,0.08)', borderRadius: '8px', border: '1px solid rgba(255,200,0,0.15)' }}>
                    ⚠️ Speech recognition works best on HTTPS or localhost
                  </p>
                )}

                {/* Interim text (live preview of what's being heard) */}
                {interimText && (
                  <div style={{
                    marginTop: '16px', padding: '12px 16px',
                    background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(239,68,68,0.15)', textAlign: 'left',
                  }}>
                    <p style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.82rem', color: '#ef4444' }}>👂 Hearing...</p>
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>{interimText}</p>
                  </div>
                )}

                {/* Final transcript */}
                {textContent && (
                  <div style={styles.transcriptBox}>
                    <p style={{ fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} /> Transcription:
                    </p>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{textContent}</p>
                  </div>
                )}

                {/* Browser support note */}
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '16px' }}>
                  Best supported in Google Chrome and Microsoft Edge. Requires microphone permission.
                </p>
              </div>
            )}

            {tab === 'camera' && (
              <div style={styles.cameraPanel}>
                {cameraActive && (
                  <video ref={videoRef} autoPlay style={styles.video} />
                )}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button onClick={toggleCamera} className={`btn ${cameraActive ? 'btn-danger' : 'btn-primary'}`}>
                    {cameraActive ? <><CameraOff size={16} /> Stop Camera</> : <><Camera size={16} /> Start Camera</>}
                  </button>
                  {cameraActive && (
                    <button onClick={captureCamera} className="btn btn-secondary">
                      📸 Capture & Extract Text
                    </button>
                  )}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '10px' }}>
                  Capture handwritten text and extract it via OCR
                </p>
              </div>
            )}
          </div>

          {/* ── Editor ────────────────────────────────────── */}
          {(textContent || editorContent) && (
            <div style={styles.editorSection}>
              <h3 style={styles.sectionTitle}><PenTool size={18} /> Edit Content</h3>
              <RichTextEditor
                content={editorContent || textContent}
                onUpdate={setEditorContent}
                placeholder="Edit your content here…"
              />
            </div>
          )}

          {/* ── Transform Settings ─────────────────────────── */}
          {(textContent || editorContent) && (
            <div style={styles.controlSection}>
              <h3 style={styles.sectionTitle}>
                <Sliders size={18} />
                {transformMode === 'ai_to_handwriting' || transformMode === 'handwriting_to_handwriting' ? 'Handwriting Style' : 'AI Output Settings'}
              </h3>

              {/* ── Your Saved Styles ───────────────────── */}
              {(transformMode === 'ai_to_handwriting' || transformMode === 'handwriting_to_handwriting') && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Your Saved Styles</span>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 12px',
                        background: 'rgba(99,140,255,0.1)',
                        border: '1px solid rgba(99,140,255,0.2)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer', fontSize: '0.78rem', color: 'var(--accent-blue)',
                      }}>
                        <Upload size={14} /> Upload New Style
                        <input type="file" accept=".jpg,.jpeg,.png,.bmp,.pdf"
                          onChange={async (e) => {
                            const f = e.target.files[0];
                            if (!f) return;
                            setAnalyzingStyle(true);
                            try {
                              const formData = new FormData();
                              formData.append('file', f);
                              const res = await api.post('/styles/upload', formData, {
                                headers: { 'Content-Type': 'multipart/form-data' },
                              });
                              addToast(`Style "${res.data.style.name}" saved! ✨`, 'success');
                              await fetchSavedStyles();
                              applyCustomStyle(res.data.style);
                            } catch (err) {
                              addToast('Failed to analyze style', 'error');
                            } finally {
                              setAnalyzingStyle(false);
                            }
                          }}
                          style={{ display: 'none' }} />
                      </label>
                    </div>

                    {analyzingStyle && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '12px', background: 'rgba(99,102,241,0.08)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 'var(--radius-md)', marginBottom: '12px',
                      }}>
                        <RefreshCw size={16} style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '0.85rem' }}>Analyzing your handwriting style...</span>
                      </div>
                    )}

                    {savedStyles.length === 0 && !analyzingStyle && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                        No styles saved yet. Upload a sample of your handwriting to get started.
                      </p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {savedStyles.map(s => (
                        <button
                          key={s.id}
                          onClick={() => applyCustomStyle(s)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px 14px', width: '100%',
                            background: activeStyle?.id === s.id ? 'rgba(255,215,0,0.08)' : 'var(--bg-glass)',
                            border: `1px solid ${activeStyle?.id === s.id ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer', color: 'var(--text-primary)',
                            transition: 'all 0.2s',
                          }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>✍️</span>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{s.name}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Font: {s.font_match} · Slant: {s.params?.slant || 0}°
                            </p>
                          </div>
                          <div style={{
                            fontFamily: `'${s.font_match}', cursive`,
                            fontSize: '0.95rem', color: s.ink_color || '#1a1a2e',
                            background: 'rgba(255,255,255,0.9)',
                            padding: '4px 10px', borderRadius: '4px',
                          }}>
                            Sample
                          </div>
                          {activeStyle?.id === s.id && (
                            <Check size={16} style={{ color: 'var(--accent-gold)' }} />
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteCustomStyle(s.id); }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          >
                            <X size={14} />
                          </button>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Customization Controls ─────────────── */}
                  <div style={styles.controls}>
                    <div style={styles.controlGroupFullWidth}>
                      <label style={styles.controlLabel}>Pen Preset Selection</label>
                      <div style={styles.penPresetGrid}>
                        {penPresets.map(pen => {
                          const isActive = activePen === pen.id;
                          return (
                            <button
                              key={pen.id}
                              onClick={() => {
                                setActivePen(pen.id);
                                setFontColor(pen.color);
                                setLetterSpacing(pen.letterGap);
                              }}
                              style={{
                                ...styles.penCard,
                                borderColor: isActive ? 'var(--accent-gold)' : 'var(--border-subtle)',
                                background: isActive ? 'rgba(255,215,0,0.06)' : 'var(--bg-glass)',
                                boxShadow: isActive ? '0 0 10px rgba(255,215,0,0.15)' : 'none',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.2rem' }}>
                                  {pen.id.includes('ballpoint') ? '🖊️' : pen.id.includes('gel') ? '✒️' : '✒️'}
                                </span>
                                <div style={{ textAlign: 'left' }}>
                                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{pen.label}</div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                    Stroke: {pen.stroke}mm · Pressure: {Math.round(pen.pressure * 100)}%
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div style={styles.controlGroup}>
                      <label style={styles.controlLabel}>Font Size ({fontSize}px)</label>
                      <input type="range" min="14" max="48" value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        style={styles.range} />
                    </div>
                    <div style={styles.controlGroup}>
                      <label style={styles.controlLabel}>Ink Color</label>
                      <div style={styles.colorRow}>
                        <input type="color" value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          style={styles.colorPicker} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fontColor}</span>
                      </div>
                    </div>
                    <div style={styles.controlGroup}>
                      <label style={styles.controlLabel}>Line Height ({lineHeight})</label>
                      <input type="range" min="1.2" max="3.5" step="0.1" value={lineHeight}
                        onChange={(e) => setLineHeight(Number(e.target.value))}
                        style={styles.range} />
                    </div>
                    <div style={styles.controlGroup}>
                      <label style={styles.controlLabel}>Letter Spacing ({letterSpacing}px)</label>
                      <input type="range" min="-2" max="8" step="0.5" value={letterSpacing}
                        onChange={(e) => setLetterSpacing(Number(e.target.value))}
                        style={styles.range} />
                    </div>
                    <div style={styles.controlGroup}>
                      <label style={styles.controlLabel}>Text Alignment</label>
                      <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.25)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
                        {[
                          { id: 'left', icon: AlignLeft, label: 'Left' },
                          { id: 'center', icon: AlignCenter, label: 'Center' },
                          { id: 'right', icon: AlignRight, label: 'Right' },
                          { id: 'justify', icon: AlignJustify, label: 'Justify' },
                        ].map(align => (
                          <button
                            key={align.id}
                            title={align.label}
                            onClick={() => setTextAlignment(align.id)}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '8px',
                              background: textAlignment === align.id ? 'var(--accent-gold)' : 'transparent',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              color: textAlignment === align.id ? '#000' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            <align.icon size={15} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Humanization Controls ──────────────── */}
                  <div style={styles.humanizeSection}>
                    <div style={styles.humanizeHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Sparkles size={16} style={{ color: 'var(--accent-gold)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Natural Handwriting Mode</span>
                      </div>
                      <button
                        onClick={() => setHumanizeEnabled(!humanizeEnabled)}
                        style={{
                          ...styles.toggleBtn,
                          background: humanizeEnabled ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)',
                        }}
                      >
                        <div style={{
                          ...styles.toggleDot,
                          transform: humanizeEnabled ? 'translateX(20px)' : 'translateX(2px)',
                        }} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                      Adds natural imperfections — slight tilts, baseline shifts, size variations
                    </p>
                    {humanizeEnabled && (
                      <div style={{ marginTop: '12px' }}>
                        <label style={styles.controlLabel}>
                          Variation Intensity ({variationIntensity}%)
                        </label>
                        <input type="range" min="0" max="100" value={variationIntensity}
                          onChange={(e) => setVariationIntensity(Number(e.target.value))}
                          style={styles.range} />
                      </div>
                    )}
                  </div>

                  {/* ── Advanced toggle ──────────────────────── */}
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={styles.advancedToggle}
                  >
                    {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {showAdvanced ? 'Hide Advanced' : 'Show Advanced Options'}
                  </button>

                  {showAdvanced && (
                    <div style={styles.controls}>
                      <div style={styles.controlGroup}>
                        <label style={styles.controlLabel}>Word Spacing ({wordSpacing}px)</label>
                        <input type="range" min="0" max="20" step="1" value={wordSpacing}
                          onChange={(e) => setWordSpacing(Number(e.target.value))}
                          style={styles.range} />
                      </div>
                      <div style={styles.controlGroup}>
                        <label style={styles.controlLabel}>Text Tilt ({textTilt}°)</label>
                        <input type="range" min="-5" max="5" step="0.5" value={textTilt}
                          onChange={(e) => setTextTilt(Number(e.target.value))}
                          style={styles.range} />
                      </div>
                    </div>
                  )}

                  {/* ── Background / Paper Options ────────── */}
                  <div style={{ marginTop: '24px' }}>
                    <h4 style={{ ...styles.sectionTitle, fontSize: '0.95rem', marginBottom: '12px' }}>
                      <LayoutGrid size={16} /> Page Background
                    </h4>

                    <div style={styles.bgTabs}>
                      {[
                        { id: 'presets', label: 'Presets', icon: LayoutGrid },
                        { id: 'color', label: 'Colors', icon: Palette },
                        { id: 'custom', label: 'Custom', icon: Sliders },
                      ].map(t => (
                        <button key={t.id}
                          onClick={() => setBgTab(t.id)}
                          style={{
                            ...styles.bgTab,
                            ...(bgTab === t.id ? styles.bgTabActive : {}),
                          }}>
                          <t.icon size={14} /> {t.label}
                        </button>
                      ))}
                    </div>

                    {bgTab === 'presets' && (
                      <div style={styles.presetGrid}>
                        {paperPresets.map(p => (
                          <button
                            key={p.id}
                            onClick={() => selectPaperPreset(p)}
                            style={{
                              ...styles.presetCard,
                              borderColor: paperPreset === p.id ? 'var(--accent-gold)' : 'var(--border-subtle)',
                            }}
                          >
                            <div style={{
                              ...styles.presetSwatch,
                              background: p.bg,
                            }}>
                              {p.lines === true && (
                                <>
                                  <div style={{ position: 'absolute', width: '100%', height: '1px', background: p.lineColor || 'rgba(0,100,200,0.15)', top: '33%' }} />
                                  <div style={{ position: 'absolute', width: '100%', height: '1px', background: p.lineColor || 'rgba(0,100,200,0.15)', top: '66%' }} />
                                  {p.marginColor && <div style={{ position: 'absolute', left: '20%', top: 0, bottom: 0, width: '1px', background: p.marginColor }} />}
                                </>
                              )}
                              {p.lines === 'grid' && (
                                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                                  <defs><pattern id={`g-${p.id}`} width="12" height="12" patternUnits="userSpaceOnUse">
                                    <path d="M 12 0 L 0 0 0 12" fill="none" stroke={p.lineColor || 'rgba(0,0,0,0.08)'} strokeWidth="0.5" />
                                  </pattern></defs>
                                  <rect width="100%" height="100%" fill={`url(#g-${p.id})`} />
                                </svg>
                              )}
                              {p.lines === 'dot' && (
                                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                                  <defs><pattern id={`d-${p.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
                                    <circle cx="4" cy="4" r="0.8" fill={p.lineColor || 'rgba(0,0,0,0.15)'} />
                                  </pattern></defs>
                                  <rect width="100%" height="100%" fill={`url(#d-${p.id})`} />
                                </svg>
                              )}
                            </div>
                            <span style={{
                              fontSize: '0.7rem', fontWeight: 500,
                              color: paperPreset === p.id ? 'var(--accent-gold)' : 'var(--text-secondary)',
                            }}>
                              {p.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {bgTab === 'color' && (
                      <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Pure background colors — no lines or margins</p>
                        <div style={styles.colorGrid}>
                          {bgColorOptions.map(c => (
                            <button key={c} onClick={() => {
                              setBgColor(c);
                              setShowLines(false);
                              setLineType('none');
                              setShowMargin(false);
                              setPaperPreset('');
                              if (c === '#1a1a2e' || c === '#16213e' || c === '#0f0f23') {
                                setFontColor('#e0e0e0');
                              }
                            }} style={{
                              ...styles.colorSwatch,
                              background: c,
                              borderColor: bgColor === c ? 'var(--accent-gold)' : 'transparent',
                              boxShadow: bgColor === c ? '0 0 0 3px rgba(255,215,0,0.3)' : 'none',
                            }}>
                              {bgColor === c && <Check size={14} style={{ color: c === '#ffffff' || c === '#fffef5' || c === '#fef9c3' ? '#000' : '#fff' }} />}
                            </button>
                          ))}
                        </div>
                        <div style={{ marginTop: '12px' }}>
                          <label style={styles.controlLabel}>Custom Color</label>
                          <input type="color" value={bgColor} onChange={(e) => {
                            setBgColor(e.target.value);
                            setShowLines(false);
                            setLineType('none');
                            setPaperPreset('');
                          }} style={{ ...styles.colorPicker, width: '60px' }} />
                        </div>
                      </div>
                    )}

                    {bgTab === 'custom' && (
                      <div style={styles.controls}>
                        <div style={styles.controlGroup}>
                          <label style={styles.controlLabel}>Background Color</label>
                          <input type="color" value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            style={styles.colorPicker} />
                        </div>
                        <div style={styles.controlGroup}>
                          <label style={styles.controlLabel}>Line Type</label>
                          <select value={lineType}
                            onChange={(e) => {
                              setLineType(e.target.value);
                              setShowLines(e.target.value !== 'none');
                            }}
                            className="input-field" style={{ cursor: 'pointer' }}>
                            <option value="none">No Lines</option>
                            <option value="ruled">Ruled Lines</option>
                            <option value="grid">Grid</option>
                            <option value="dot">Dot Grid</option>
                          </select>
                        </div>
                        {showLines && (
                          <div style={styles.controlGroup}>
                            <label style={styles.controlLabel}>Line Color</label>
                            <input type="color" value={lineColor.startsWith('rgba') ? '#6496c8' : lineColor}
                              onChange={(e) => setLineColor(e.target.value + '33')}
                              style={styles.colorPicker} />
                          </div>
                        )}
                        <div style={styles.controlGroup}>
                          <label style={styles.controlLabel}>Show Margin</label>
                          <button onClick={() => setShowMargin(!showMargin)}
                            className={`btn ${showMargin ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
                            {showMargin ? 'Yes' : 'No'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Transform Button ───────────────────────── */}
              <div style={styles.transformBar}>
                <button
                  id="transform-btn"
                  onClick={handleTransform}
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                  style={styles.transformBtn}
                >
                  {loading ? (
                    <><RefreshCw size={18} className="animate-spin" /> Transforming…</>
                  ) : (transformMode === 'ai_to_handwriting' || transformMode === 'handwriting_to_handwriting') ? (
                    <><Sparkles size={18} /> Transform to Handwriting</>
                  ) : (
                    <><Zap size={18} /> Transform to AI Text</>
                  )}
                </button>

                <button onClick={() => {
                  setTransformed(false);
                  setTransformedText('');
                }} className="btn btn-ghost" disabled={!transformed}>
                  <RotateCcw size={16} /> Reset
                </button>
              </div>
            </div>
          )}

          {/* ── Live Editable Preview ────────────────────────── */}
          {(textContent || editorContent || transformed) && (transformMode === 'ai_to_handwriting' || transformMode === 'handwriting_to_handwriting') && (
            <div style={styles.previewSection}>
              <div style={styles.previewHeader}>
                <h3 style={styles.sectionTitle}>
                  <PenTool size={18} />
                  Live Handwriting Preview
                  <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px' }}>
                    — real-time rendered output (edit text in the "Edit Content" section above)
                  </span>
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={copyTransformed} className="btn btn-ghost btn-sm">
                    <Copy size={14} /> Copy
                  </button>
                  <button onClick={downloadPDF} className="btn btn-primary btn-sm">
                    <Download size={14} /> PDF
                  </button>
                  <button onClick={downloadPNG} className="btn btn-secondary btn-sm">
                    <Download size={14} /> PNG
                  </button>
                  {uploadedFileId && (
                    <button onClick={downloadOriginal} className="btn btn-ghost btn-sm">
                      <Download size={14} /> Original File
                    </button>
                  )}
                </div>
              </div>

              {/* Paper Preview Sheet */}
              <div ref={previewRef} style={{
                ...styles.previewPaper,
                fontFamily: `'${selectedFont}', cursive`,
                fontSize: `${fontSize}px`,
                color: fontColor,
                background: `linear-gradient(to right, rgba(0,0,0,0.04) 0%, rgba(255,255,255,0) 4%, rgba(255,255,255,0) 96%, rgba(0,0,0,0.03) 100%), ${bgColor}`,
                lineHeight: lineHeight,
                letterSpacing: `${letterSpacing}px`,
                wordSpacing: `${wordSpacing}px`,
                transform: textTilt ? `rotate(${textTilt}deg)` : 'none',
              }}>
                {/* Real paper texture overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.05,
                  pointerEvents: 'none',
                  mixBlendMode: 'multiply',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  zIndex: 0,
                }} />
                {renderBackgroundPattern()}
                {showMargin && lineType === 'ruled' && <div style={styles.marginLine} />}
                <div style={{
                  ...styles.previewContent,
                  paddingLeft: showMargin && lineType === 'ruled' ? '15px' : '0',
                  pointerEvents: 'auto',
                  // Global slant applied to ALL text (much more natural than per-char skew)
                  transform: activeStyle?.params?.slant ? `skewX(${activeStyle.params.slant * 0.3}deg)` : 'none',
                  // High-quality SVG displacement filter for hand tremor + ink absorption simulation
                  filter: 'url(#natural-ink-filter) contrast(1.02) saturate(1.05)',
                  WebkitFontSmoothing: 'antialiased',
                }}>
                  {renderHTMLToHandwriting(transformedText || editorContent || textContent || ' ')}
                </div>
              </div>
            </div>
          )}

          {/* ── AI Output Preview (non-editable) ──────────────── */}
          {transformed && transformMode === 'handwriting_to_ai' && (
            <div style={styles.previewSection}>
              <div style={styles.previewHeader}>
                <h3 style={styles.sectionTitle}>
                  <FileText size={18} />
                  AI-Generated Text
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={copyTransformed} className="btn btn-ghost btn-sm">
                    <Copy size={14} /> Copy
                  </button>
                  <button onClick={downloadPDF} className="btn btn-primary btn-sm">
                    <Download size={14} /> PDF
                  </button>
                  <button onClick={downloadPNG} className="btn btn-secondary btn-sm">
                    <Download size={14} /> PNG
                  </button>
                </div>
              </div>
              <div ref={previewRef} style={styles.aiOutputBox}>
                <div style={styles.aiOutputContent}>
                  {transformedText || getPlainText(editorContent || textContent)}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════ */
const styles = {
  layout: { display: 'flex', minHeight: 'calc(100vh - var(--nav-height))' },
  main: { flex: 1, padding: '28px 32px', overflowY: 'auto', maxWidth: '100%' },

  /* Header */
  header: { marginBottom: '20px' },
  title: {
    display: 'flex', alignItems: 'center', gap: '10px',
    fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px',
  },
  subtitle: { color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' },

  /* Mode toggle */
  modeToggle: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '24px', flexWrap: 'wrap',
  },
  modeBtn: {
    flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
    padding: '18px 16px', borderRadius: 'var(--radius-lg)',
    border: '2px solid var(--border-subtle)', background: 'var(--bg-card)',
    color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.25s',
    textAlign: 'center',
  },
  modeBtnActive: {
    borderColor: 'var(--accent-gold)', background: 'rgba(255,215,0,0.06)',
    color: 'var(--accent-gold)', boxShadow: '0 0 20px rgba(255,215,0,0.1)',
  },
  modeSub: { fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 },
  modeArrow: { color: 'var(--text-muted)', flexShrink: 0 },

  /* Tabs */
  tabs: {
    display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)',
    borderRadius: 'var(--radius-md)', padding: '4px', marginBottom: '20px',
    border: '1px solid var(--border-subtle)',
  },
  tab: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '10px', borderRadius: 'var(--radius-sm)', border: 'none',
    background: 'transparent', color: 'var(--text-secondary)',
    fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
  },
  tabActive: { background: 'rgba(255,215,0,0.1)', color: 'var(--accent-gold)' },
  tabContent: {
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
  },

  /* Upload info */
  uploadedInfo: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '12px', marginTop: '14px', padding: '12px 16px',
    background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)',
    borderRadius: 'var(--radius-md)', flexWrap: 'wrap',
  },
  uploadedBadge: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  formatHint: {
    marginTop: '14px', fontSize: '0.78rem', color: 'var(--text-muted)',
  },

  /* Voice */
  voicePanel: { textAlign: 'center', padding: '40px 20px' },
  micBtn: {
    width: '80px', height: '80px', borderRadius: '50%', border: 'none',
    color: '#0a0a0a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: 'var(--shadow-md)', transition: 'all 0.3s',
  },
  transcriptBox: {
    marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.04)',
    borderRadius: 'var(--radius-md)', textAlign: 'left', border: '1px solid var(--border-subtle)',
  },

  /* Camera */
  cameraPanel: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px',
  },
  video: {
    width: '100%', maxWidth: '480px', borderRadius: 'var(--radius-md)',
    border: '2px solid var(--border-medium)',
  },

  /* Editor */
  editorSection: {
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
  },
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px',
  },

  /* Controls section */
  controlSection: {
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
  },
  controls: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px',
    marginTop: '16px',
  },
  controlGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  controlGroupFullWidth: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '8px',
  },
  penPresetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '10px',
    marginTop: '6px',
  },
  penCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: '2px solid var(--border-subtle)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },
  controlLabel: { fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' },
  range: { width: '100%', cursor: 'pointer', accentColor: '#ffd700' },
  colorPicker: {
    width: '100%', height: '36px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)', cursor: 'pointer', padding: 0, background: 'none',
  },
  colorRow: { display: 'flex', alignItems: 'center', gap: '10px' },

  /* Font grid */
  fontGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '10px', marginBottom: '20px',
  },
  fontCard: {
    position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px',
    padding: '14px 12px', borderRadius: 'var(--radius-md)',
    border: '2px solid var(--border-subtle)', cursor: 'pointer',
    transition: 'all 0.2s', textAlign: 'left', background: 'var(--bg-glass)',
  },
  fontCheck: {
    position: 'absolute', top: '8px', right: '8px', width: '22px', height: '22px',
    borderRadius: '50%', background: 'var(--accent-gold)', color: '#000',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  fontPreviewBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 16px', background: 'rgba(255,215,0,0.06)',
    border: '1px solid rgba(255,215,0,0.2)', borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '16px',
  },

  /* Advanced */
  advancedToggle: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'none', border: 'none', color: 'var(--accent-blue)',
    fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', marginTop: '12px',
    padding: '6px 0',
  },

  /* Background tabs */
  bgTabs: {
    display: 'flex', gap: '4px', marginBottom: '14px', background: 'rgba(0,0,0,0.15)',
    borderRadius: 'var(--radius-md)', padding: '3px',
  },
  bgTab: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: 'none',
    background: 'transparent', color: 'var(--text-muted)',
    fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
  },
  bgTabActive: { background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)' },

  /* Preset grid */
  presetGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '10px',
  },
  presetCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
    padding: '8px', borderRadius: 'var(--radius-md)',
    border: '2px solid var(--border-subtle)', background: 'none',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  presetSwatch: {
    width: '100%', aspectRatio: '4/3', borderRadius: 'var(--radius-sm)',
    position: 'relative', overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)',
  },

  /* Color grid */
  colorGrid: {
    display: 'flex', gap: '8px', flexWrap: 'wrap',
  },
  colorSwatch: {
    width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
    border: '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  /* Transform button */
  transformBar: {
    display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px',
    flexWrap: 'wrap',
  },
  transformBtn: {
    minWidth: '240px',
  },

  /* Preview section */
  previewSection: {
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
    animation: 'fadeIn 0.4s ease',
  },
  previewHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '16px', flexWrap: 'wrap', gap: '10px',
  },
  previewPaper: {
    position: 'relative', padding: '30px 30px 30px 60px', minHeight: '600px',
    borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.1)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden',
    transformOrigin: 'center top',
  },
  ruledLines: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  marginLine: {
    position: 'absolute', left: '50px', top: 0, bottom: 0,
    width: '2px', background: 'rgba(255, 100, 100, 0.25)',
  },
  previewContent: {
    position: 'relative', zIndex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  },
  previewOverlay: {
    position: 'absolute', inset: 0, zIndex: 2,
    width: '100%', height: '100%', minHeight: '600px',
    padding: '30px 30px 30px 60px',
    background: 'transparent', border: 'none', outline: 'none',
    color: 'transparent', caretColor: 'var(--accent-gold)',
    resize: 'none', overflow: 'hidden',
    cursor: 'text',
  },

  /* AI output */
  aiOutputBox: {
    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
    borderRadius: 'var(--radius-md)', padding: '24px',
    border: '1px solid rgba(99,140,255,0.2)',
    minHeight: '300px',
  },
  aiOutputContent: {
    fontFamily: "'Inter', sans-serif", fontSize: '1rem', lineHeight: 1.8,
    color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  },

  /* Category filter */
  categoryFilter: {
    display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px',
  },
  categoryBtn: {
    padding: '6px 14px', borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-subtle)', background: 'var(--bg-glass)',
    color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.2s',
  },
  categoryBtnActive: {
    background: 'rgba(255,215,0,0.12)', borderColor: 'var(--accent-gold)',
    color: 'var(--accent-gold)',
  },

  /* Humanize section */
  humanizeSection: {
    marginTop: '20px', padding: '16px', borderRadius: 'var(--radius-md)',
    background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.15)',
  },
  humanizeHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  toggleBtn: {
    width: '44px', height: '24px', borderRadius: '12px', border: 'none',
    cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
    padding: 0, flexShrink: 0,
  },
  toggleDot: {
    width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
    transition: 'transform 0.2s', position: 'absolute', top: '2px',
  },

  /* Style picker tabs */
  styleTabs: {
    display: 'flex', gap: '4px', marginBottom: '18px',
    background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: '4px',
  },
  styleTabBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: 'none',
    background: 'transparent', color: 'var(--text-muted)',
    fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
  },
  styleTabBtnActive: {
    background: 'rgba(255,215,0,0.12)', color: 'var(--accent-gold)',
    boxShadow: '0 1px 4px rgba(255,215,0,0.15)',
  },

  /* Trained style cards */
  trainedGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '14px',
  },
  trainedCard: {
    display: 'flex', flexDirection: 'column', padding: '16px',
    borderRadius: 'var(--radius-lg)', border: '2px solid var(--border-subtle)',
    background: 'var(--bg-glass)', cursor: 'pointer', transition: 'all 0.2s',
    textAlign: 'left', position: 'relative',
  },
  trainedCardHeader: {
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  trainedParams: {
    display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px',
    fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: "'Inter', sans-serif",
  },

  /* ── Quick Style Selector Panel ────────────────────────── */
  quickStylePanel: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,215,0,0.03) 100%)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,215,0,0.12)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px 20px',
    marginBottom: '16px',
    position: 'relative',
    overflow: 'hidden',
  },
  quickStyleHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '14px', flexWrap: 'wrap', gap: '6px',
  },
  quickStyleChips: {
    display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px',
  },
  quickStyleChip: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 14px', borderRadius: 'var(--radius-full)',
    border: '1.5px solid var(--border-subtle)',
    cursor: 'pointer', transition: 'all 0.25s ease',
    fontSize: '0.82rem', whiteSpace: 'nowrap',
  },
  customBadge: {
    display: 'inline-block',
    marginLeft: '6px',
    padding: '1px 6px',
    borderRadius: '4px',
    background: 'linear-gradient(135deg, #ffd700, #ffb700)',
    color: '#000',
    fontSize: '0.55rem',
    fontWeight: 800,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    verticalAlign: 'middle',
  },
  quickControlsRow: {
    display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  quickSizeBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '30px', height: '28px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)', background: 'var(--bg-glass)',
    color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.15s',
  },
  quickInkDot: {
    width: '20px', height: '20px', borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.1)',
    cursor: 'pointer', transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  quickColorInput: {
    width: '22px', height: '22px', borderRadius: '50%',
    border: '2px dashed rgba(255,255,255,0.2)',
    cursor: 'pointer', padding: 0, background: 'none',
    opacity: 0.7,
  },
};
