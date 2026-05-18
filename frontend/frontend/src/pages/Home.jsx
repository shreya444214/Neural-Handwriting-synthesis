import { Link } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import {
  PenTool, ScanText, MessageSquare, Shield,
  Upload, Cpu, Download, Share2,
  ArrowRight, Zap, Globe, Lock, Star, ChevronRight
} from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Home() {
  const glowRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (glowRef.current) {
        glowRef.current.style.left = e.clientX + 'px';
        glowRef.current.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div className="page-wrapper">
      {/* Cursor Glow */}
      <div ref={glowRef} style={styles.glow} />

      <Navbar />

      {/* ── Hero ── */}
      <section style={styles.hero}>
        <div style={styles.heroBadge}>
          <Zap size={14} /> <span>AI-Powered Handwriting Transformation</span>
        </div>
        <h1 style={styles.heroTitle}>
          Transform Digital Text Into
          <span style={styles.heroGradient}> Beautiful Handwriting</span>
        </h1>
        <p style={styles.heroSub}>
          Bridge the gap between digital efficiency and human touch. Convert any document, 
          speech, or text into personalized handwriting styles — or detect AI vs human writing instantly.
        </p>
        <div style={styles.heroCta}>
          <Link to="/register" className="btn btn-primary btn-lg">
            Get Started Free <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Login
          </Link>
        </div>

        {/* Stats */}
        <div style={styles.stats}>
          {[
            { num: '10K+', label: 'Transformations' },
            { num: '50+', label: 'Font Styles' },
            { num: '99.9%', label: 'Uptime' },
            { num: '4.9★', label: 'Rating' },
          ].map((s, i) => (
            <div key={i} style={styles.stat}>
              <span style={styles.statNum}>{s.num}</span>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Powerful Features</h2>
        <p style={styles.sectionSub}>Everything you need to transform, manage, and share handwriting content</p>
        <div className="grid-4" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          {features.map((f, i) => (
            <div key={i} style={styles.featureCard} className="card">
              <div style={{ ...styles.featureIcon, background: f.bg }}>
                <f.icon size={22} color={f.color} />
              </div>
              <h4 style={styles.featureTitle}>{f.title}</h4>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ ...styles.section, background: 'rgba(255,255,255,0.02)' }}>
        <h2 style={styles.sectionTitle}>How It Works</h2>
        <p style={styles.sectionSub}>Four simple steps to transform your content</p>
        <div style={styles.stepsGrid}>
          {steps.map((s, i) => (
            <div key={i} style={styles.stepCard}>
              <div style={styles.stepNum}>{i + 1}</div>
              <s.icon size={28} style={{ color: 'var(--accent-gold)', marginBottom: '12px' }} />
              <h4 style={styles.stepTitle}>{s.title}</h4>
              <p style={styles.stepDesc}>{s.desc}</p>
              {i < steps.length - 1 && (
                <ChevronRight size={20} style={styles.stepArrow} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Why Choose HandwritingAI?</h2>
        <div style={styles.whyGrid}>
          {whyItems.map((w, i) => (
            <div key={i} style={styles.whyCard}>
              <w.icon size={24} style={{ color: w.color }} />
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>{w.title}</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.55 }}>{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ ...styles.section, background: 'rgba(255,255,255,0.02)' }}>
        <h2 style={styles.sectionTitle}>What Users Say</h2>
        <div className="grid-3" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
          {testimonials.map((t, i) => (
            <div key={i} style={styles.testimonialCard}>
              <div style={styles.testimonialStars}>
                {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="var(--accent-gold)" color="var(--accent-gold)" />)}
              </div>
              <p style={styles.testimonialText}>"{t.text}"</p>
              <div style={styles.testimonialAuthor}>
                <div style={styles.testimonialAvatar}>{t.name.charAt(0)}</div>
                <div>
                  <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>{t.name}</p>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={styles.ctaSection}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Ready to Transform Your Writing?</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '16px auto' }}>
          Join thousands of users who trust HandwritingAI for their document transformation needs.
        </p>
        <Link to="/register" className="btn btn-primary btn-lg" style={{ marginTop: '12px' }}>
          Start Free Now <ArrowRight size={18} />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>✍️ Handwriting<span style={{ color: 'var(--accent-gold)' }}>AI</span></span>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '8px' }}>
              Transform text into beautiful handwriting
            </p>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link to="/register" style={styles.footerLink}>Sign Up</Link>
            <Link to="/login" style={styles.footerLink}>Login</Link>
            <a href="mailto:support@handwritingai.com" style={styles.footerLink}>Contact</a>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p>© 2026 HandwritingAI — All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Data ── */
const features = [
  { icon: ScanText, title: 'OCR Detection', desc: 'Extract text from handwritten images and scanned documents with high accuracy.', bg: 'rgba(99,140,255,0.12)', color: '#638cff' },
  { icon: PenTool, title: 'Handwriting Generator', desc: 'Convert typed text into realistic handwriting with multiple font styles.', bg: 'rgba(255,215,0,0.12)', color: '#ffd700' },
  { icon: MessageSquare, title: 'Chat & Share', desc: 'Chat with peers, create groups, and share transformed files in real-time.', bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
  { icon: Shield, title: 'AI Detection', desc: 'Detect whether writing is human or AI-generated with confidence scoring.', bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
  { icon: Globe, title: 'Multi-language', desc: 'Support for 20+ languages with custom font presets and RTL scripts.', bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
  { icon: Zap, title: 'Instant Processing', desc: 'Transform documents in seconds with our optimized processing engine.', bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
  { icon: Lock, title: 'Secure Storage', desc: 'End-to-end encryption ensures your documents stay private and safe.', bg: 'rgba(99,140,255,0.12)', color: '#638cff' },
  { icon: Download, title: 'Export Anywhere', desc: 'Download results as PDF, PNG, or DOC — ready for print or digital use.', bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
];

const steps = [
  { icon: Upload, title: 'Upload', desc: 'Upload any PDF, DOC, image, or paste text directly' },
  { icon: Cpu, title: 'Process', desc: 'Our AI analyzes and transforms your content' },
  { icon: PenTool, title: 'Customize', desc: 'Choose font style, size, color, and layout' },
  { icon: Download, title: 'Download', desc: 'Export as PDF/PNG or share via chat' },
];

const whyItems = [
  { icon: Zap, title: 'Lightning Fast', desc: 'Transform documents in under 3 seconds with our optimized engine.', color: '#fbbf24' },
  { icon: Shield, title: 'Enterprise Security', desc: 'AES-256 encryption, role-based access, and complete audit trails.', color: '#34d399' },
  { icon: Globe, title: 'Works Everywhere', desc: 'Access from any device — desktop, tablet, or mobile. No installs needed.', color: '#638cff' },
  { icon: Star, title: 'Premium Quality', desc: 'Human-like output that passes authenticity checks every time.', color: '#a78bfa' },
];

const testimonials = [
  { name: 'Dr. Emily Carter', role: 'Educator & Researcher', text: 'HandwritingAI revolutionized how I digitize manuscripts. The accuracy and multilingual support are incredible.' },
  { name: 'Michael Torres', role: 'Legal Consultant', text: 'In legal work, authenticity matters. This tool gives us the confidence we need for court documents.' },
  { name: 'Sarah Kim', role: 'Graphic Designer', text: 'Creating personalized handwritten notes for clients has never been easier. The font styles are fantastic.' },
];

/* ── Styles ── */
const styles = {
  glow: {
    position: 'fixed', width: '400px', height: '400px',
    background: 'radial-gradient(circle, rgba(99,140,255,0.12), transparent 70%)',
    borderRadius: '50%', pointerEvents: 'none',
    transform: 'translate(-50%, -50%)', mixBlendMode: 'screen', zIndex: 0,
  },
  hero: {
    textAlign: 'center', padding: '100px 20px 60px',
    maxWidth: '900px', margin: '0 auto', position: 'relative',
  },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '6px 16px', borderRadius: 'var(--radius-full)',
    background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
    color: 'var(--accent-gold)', fontSize: '0.82rem', fontWeight: 600, marginBottom: '28px',
  },
  heroTitle: {
    fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900,
    lineHeight: 1.15, letterSpacing: '-1px', marginBottom: '20px',
  },
  heroGradient: {
    background: 'linear-gradient(135deg, #ffd700 0%, #ff9900 50%, #ffd700 100%)',
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    animation: 'gradientShift 4s ease infinite',
  },
  heroSub: {
    fontSize: '1.1rem', color: 'var(--text-secondary)',
    lineHeight: 1.65, maxWidth: '700px', margin: '0 auto 32px',
  },
  heroCta: { display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' },
  stats: {
    display: 'flex', gap: '40px', justifyContent: 'center',
    marginTop: '60px', flexWrap: 'wrap',
  },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statNum: { fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-gold)' },
  statLabel: { fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' },
  section: { padding: '80px 20px', position: 'relative' },
  sectionTitle: {
    textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '12px',
  },
  sectionSub: {
    textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '48px',
    maxWidth: '600px', margin: '0 auto 48px',
  },
  featureCard: {
    padding: '28px', textAlign: 'left', cursor: 'default',
  },
  featureIcon: {
    width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '16px',
  },
  featureTitle: { fontSize: '1rem', fontWeight: 700, margin: '0 0 8px' },
  featureDesc: { fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 },
  stepsGrid: {
    display: 'flex', gap: '24px', justifyContent: 'center',
    maxWidth: '1000px', margin: '0 auto', flexWrap: 'wrap', padding: '0 20px',
  },
  stepCard: {
    flex: '1 1 200px', maxWidth: '240px', textAlign: 'center',
    padding: '28px 20px', background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)',
    position: 'relative',
  },
  stepNum: {
    position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
    width: '28px', height: '28px', borderRadius: '50%', fontWeight: 800,
    background: 'var(--gradient-gold)', color: '#0a0a0a', fontSize: '0.78rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  stepTitle: { fontSize: '1rem', fontWeight: 700, margin: '0 0 6px' },
  stepDesc: { fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 },
  stepArrow: {
    position: 'absolute', right: '-22px', top: '50%', transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
  },
  whyGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px',
    maxWidth: '900px', margin: '0 auto', padding: '0 20px',
  },
  whyCard: {
    display: 'flex', gap: '16px', padding: '24px',
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
  },
  testimonialCard: {
    padding: '28px', background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)',
    display: 'flex', flexDirection: 'column', gap: '16px',
  },
  testimonialStars: { display: 'flex', gap: '3px' },
  testimonialText: {
    fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6,
    fontStyle: 'italic', flex: 1, margin: 0,
  },
  testimonialAuthor: { display: 'flex', alignItems: 'center', gap: '12px' },
  testimonialAvatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'var(--gradient-blue)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, color: 'white', fontSize: '0.85rem',
  },
  ctaSection: {
    textAlign: 'center', padding: '80px 20px',
    background: 'linear-gradient(135deg, rgba(99,140,255,0.06) 0%, rgba(255,215,0,0.06) 100%)',
    borderTop: '1px solid var(--border-subtle)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  footer: {
    padding: '0 20px', borderTop: '1px solid var(--border-subtle)',
  },
  footerInner: {
    maxWidth: '1200px', margin: '0 auto', padding: '40px 0',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: '20px',
  },
  footerLink: {
    color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none',
  },
  footerBottom: {
    borderTop: '1px solid var(--border-subtle)', padding: '20px 0',
    textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem',
    maxWidth: '1200px', margin: '0 auto',
  },
};