import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const botResponses = {
  '/help': "Here's what I can help with:\n• /howto — How to transform text\n• /trained — 5 trained handwriting styles\n• /random — Random style generator\n• /fonts — Browse 20 handwriting fonts\n• /humanize — Natural handwriting mode\n• /features — App features overview\n• /upload — How to upload files\n• /chat — Using the chat room\n• /shortcuts — Keyboard shortcuts\nOr just type your question!",
  
  '/howto': "📝 How to Transform Text:\n1. Go to Transform page\n2. Upload a file OR paste text\n3. Choose a style from 3 tabs:\n   • Trained Styles — 5 pre-built profiles\n   • Font Library — 20 Google Fonts\n   • Random Generate — unique AI styles\n4. Your text input updates to that font live\n5. Enable 'Natural Handwriting Mode' for variations\n6. Click 'Transform to Handwriting'\n7. Preview and download as PDF/PNG",
  
  '/trained': "🎯 5 Trained Handwriting Styles:\n\n✏️ Clean Print — Neat & readable (Patrick Hand)\n🖊️ Flowing Cursive — Elegant connected script\n🖋️ Blue Ink Calligraphy — Classic student style\n📝 Casual Scrawl — Quick messy notes\n📜 Vintage Letter — Old-fashioned ink pen\n\nEach style has unique parameters for tilt, baseline, pressure, and connectedness trained from real handwriting samples!",
  
  '/random': "🎲 Random Style Generator:\n\nClick 'Random Generate' tab and then 'Generate New' to create 4 brand new unique handwriting styles every time!\n\nEach random style gets:\n• A unique creative name\n• Random font + ink color\n• Unique tilt, wobble, and pressure\n• Different connectedness & rhythm\n\nLike a style? Click it to apply. Want more? Hit 'Generate New' for fresh options!",
  
  '/fonts': "✍️ 20 Handwriting Fonts:\n\n📂 Casual: Caveat, Indie Flower, Kalam, Coming Soon\n📂 Cursive: Dancing Script, Sacramento, Satisfy, La Belle Aurore, Cedarville Cursive\n📂 Artistic: Shadows Into Light, Gochi Hand, Rock Salt, Homemade Apple\n📂 Neat: Patrick Hand, Architects Daughter, Handlee\n📂 Messy: Just Another Hand, Loved by the King, Nothing You Could Do, Reenie Beanie\n\nUse the category filter to browse by style!",
  
  '/humanize': "✨ Natural Handwriting Mode:\nAdds realistic imperfections to make text look genuinely handwritten:\n• Slight character rotation\n• Baseline shifts (natural wobble)\n• Size variations per character\n• Ink pressure changes (opacity)\n• Rhythm-based spacing\n• Italic slant (skew)\n\n🎚️ Use the 'Variation Intensity' slider (0-100%) to control the effect.\nWorks with ALL styles — trained, font library, and random!",
  
  '/features': "✨ App Features:\n• 5 Trained handwriting profiles from real samples\n• Random handwriting style generator\n• 20 Google Font handwriting styles\n• Per-character variation engine (tilt, wobble, pressure)\n• Live font preview in text input\n• AI-to-Handwriting + Handwriting-to-AI modes\n• Voice input & Camera OCR\n• Upload: PDF, DOC, XLSX, PPT, JPG, PNG, TXT\n• Dashboard with file management\n• Download as PDF/PNG\n• Real-time chat rooms",
  
  '/upload': "📤 Upload Guide:\n• Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, JPEG, PNG, TXT\n• Max file size: 250MB\n• Drag & drop or click to browse\n• Text is automatically extracted (OCR for images)\n• JPG/PNG files use Tesseract OCR for handwriting recognition\n• Click 'View' on any file in Dashboard to open it in Transform Studio",
  
  '/chat': "💬 Chat Room:\n• Find users by name/username\n• Start individual or group chats\n• Share transformed files directly\n• Real-time messaging\n• File sharing in conversations",
  
  '/settings': "⚙️ Settings:\n• Change password\n• Update email/phone\n• Toggle dark/light theme\n• Notification preferences\n• Delete account option",
  
  '/shortcuts': "⌨️ Shortcuts in Editor:\n• Ctrl+B — Bold\n• Ctrl+I — Italic\n• Ctrl+U — Underline\n• Ctrl+Z — Undo\n• Ctrl+Y — Redo\n• Ctrl+Shift+L — Bullet list",
  
  '/presets': "🖊️ Realistic Pen Presets Guide:\n\nOur editor simulates the physical flow of different inks:\n• Ballpoint Pen: Finely balanced (0.9mm) with standard pressure. Perfect for general writing.\n• Gel Pen: Rich, dark flow (1.25mm) with slightly tighter character connections and bleed.\n• Fountain Pen: Elegant thick-thin strokes (1.6mm) with realistic pressure variation (20%) and higher ink absorption/bleed into the paper fibers.\n\nChoose your pen Preset in the Handwriting Style panel to instantly change ink behavior!",
  
  '/print': "🖨️ Printing & Export Optimization Tips:\n\nTo make your assignments look 100% human-written after printing:\n1. Use Cream Ruled Paper: Choose the 'Lined Cream' background preset. The yellow/cream hue blends beautifully when printed.\n2. Fine-tune Jitter: Enable 'Natural Handwriting Mode' at ~65% intensity. This adds realistic hand-tremors, slant drift, and character spacing variations.\n3. Print Settings: Print in color at 600 DPI if possible. High DPI ensures the subtle ink bleed filter contours look soft and realistic, not pixelated.\n4. PDF Export: Click the 'PDF' button to download a high-res vector-embedded multi-page document.",
};

