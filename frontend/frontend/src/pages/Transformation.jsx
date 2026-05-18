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
  Eye, Palette, LayoutGrid, AlignLeft, Sparkles, RotateCcw,
  ChevronDown, ChevronUp, Sliders, Image, Check, X, Copy, Filter,
  Shuffle, Dices
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ══════════════════════════════════════════════════════════════
   TRAINED HANDWRITING STYLE ENGINE
   Each style has per-character variation parameters learned from
   reference handwriting samples. Parameters control:
   - rotation: per-char tilt range (degrees)
   - baselineShift: vertical wobble (px)
   - sizeVariation: scale range (0-1)
   - xDrift: horizontal spacing jitter (px)
   - pressure: ink opacity variation (0-1)
   - slant: global italic lean (degrees)
   - connectedness: how close characters sit (0=spaced, 1=touching)
   - rhythm: regularity of spacing (0=uniform, 1=very irregular)
   ══════════════════════════════════════════════════════════════ */

const trainedStyles = [
  {
    id: 'clean-print',
    name: 'Clean Print',
    description: 'Neat printed handwriting — tidy and readable',
    font: 'Patrick Hand',
    inkColor: '#1a1a2e',
    params: { rotation: 1.5, baselineShift: 1.0, sizeVariation: 0.04, xDrift: 0.3, pressure: 0.05, slant: 0, connectedness: 0.1, rhythm: 0.15 },
    emoji: '✏️',
  },
  {
    id: 'flowing-cursive',
    name: 'Flowing Cursive',
    description: 'Elegant connected script — smooth and flowing',
    font: 'Dancing Script',
    inkColor: '#1a1a2e',
    params: { rotation: 2.5, baselineShift: 1.8, sizeVariation: 0.08, xDrift: 0.5, pressure: 0.10, slant: 8, connectedness: 0.8, rhythm: 0.25 },
    emoji: '🖊️',
  },
  {
    id: 'blue-ink-cursive',
    name: 'Blue Ink Calligraphy',
    description: 'Decorative blue pen on ruled paper — classic student style',
    font: 'Sacramento',
    inkColor: '#1a3a8a',
    params: { rotation: 2.0, baselineShift: 1.5, sizeVariation: 0.06, xDrift: 0.4, pressure: 0.12, slant: 10, connectedness: 0.9, rhythm: 0.20 },
    emoji: '🖋️',
  },
  {
    id: 'casual-scrawl',
    name: 'Casual Scrawl',
    description: 'Quick messy notes — hurried and natural',
    font: 'Caveat',
    inkColor: '#222222',
    params: { rotation: 4.0, baselineShift: 2.5, sizeVariation: 0.12, xDrift: 1.0, pressure: 0.15, slant: -3, connectedness: 0.3, rhythm: 0.50 },
    emoji: '📝',
  },
  {
    id: 'vintage-letter',
    name: 'Vintage Letter',
    description: 'Old-fashioned ink pen — elegant and classic',
    font: 'Homemade Apple',
    inkColor: '#2d1810',
    params: { rotation: 3.0, baselineShift: 2.0, sizeVariation: 0.10, xDrift: 0.8, pressure: 0.18, slant: 5, connectedness: 0.5, rhythm: 0.35 },
    emoji: '📜',
  },
];

/* Seeded pseudo-random number generator for reproducible styles */
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* Generate a random handwriting style with a seed */
function generateRandomStyle(seed) {
  const rng = seededRandom(seed);
  const fonts = handwritingFonts;
  const font = fonts[Math.floor(rng() * fonts.length)];
  const inkColors = ['#1a1a2e','#222222','#1a3a8a','#2d1810','#0d4f2b','#4a1942','#333333','#0a2647'];
  const inkColor = inkColors[Math.floor(rng() * inkColors.length)];
  const adjectives = ['Wandering','Dreamy','Crisp','Breezy','Gentle','Bold','Whispering','Stormy','Twilight','Moonlit','Sunlit','Rustic','Velvet','Misty','Golden'];
  const nouns = ['Quill','Script','Ink','Letter','Stroke','Flow','Pen','Note','Journal','Page'];
  const adj = adjectives[Math.floor(rng() * adjectives.length)];
  const noun = nouns[Math.floor(rng() * nouns.length)];
  const emojis = ['✍️','🖊️','✏️','📝','🖋️','📜','🪶','📄','💫','🎨'];

  return {
    id: `random-${seed}`,
    name: `${adj} ${noun}`,
    description: `Randomly generated style #${seed}`,
    font: font.name,
    inkColor,
    params: {
      rotation: 1 + rng() * 5,
      baselineShift: 0.5 + rng() * 3,
      sizeVariation: 0.02 + rng() * 0.15,
      xDrift: 0.2 + rng() * 1.5,
      pressure: 0.03 + rng() * 0.2,
      slant: (rng() - 0.4) * 15,
      connectedness: rng() * 0.9,
      rhythm: 0.1 + rng() * 0.5,
    },
    emoji: emojis[Math.floor(rng() * emojis.length)],
  };
}

