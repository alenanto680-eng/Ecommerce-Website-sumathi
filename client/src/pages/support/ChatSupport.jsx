import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import '../../styles/support/ChatSupport.css';

const STEP = {
  INIT: 'init',
  WAIT_PRODUCT: 'wait_product', // Added for multi-item orders
  WAIT_ISSUE: 'wait_issue',
  WAIT_MEDIA: 'wait_media',
  DONE: 'done',
};

function TypingIndicator() {
  return (
    <div className="cs-msg cs-msg--bot">
      <div className="cs-avatar">ST</div>
      <div className="cs-bubble cs-bubble--typing">
        <span /><span /><span />
      </div>
    </div>
  );
}

export default function ChatSupport() {
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const order    = location.state?.order || null;

  const userId = order?.userId || localStorage.getItem('sumathi_uid') || 'guest';
  const sessionKey = `chat_history_${userId}_${order?._id || order?.displayId || 'no-order'}`;

  const [activeNav,    setActiveNav]    = useState('');
  const [activeSubNav, setActiveSubNav] = useState('support');
  const [messages,     setMessages]     = useState([]);
  const [step,         setStep]         = useState(STEP.INIT);
  const [input,        setInput]        = useState('');
  const [typing,       setTyping]       = useState(false);
  const [mediaFiles,   setMediaFiles]   = useState([]);
  const [showEnded,    setShowEnded]    = useState(false);

  const bottomRef  = useRef(null);
  const fileRef    = useRef(null);
  const initiated  = useRef(false);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, typing, showEnded]);

  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;

    // ✅ Restore chat history from localStorage
    const saved = localStorage.getItem(sessionKey);
    if (saved) {
      try {
        const { messages: savedMsgs, step: savedStep } = JSON.parse(saved);
        setMessages(savedMsgs);
        setStep(savedStep || STEP.DONE);
        setShowEnded(savedStep === STEP.DONE);
        if (savedStep !== STEP.DONE && savedMsgs.length > 0) {
            // If it wasn't done, we might want to resume or see where we left off
            // For now, if messages exist, we don't run the intro again unless it's empty
        } else if (savedStep === STEP.DONE) {
            // Already ended, just show history
            return;
        }
        if (savedMsgs.length > 0) return;
      } catch (_) {}
    }

    runIntroFlow([]);
  }, []);

  // ✅ Auto-Heal Chat History: Fetch actual image/video URLs from server if they exist
  useEffect(() => {
    if (order?.displayId) {
      fetch(`/api/support/order/${order.displayId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.length > 0) {
            setMessages(prev => {
              let updated = false;
              const next = prev.map(msg => {
                if (msg.from === 'user' && msg.mediaFiles?.some(mf => mf.isBlob)) {
                  // Find matching issue from server based on description or proximity
                  // For simplicity, we match the attachments found for this order
                  const allServerAttachments = data.data.flatMap(issue => issue.attachments || []);
                  
                  const healedMedia = msg.mediaFiles.map(mf => {
                    if (mf.isBlob) {
                      // Try to find a server attachment with same type
                      const match = allServerAttachments.find(sa => sa.fileType === mf.type);
                      if (match) {
                        updated = true;
                        return { ...mf, url: match.url, isBlob: false };
                      }
                    }
                    return mf;
                  });
                  return { ...msg, mediaFiles: healedMedia };
                }
                return msg;
              });
              
              if (updated) {
                localStorage.setItem(sessionKey, JSON.stringify({ messages: next, step: step }));
                return next;
              }
              return prev;
            });
          }
        })
        .catch(err => console.error("History heal failed:", err));
    }
  }, [order?.displayId]);

  const runIntroFlow = (existingMessages = []) => {
    const orderMsg = order
      ? `Hi, I need help with a recent order. #${order.displayId}`
      : 'Hi, I need help with a recent order.';

    setTimeout(() => {
      const next = [...existingMessages, { from: 'user', text: orderMsg, time: now() }];
      setMessages(next);
      localStorage.setItem(sessionKey, JSON.stringify({ messages: next, step: STEP.INIT }));
    }, 400);

    setTimeout(() => setTyping(true), 1000);

    setTimeout(() => {
      setTyping(false);
      const isMulti = order && order.items && order.items.length > 1;

      setMessages(prev => {
        const next = [...prev, {
          from: 'bot',
          text: `Thanks for reaching out! I can see your order${order ? ` #${order.displayId}` : ''}. ${isMulti ? 'Which product are you facing an issue with?' : 'Could you please describe the issue you\'re facing?'}`,
          type: isMulti ? 'product_selection' : 'text',
          products: isMulti ? order.items : [],
          time: now(),
        }];
        const nextStep = isMulti ? STEP.WAIT_PRODUCT : STEP.WAIT_ISSUE;
        localStorage.setItem(sessionKey, JSON.stringify({ messages: next, step: nextStep }));
        setStep(nextStep);
        return next;
      });
    }, 2600);
  };

  function handleProductSelect(product) {
    if (step !== STEP.WAIT_PRODUCT) return;

    const userMsg = { from: 'user', text: `I have an issue with: ${product.name}`, time: now() };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const botMsg = { 
        from: 'bot', 
        text: `Got it. Please describe the issue with your ${product.name}.`, 
        time: now() 
      };
      const finalMsgs = [...nextMsgs, botMsg];
      setMessages(finalMsgs);
      setStep(STEP.WAIT_ISSUE);
      localStorage.setItem(sessionKey, JSON.stringify({ messages: finalMsgs, step: STEP.WAIT_ISSUE }));
    }, 1200);
  }

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function botReply(text, delay = 1800, onDone) {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { from: 'bot', text, time: now() }]);
      if (onDone) onDone();
    }, delay);
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (step === STEP.WAIT_MEDIA) {
      if (mediaFiles.length === 0) return;
      
      const newMsg = { 
        from: 'user', 
        text: trimmed || '', 
        mediaFiles: mediaFiles.map(mf => ({
          type: mf.type,
          name: mf.name,
          url: mf.url,
          isBlob: mf.url.startsWith('blob:')
        })), 
        time: now() 
      };
      setMessages(prev => [...prev, newMsg]);
      setInput('');

      // ✅ SUBMIT TO BACKEND
      const formData = new FormData();
      formData.append('userId', order?.userId || localStorage.getItem('sumathi_uid'));
      formData.append('orderId', order?.displayId || 'N/A');
      
      // Combine all user messages (except initial greeting) into one description
      const userDescs = messages
        .filter(m => m.from === 'user' && m.text && !m.text.startsWith('Hi,'))
        .map(m => m.text);
      if (trimmed) userDescs.push(trimmed);
      formData.append('description', userDescs.join('\n') || 'Chat Support Request');
      
      mediaFiles.forEach(mf => {
        if (mf.file) formData.append('attachments', mf.file);
      });

      try {
        await fetch('/api/support/submit', { method: 'POST', body: formData });
      } catch (err) {
        console.error("ChatSupport: Submit failed", err);
      }

      setMediaFiles([]);
      const ta = document.querySelector('.cs-input');
      if (ta) ta.style.height = 'auto';
      
      botReply(
        "We've received your details. Our support team will shortly call you to resolve this. Thank you for your patience! 😊",
        2000,
        () => {
          setStep(STEP.DONE);
          setTimeout(() => {
            setMessages(prev => {
              const next = [...prev, { type: 'system', text: '— Chat Ended —', time: now() }];
              localStorage.setItem(sessionKey, JSON.stringify({ messages: next, step: STEP.DONE }));
              return next;
            });
            setShowEnded(true);
          }, 400);
        }
      );
    } else {
      if (!trimmed) return;
      const newMsg = { from: 'user', text: trimmed, time: now() };
      setMessages(prev => {
        const next = [...prev, newMsg];
        localStorage.setItem(sessionKey, JSON.stringify({ messages: next, step: step }));
        return next;
      });
      setInput('');
      const ta = document.querySelector('.cs-input');
      if (ta) ta.style.height = 'auto';
      if (step === STEP.WAIT_ISSUE) {
        botReply("Thank you for letting us know. Could you please share any photos or videos related to the issue?", 1800, () => {
             setMessages(prev => {
                localStorage.setItem(sessionKey, JSON.stringify({ messages: prev, step: STEP.WAIT_MEDIA }));
                return prev;
             });
             setStep(STEP.WAIT_MEDIA);
        });
      }
    }
  }

  function handleRestartChat() {
    setShowEnded(false);
    setStep(STEP.INIT);
    runIntroFlow(messages);
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files);
    setMediaFiles(prev => {
      const images = prev.filter(f => f.type === 'image');
      const videos = prev.filter(f => f.type === 'video');
      const newItems = [];
      files.forEach(f => {
        const isVideo = f.type.startsWith('video/');
        if (isVideo && videos.length + newItems.filter(x => x.type === 'video').length < 2) {
          newItems.push({ file: f, url: URL.createObjectURL(f), type: 'video', name: f.name });
        } else if (!isVideo && images.length + newItems.filter(x => x.type === 'image').length < 4) {
          newItems.push({ file: f, url: URL.createObjectURL(f), type: 'image', name: f.name });
        }
      });
      return [...prev, ...newItems];
    });
    e.target.value = '';
  }

  function removeMedia(idx) {
    setMediaFiles(prev => prev.filter((_, i) => i !== idx));
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleInput(e) {
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    setInput(ta.value);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const imgCount   = mediaFiles.filter(f => f.type === 'image').length;
  const vidCount   = mediaFiles.filter(f => f.type === 'video').length;
  const canAddMore = imgCount < 4 || vidCount < 2;

  return (
    <div className="sh-page cs-page">
      <div className="sh-container cs-container">
        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          activeSubNav={activeSubNav}
          setActiveSubNav={setActiveSubNav}
        />

        <main className="cs-main-wrapper">
          <div className="cs-chat-wrap">

            <div className="cs-chat-header">
              <button className="mobile-back-btn" onClick={() => navigate('/support')}>
                <span className="back-chevron">
                  <svg width="24" height="24" viewBox="1.5 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </span>
              </button>
              <div className="cs-header-avatar">ST</div>
              <div className="cs-header-info">
                <div className="cs-header-name">Sumathi Trends Support</div>
                <div className="cs-header-status"><span className="cs-online-dot" /> Online</div>
              </div>
              <button className="cs-header-close" onClick={() => navigate(-1)}>✕</button>
            </div>

            <div className="cs-messages">
              {messages.map((msg, i) => {
                if (msg.type === 'system') {
                  return <div key={i} className="cs-ended-inline">{msg.text}</div>;
                }
                return (
                  <div key={i} className={`cs-msg cs-msg--${msg.from}`}>
                    {msg.from === 'bot' && <div className="cs-avatar">ST</div>}
                    <div className={`cs-bubble cs-bubble--${msg.from}`}>
                      {msg.from === 'bot' && <div className="cs-sender">SUPPORT BOT</div>}
                      {msg.text && <p>{msg.text}</p>}
                      
                      {/* Product Selection Component */}
                      {msg.type === 'product_selection' && i === messages.length - 1 && step === STEP.WAIT_PRODUCT && (
                        <div className="cs-product-selector">
                          {msg.products.map((p, pidx) => (
                            <div key={pidx} className="cs-product-option" onClick={() => handleProductSelect(p)}>
                              <img src={p.img || p.photo || '/images/placeholder.png'} alt="" className="cs-p-opt-img" />
                              <div className="cs-p-opt-info">
                                <div className="cs-p-opt-name">{p.name}</div>
                                <div className="cs-p-opt-size">{p.size ? `Size: ${p.size}` : ''}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.mediaFiles && msg.mediaFiles.length > 0 && (
                        <div className="cs-media-grid">
                          {msg.mediaFiles.map((mf, mi) => {
                            const isExpiredBlob = mf.isBlob && !mf.url.startsWith('blob:'); // This check is tricky since mf.url IS the blob string
                            // Better check: If it's a blob and we are in a new session (not just created)
                            // Actually, simply: all blobs in saved history are expired.
                            
                            if (mf.isBlob) {
                              return (
                                <div key={mi} className="cs-media-placeholder">
                                  <div className="cs-placeholder-icon">{mf.type === 'video' ? '🎬' : '🖼️'}</div>
                                  <div className="cs-placeholder-name">{mf.name || 'File Attached'}</div>
                                </div>
                              );
                            }

                            return mf.type === 'video'
                              ? <video key={mi} src={mf.url} className="cs-media-preview" controls />
                              : <img key={mi} src={mf.url} alt="attachment" className="cs-media-preview" />;
                          })}
                        </div>
                      )}
                      <div className="cs-time">{msg.time}</div>
                    </div>
                  </div>
                );
              })}
              {typing && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            <div className="cs-input-area">
              {step === STEP.DONE ? (
                <div className="cs-restart-wrap">
                  <button className="cs-restart-btn" onClick={handleRestartChat}>
                    RESTART CHAT
                  </button>
                  <p className="cs-restart-note">Click above to start a new support request for this order.</p>
                </div>
              ) : (
                <>
                  {mediaFiles.length > 0 && (
                    <div className="cs-media-thumbs">
                      {mediaFiles.map((mf, i) => (
                        <div key={i} className="cs-media-thumb-wrap">
                          {mf.type === 'video'
                            ? <div className="cs-media-thumb cs-media-thumb--video">🎬<span>{mf.name}</span></div>
                            : <img src={mf.url} alt="" className="cs-media-thumb" />
                          }
                          <button className="cs-remove-media" onClick={() => removeMedia(i)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="cs-input-row">
                    <button
                      className={`cs-attach-btn ${step === STEP.WAIT_MEDIA ? 'cs-attach-btn--active' : ''}`}
                      onClick={() => step === STEP.WAIT_MEDIA && canAddMore && fileRef.current?.click()}
                      title={step === STEP.WAIT_MEDIA ? `Add files (${imgCount}/4 images, ${vidCount}/2 videos)` : 'Available after describing your issue'}
                      disabled={step !== STEP.WAIT_MEDIA || !canAddMore}
                    >
                      <img src="/images/chat/attach.png" alt="attach" style={{width:32,height:32,objectFit:"contain"}} />
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFiles}
                      hidden
                    />
                    <textarea
                      className="cs-input"
                      rows={1}
                      placeholder={step === STEP.WAIT_MEDIA ? 'Add files using the button…' : 'Type your message…'}
                      value={input}
                      onChange={handleInput}
                      onKeyDown={handleKey}
                      disabled={step === STEP.WAIT_MEDIA}
                    />
                    <button
                      className="cs-send-btn"
                      onClick={handleSend}
                      disabled={step === STEP.WAIT_MEDIA ? mediaFiles.length === 0 : !input.trim()}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                      </svg>
                    </button>
                  </div>
                  <div className="cs-secure-note">🔒 Secure and encrypted connection</div>
                </>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