function getBotReply(msg) {
  const lower = msg.toLowerCase().trim();
  
  if (botResponses[lower]) return botResponses[lower];
  
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hello! 👋 I'm your Handwriting AI assistant. Type /help to see what I can do, or try /fonts to browse 20 handwriting styles!";
  }
  if (lower.includes('font') || lower.includes('style') || lower.includes('handwriting')) {
    if (lower.includes('train')) return botResponses['/trained'];
    if (lower.includes('random') || lower.includes('generat')) return botResponses['/random'];
    return botResponses['/fonts'];
  }
  if (lower.includes('train')) {
    return botResponses['/trained'];
  }
  if (lower.includes('random') || lower.includes('generat') || lower.includes('dice') || lower.includes('shuffle')) {
    return botResponses['/random'];
  }
  if (lower.includes('humaniz') || lower.includes('natural') || lower.includes('variation') || lower.includes('realistic')) {
    return botResponses['/humanize'];
  }
  if (lower.includes('transform') || lower.includes('convert')) {
    return botResponses['/howto'];
  }
  if (lower.includes('upload') || lower.includes('file') || lower.includes('jpg') || lower.includes('image') || lower.includes('photo')) {
    return botResponses['/upload'];
  }
  if (lower.includes('chat') || lower.includes('message')) {
    return botResponses['/chat'];
  }
  if (lower.includes('feature')) {
    return botResponses['/features'];
  }
  if (lower.includes('preset') || lower.includes('pen') || lower.includes('ink') || lower.includes('ballpoint') || lower.includes('gel') || lower.includes('fountain')) {
    return botResponses['/presets'];
  }
  if (lower.includes('print') || lower.includes('export') || lower.includes('paper') || lower.includes('optimiz')) {
    return botResponses['/print'];
  }
  if (lower.includes('thank')) {
    return "You're welcome! 😊 Let me know if you need anything else.";
  }
  if (lower.includes('download') || lower.includes('pdf') || lower.includes('png')) {
    return "📥 After transforming, use the buttons above the preview:\n• PDF — generates a proper multi-page PDF\n• PNG — high-res image export\n• Original File — download your uploaded file\n• Copy — copy text to clipboard";
  }
  
  return "I'm not sure about that. Try:\n• /help — see all commands\n• /fonts — browse 20 handwriting styles\n• /humanize — learn about natural writing mode\n• /presets — read about realistic pen presets\n• /print — printing & export tips\n• Or ask about uploading, transforming, or features!";
}