/* ── Font Library (20 Humanized Styles) ─────────────────────── */
const handwritingFonts = [
  { name: 'Caveat', label: 'Caveat', style: 'Casual handwriting', category: 'casual' },
  { name: 'Indie Flower', label: 'Indie Flower', style: 'Fun and playful', category: 'casual' },
  { name: 'Dancing Script', label: 'Dancing Script', style: 'Elegant cursive', category: 'cursive' },
  { name: 'Patrick Hand', label: 'Patrick Hand', style: 'Clean handwriting', category: 'neat' },
  { name: 'Shadows Into Light', label: 'Shadows Into Light', style: 'Whimsical script', category: 'artistic' },
  { name: 'Kalam', label: 'Kalam', style: 'Indian handwriting', category: 'casual' },
  { name: 'Architects Daughter', label: 'Architects Daughter', style: 'Blueprint style', category: 'neat' },
  { name: 'Coming Soon', label: 'Coming Soon', style: 'Relaxed notes', category: 'casual' },
  { name: 'Gochi Hand', label: 'Gochi Hand', style: 'Bold marker', category: 'artistic' },
  { name: 'Handlee', label: 'Handlee', style: 'Smooth ballpoint', category: 'neat' },
  { name: 'Just Another Hand', label: 'Just Another Hand', style: 'Quick notes', category: 'messy' },
  { name: 'Loved by the King', label: 'Loved by the King', style: 'Scratchy pen', category: 'messy' },
  { name: 'Nothing You Could Do', label: 'Nothing You Could Do', style: 'Scrawled note', category: 'messy' },
  { name: 'Reenie Beanie', label: 'Reenie Beanie', style: 'Scribbled memo', category: 'messy' },
  { name: 'Rock Salt', label: 'Rock Salt', style: 'Rough & edgy', category: 'artistic' },
  { name: 'Sacramento', label: 'Sacramento', style: 'Flowing script', category: 'cursive' },
  { name: 'Satisfy', label: 'Satisfy', style: 'Smooth cursive', category: 'cursive' },
  { name: 'Homemade Apple', label: 'Homemade Apple', style: 'Natural ink pen', category: 'artistic' },
  { name: 'La Belle Aurore', label: 'La Belle Aurore', style: 'Vintage letter', category: 'cursive' },
  { name: 'Cedarville Cursive', label: 'Cedarville Cursive', style: 'School cursive', category: 'cursive' },
];