export default function ChatBot() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      from: 'bot', 
      text: "Hi! 👋 I'm your Handwriting AI assistant. Click one of the quick guides below or type a question to get started!",
      isWelcome: true 
    }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isAuthenticated) return null;

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const reply = getBotReply(userMsg.text);
      setMessages(prev => [...prev, { from: 'bot', text: reply }]);
    }, 500);
  };

  const handleQuickCommand = (cmdText, label) => {
    const userMsg = { from: 'user', text: label };
    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      const reply = getBotReply(cmdText);
      setMessages(prev => [...prev, { from: 'bot', text: reply }]);
    }, 450);
  };

  return (
    <>
      {/* Toggle Button */}
      {!open && (
        <button onClick={() => setOpen(true)} style={styles.fab}>
          <MessageSquare size={22} />
          <span style={styles.fabBadge} />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div style={styles.window}>
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <Bot size={20} />
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>AI Assistant</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--accent-green)', margin: 0 }}>● Online</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={styles.closeBtn}>
              <X size={18} />
            </button>
          </div>

          <div style={styles.body}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                ...styles.msgRow,
                justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {msg.from === 'bot' && (
                  <div style={styles.botAvatar}><Bot size={14} /></div>
                )}
                <div style={{
                  ...styles.bubble,
                  ...(msg.from === 'user' ? styles.userBubble : styles.botBubble),
                }}>
                  {msg.text.split('\n').map((line, j) => (
                    <span key={j}>{line}<br /></span>
                  ))}
                  {msg.isWelcome && (
                    <div style={styles.quickChipsContainer}>
                      {[
                        { label: '💡 Cloning Guide', cmd: '/howto' },
                        { label: '🖊️ Pen Presets Info', cmd: '/presets' },
                        { label: '💬 Chat Rooms', cmd: '/chat' },
                        { label: '📥 Printing Tips', cmd: '/print' },
                      ].map(chip => (
                        <button
                          key={chip.cmd}
                          onClick={() => handleQuickCommand(chip.cmd, chip.label)}
                          style={styles.quickChip}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div style={styles.inputArea}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Type /help or ask a question..."
              style={styles.input}
            />
            <button onClick={send} style={styles.sendBtn}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  fab: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'var(--gradient-gold)',
    border: 'none',
    color: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(255, 215, 0, 0.3)',
    cursor: 'pointer',
    zIndex: 9999,
    transition: 'transform 0.2s',
  },
  fabBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'var(--accent-green)',
    border: '2px solid #0a0a0a',
  },
  window: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '380px',
    height: '520px',
    background: 'rgba(15, 18, 36, 0.82)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35), 0 0 30px rgba(99, 102, 241, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 9999,
    animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'rgba(0,0,0,0.3)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  msgRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
  },
  botAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'var(--gradient-blue)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'white',
  },
  bubble: {
    maxWidth: '80%',
    padding: '10px 14px',
    borderRadius: '14px',
    fontSize: '0.84rem',
    lineHeight: '1.5',
  },
  botBubble: {
    background: 'rgba(255,255,255,0.06)',
    borderBottomLeftRadius: '4px',
    color: 'var(--text-primary)',
  },
  userBubble: {
    background: 'rgba(99, 140, 255, 0.2)',
    borderBottomRightRadius: '4px',
    color: 'var(--text-primary)',
  },
  inputArea: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    borderTop: '1px solid var(--border-subtle)',
    background: 'rgba(0,0,0,0.2)',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-full)',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    outline: 'none',
  },
  sendBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'var(--gradient-gold)',
    border: 'none',
    color: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  quickChipsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '12px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
  quickChip: {
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    background: 'rgba(255, 215, 0, 0.06)',
    color: 'var(--accent-gold)',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};