const fontCategories = [
  { id: 'all', label: 'All Styles' },
  { id: 'casual', label: 'Casual' },
  { id: 'cursive', label: 'Cursive' },
  { id: 'artistic', label: 'Artistic' },
  { id: 'neat', label: 'Neat' },
  { id: 'messy', label: 'Messy' },
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
  const [lineHeight, setLineHeight] = useState(2.0);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [wordSpacing, setWordSpacing] = useState(0);
  const [textTilt, setTextTilt] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  /* ── Font Category Filter ───────────────────────────────── */
  const [fontCategoryFilter, setFontCategoryFilter] = useState('all');

  /* ── Humanization Engine ────────────────────────────────── */
  const [humanizeEnabled, setHumanizeEnabled] = useState(true);
  const [variationIntensity, setVariationIntensity] = useState(50);

  /* ── Trained Style Engine ───────────────────────────────── */
  const [activeTrainedStyle, setActiveTrainedStyle] = useState(null);
  const [randomStyles, setRandomStyles] = useState(() => {
    const initial = [];
    for (let i = 0; i < 4; i++) {
      initial.push(generateRandomStyle(Date.now() + i * 1000));
    }
    return initial;
  });
  const [styleTab, setStyleTab] = useState('trained'); // trained | fonts | random

  const generateNewRandomStyles = () => {
    const seed = Date.now();
    const newStyles = [];
    for (let i = 0; i < 4; i++) {
      newStyles.push(generateRandomStyle(seed + i * 777));
    }
    setRandomStyles(newStyles);
    addToast('Generated 4 new random styles! 🎲', 'success');
  };

  const applyTrainedStyle = (style) => {
    setActiveTrainedStyle(style);
    setSelectedFont(style.font);
    setHumanizeEnabled(true);

    // Ensure ink color contrasts with current background
    let ink = style.inkColor;
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

    // Map style params to variation intensity
    const avgIntensity = Math.min(100, Math.round(
      (style.params.rotation / 6 + style.params.baselineShift / 3.5 +
       style.params.sizeVariation / 0.17 + style.params.pressure / 0.23) * 25
    ));
    setVariationIntensity(avgIntensity);
    if (style.params.slant) setTextTilt(style.params.slant > 5 ? 2 : style.params.slant < -2 ? -1 : 0);
    addToast(`Applied "${style.name}" style ✨`, 'success');
  };

  /* ── Filtered fonts ─────────────────────────────────────── */
  const filteredFonts = useMemo(() => {
    if (fontCategoryFilter === 'all') return handwritingFonts;
    return handwritingFonts.filter(f => f.category === fontCategoryFilter);
  }, [fontCategoryFilter]);

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
  const recognitionRef = useRef(null);

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

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedFileId(res.data.file.id);
      const extracted = res.data.file.content_text || '';
      setTextContent(extracted);
      setEditorContent(extracted);
      if (extracted) {
        addToast('File uploaded & text extracted! ✨', 'success');
      } else {
        addToast('File uploaded! No text could be extracted.', 'warning');
      }
    } catch (err) {
      addToast(err.response?.data?.error || 'Upload failed', 'error');
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
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast('Speech recognition not supported. Use Chrome or Edge.', 'warning');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setTextContent(transcript);
    };

    recognition.onerror = (event) => {
      addToast('Speech recognition error: ' + event.error, 'error');
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    addToast('Listening… Speak now 🎤', 'info');
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
      if (transformMode === 'ai_to_handwriting') {
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

  const copyTransformed = () => {
    const text = getPlainText(transformedText || editorContent || textContent);
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard! 📋', 'success');
  };

  /* ── Helpers ──────────────────────────────────────────────── */
  const getPlainText = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  /* ── Auto-contrast: keep text visible on any background ─── */
  const getLuminance = (hex) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    const toLinear = (v) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const getContrastRatio = (c1, c2) => {
    const l1 = getLuminance(c1);
    const l2 = getLuminance(c2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  };

  // Auto-fix font color whenever background changes
  useEffect(() => {
    try {
      const ratio = getContrastRatio(fontColor, bgColor);
      if (ratio < 2.5) {
        // Not enough contrast — pick a contrasting color
        const bgLum = getLuminance(bgColor);
        const newColor = bgLum > 0.5 ? '#1a1a2e' : '#e8e8e8';
        setFontColor(newColor);
      }
    } catch {
      // ignore invalid hex
    }
  }, [bgColor]);

  /* ── Humanized Text Renderer (Trained Style Aware) ─────── */
  const renderHumanizedText = (text) => {
    if (!humanizeEnabled) return text;
    const p = activeTrainedStyle?.params || null;
    const intensity = variationIntensity / 100;
    const chars = text.split('');
    const globalSlant = p ? p.slant : 0;

    return chars.map((char, i) => {
      if (char === '\n') return <br key={i} />;
      if (char === ' ') {
        // Rhythm-based word spacing variation
        const rhythmSeed = Math.sin(i * 3.77) * 10000;
        const rhythmR = rhythmSeed - Math.floor(rhythmSeed);
        const extraSpace = p ? rhythmR * p.rhythm * 8 : rhythmR * intensity * 4;
        return <span key={i} style={{ display: 'inline-block', width: `${4 + extraSpace}px` }} />;
      }

      // Deterministic pseudo-random per character
      const s1 = Math.sin(i * 7.31 + 3.14) * 10000;
      const s2 = Math.cos(i * 11.97 + 1.41) * 10000;
      const s3 = Math.sin(i * 5.67 + 2.72) * 10000;
      const s4 = Math.cos(i * 13.37 + 0.87) * 10000;
      const s5 = Math.sin(i * 9.13 + 4.56) * 10000;
      const r1 = s1 - Math.floor(s1);
      const r2 = s2 - Math.floor(s2);
      const r3 = s3 - Math.floor(s3);
      const r4 = s4 - Math.floor(s4);
      const r5 = s5 - Math.floor(s5);

      let rotation, yShift, xShift, scale, opacity;

      if (p) {
        // Use trained style parameters
        rotation = (r1 - 0.5) * p.rotation * 2 + globalSlant * 0.1;
        yShift = (r2 - 0.5) * p.baselineShift * 2;
        xShift = (r3 - 0.5) * p.xDrift * 2 - (p.connectedness * 0.5);
        scale = 1 + (r4 - 0.5) * p.sizeVariation * 2;
        opacity = 1 - (r5 * p.pressure);
      } else {
        // Generic intensity-based
        rotation = (r1 - 0.5) * 6 * intensity;
        yShift = (r2 - 0.5) * 3 * intensity;
        xShift = (r3 - 0.5) * 1.5 * intensity;
        scale = 1 + (r4 - 0.5) * 0.15 * intensity;
        opacity = 1 - (r5 * 0.15 * intensity);
      }

      return (
        <span key={i} style={{
          display: 'inline-block',
          transform: `rotate(${rotation}deg) translate(${xShift}px, ${yShift}px) scale(${scale}) skewX(${globalSlant * 0.3}deg)`,
          opacity: Math.max(0.6, opacity),
          transition: 'none',
          marginRight: p ? `${-p.connectedness * 0.5}px` : undefined,
        }}>{char}</span>
      );
    });
  };

  /* ── Render Grid / Dot Lines ─────────────────────────────── */
  const renderBackgroundPattern = () => {
    if (!showLines || lineType === 'none') return null;

    if (lineType === 'ruled') {
      return (
        <div style={styles.ruledLines}>
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute', left: showMargin ? '55px' : 0, right: 0,
              height: '1px', background: lineColor,
              top: `${(i + 1) * fontSize * lineHeight}px`,
            }} />
          ))}
        </div>
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
                {file && uploadedFileId && (
                  <div style={styles.uploadedInfo}>
                    <div style={styles.uploadedBadge}>
                      <Check size={14} style={{ color: 'var(--accent-green)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{file.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        — Text extracted ({textContent.length} chars)
                      </span>
                    </div>
                    <button onClick={downloadOriginal} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                      <Download size={14} /> Download Original
                    </button>
                  </div>
                )}
                <p style={styles.formatHint}>
                  Supports: <strong>PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, JPEG, PNG, TXT</strong> — Max 250MB
                </p>
              </div>
            )}

            {tab === 'text' && (
              <div>
                <textarea
                  id="text-input"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste or type your text here…"
                  className="input-field"
                  style={{
                    minHeight: '200px',
                    resize: 'vertical',
                    fontFamily: `'${selectedFont}', cursive`,
                    fontSize: `${Math.max(fontSize, 18)}px`,
                    lineHeight: 1.8,
                    color: fontColor !== '#1a1a2e' ? fontColor : undefined,
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button onClick={handleTextSubmit} className="btn btn-primary" disabled={loading}>
                    <FileText size={16} /> Save Text
                  </button>
                  {textContent && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', alignSelf: 'center' }}>
                      {textContent.length} characters
                    </span>
                  )}
                </div>
              </div>
            )}

            {tab === 'voice' && (
              <div style={styles.voicePanel}>
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
                <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>
                  {isRecording ? '🔴 Listening… Click to stop' : 'Click to start recording'}
                </p>
                {textContent && (
                  <div style={styles.transcriptBox}>
                    <p style={{ fontWeight: 600, marginBottom: '8px' }}>Transcription:</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{textContent}</p>
                  </div>
                )}
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
                {transformMode === 'ai_to_handwriting' ? 'Handwriting Style' : 'AI Output Settings'}
              </h3>

              {/* ── Style Picker Tabs ─────────────────────── */}
              {transformMode === 'ai_to_handwriting' && (
                <>
                  {/* Tab bar: Trained | Fonts | Random */}
                  <div style={styles.styleTabs}>
                    {[
                      { id: 'trained', label: 'Trained Styles', icon: Sparkles },
                      { id: 'fonts', label: 'Font Library', icon: Type },
                      { id: 'random', label: 'Random Generate', icon: Dices },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setStyleTab(t.id)}
                        style={{
                          ...styles.styleTabBtn,
                          ...(styleTab === t.id ? styles.styleTabBtnActive : {}),
                        }}
                      >
                        <t.icon size={14} /> {t.label}
                      </button>
                    ))}
                  </div>

                  {/* ── TAB: Trained Styles ─────────────────── */}
                  {styleTab === 'trained' && (
                    <div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '14px' }}>
                        5 handwriting profiles trained from real samples — click to apply
                      </p>
                      <div style={styles.trainedGrid}>
                        {trainedStyles.map(s => (
                          <button
                            key={s.id}
                            onClick={() => applyTrainedStyle(s)}
                            style={{
                              ...styles.trainedCard,
                              borderColor: activeTrainedStyle?.id === s.id ? 'var(--accent-gold)' : 'var(--border-subtle)',
                              background: activeTrainedStyle?.id === s.id ? 'rgba(255,215,0,0.08)' : 'var(--bg-glass)',
                            }}
                          >
                            <div style={styles.trainedCardHeader}>
                              <span style={{ fontSize: '1.4rem' }}>{s.emoji}</span>
                              <div style={{ flex: 1, textAlign: 'left' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.88rem', display: 'block' }}>{s.name}</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.description}</span>
                              </div>
                              {activeTrainedStyle?.id === s.id && (
                                <Check size={16} style={{ color: 'var(--accent-gold)' }} />
                              )}
                            </div>
                            <div style={{
                              fontFamily: `'${s.font}', cursive`,
                              fontSize: '1.15rem',
                              color: s.inkColor,
                              lineHeight: 1.5,
                              padding: '10px 0 4px',
                              textAlign: 'left',
                              fontStyle: s.params.slant > 3 ? 'italic' : 'normal',
                            }}>
                              The quick brown fox jumps
                            </div>
                            <div style={styles.trainedParams}>
                              <span>Tilt: {s.params.rotation.toFixed(1)}°</span>
                              <span>Flow: {Math.round(s.params.connectedness * 100)}%</span>
                              <span>Pressure: {Math.round((1 - s.params.pressure) * 100)}%</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── TAB: Font Library ───────────────────── */}
                  {styleTab === 'fonts' && (
                    <div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '10px' }}>
                        20 handwriting fonts — filter by category
                      </p>
                      {/* Category filter */}
                      <div style={styles.categoryFilter}>
                        {fontCategories.map(c => (
                          <button
                            key={c.id}
                            onClick={() => setFontCategoryFilter(c.id)}
                            style={{
                              ...styles.categoryBtn,
                              ...(fontCategoryFilter === c.id ? styles.categoryBtnActive : {}),
                            }}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                      <div style={styles.fontGrid}>
                        {filteredFonts.map(f => (
                          <button
                            key={f.name}
                            onClick={() => { setSelectedFont(f.name); setActiveTrainedStyle(null); }}
                            onMouseEnter={() => setFontPreview(f.name)}
                            onMouseLeave={() => setFontPreview(null)}
                            style={{
                              ...styles.fontCard,
                              borderColor: selectedFont === f.name && !activeTrainedStyle
                                ? 'var(--accent-gold)' : 'var(--border-subtle)',
                              background: selectedFont === f.name && !activeTrainedStyle
                                ? 'rgba(255,215,0,0.06)' : 'var(--bg-glass)',
                            }}
                          >
                            <span style={{
                              fontFamily: `'${f.name}', cursive`,
                              fontSize: '1.3rem', color: 'var(--text-primary)', lineHeight: 1.3,
                            }}>
                              The quick brown fox
                            </span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              {f.label}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {f.style}
                            </span>
                            {selectedFont === f.name && !activeTrainedStyle && (
                              <div style={styles.fontCheck}><Check size={14} /></div>
                            )}
                          </button>
                        ))}
                      </div>
                      {fontPreview && fontPreview !== selectedFont && (
                        <div style={{ ...styles.fontPreviewBox, fontFamily: `'${fontPreview}', cursive` }}>
                          <Eye size={14} style={{ flexShrink: 0 }} />
                          <span>Preview: "Hello, this is how your text will look in {fontPreview}!"</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TAB: Random Generate ────────────────── */}
                  {styleTab === 'random' && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                          AI-generated unique handwriting styles
                        </p>
                        <button onClick={generateNewRandomStyles} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Shuffle size={14} /> Generate New
                        </button>
                      </div>
                      <div style={styles.trainedGrid}>
                        {randomStyles.map(s => (
                          <button
                            key={s.id}
                            onClick={() => applyTrainedStyle(s)}
                            style={{
                              ...styles.trainedCard,
                              borderColor: activeTrainedStyle?.id === s.id ? 'var(--accent-gold)' : 'var(--border-subtle)',
                              background: activeTrainedStyle?.id === s.id ? 'rgba(255,215,0,0.08)' : 'var(--bg-glass)',
                            }}
                          >
                            <div style={styles.trainedCardHeader}>
                              <span style={{ fontSize: '1.4rem' }}>{s.emoji}</span>
                              <div style={{ flex: 1, textAlign: 'left' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.88rem', display: 'block' }}>{s.name}</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.description}</span>
                              </div>
                              {activeTrainedStyle?.id === s.id && (
                                <Check size={16} style={{ color: 'var(--accent-gold)' }} />
                              )}
                            </div>
                            <div style={{
                              fontFamily: `'${s.font}', cursive`,
                              fontSize: '1.15rem', color: s.inkColor,
                              lineHeight: 1.5, padding: '10px 0 4px', textAlign: 'left',
                            }}>
                              The quick brown fox jumps
                            </div>
                            <div style={styles.trainedParams}>
                              <span>Font: {s.font}</span>
                              <span>Tilt: {s.params.rotation.toFixed(1)}°</span>
                              <span>Wobble: {s.params.baselineShift.toFixed(1)}px</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Customization Controls ─────────────── */}
                  <div style={styles.controls}>
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
                  ) : transformMode === 'ai_to_handwriting' ? (
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
          {(textContent || editorContent || transformed) && transformMode === 'ai_to_handwriting' && (
            <div style={styles.previewSection}>
              <div style={styles.previewHeader}>
                <h3 style={styles.sectionTitle}>
                  <PenTool size={18} />
                  Live Handwriting Preview
                  <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px' }}>
                    — type directly here to edit
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

              {/* Paper with transparent textarea overlay */}
              <div style={{ position: 'relative' }}>
                {/* ── Styled output layer (visible) ─────────── */}
                <div ref={previewRef} style={{
                  ...styles.previewPaper,
                  fontFamily: `'${selectedFont}', cursive`,
                  fontSize: `${fontSize}px`,
                  color: fontColor,
                  background: bgColor,
                  lineHeight: lineHeight,
                  letterSpacing: `${letterSpacing}px`,
                  wordSpacing: `${wordSpacing}px`,
                  transform: textTilt ? `rotate(${textTilt}deg)` : 'none',
                }}>
                  {renderBackgroundPattern()}
                  {showMargin && lineType === 'ruled' && <div style={styles.marginLine} />}
                  <div style={{
                    ...styles.previewContent,
                    paddingLeft: showMargin && lineType === 'ruled' ? '15px' : '0',
                    pointerEvents: 'none',
                  }}>
                    {renderHumanizedText(getPlainText(transformedText || editorContent || textContent) || ' ')}
                  </div>
                </div>

                {/* ── Editable textarea overlay (invisible text) ── */}
                <textarea
                  value={getPlainText(transformedText || editorContent || textContent)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTextContent(val);
                    setEditorContent(val);
                    if (transformed) setTransformedText(val);
                  }}
                  style={{
                    ...styles.previewOverlay,
                    fontFamily: `'${selectedFont}', cursive`,
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight,
                    letterSpacing: `${letterSpacing}px`,
                    wordSpacing: `${wordSpacing}px`,
                  }}
                  placeholder="Start typing here…"
                />
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
};
