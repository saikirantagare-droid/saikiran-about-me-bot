import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";

function NeuralBackground3D() {
  const mountRef = useRef(null);
  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 60;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Particle field
    const COUNT = 220;
    const positions = new Float32Array(COUNT * 3);
    const velocities = [];
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 140;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 140;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      velocities.push({
        x: (Math.random() - 0.5) * 0.05,
        y: (Math.random() - 0.5) * 0.05,
        z: (Math.random() - 0.5) * 0.05,
      });
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xa78bfa,
      size: 1.1,
      transparent: true,
      opacity: 0.85,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Connecting lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x5eead4,
      transparent: true,
      opacity: 0.18,
    });
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(COUNT * COUNT * 3 * 2);
    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineSegments);

    let animId;
    let t = 0;
    function animate() {
      t += 0.0025;
      const posAttr = geometry.attributes.position;
      for (let i = 0; i < COUNT; i++) {
        posAttr.array[i * 3] += velocities[i].x;
        posAttr.array[i * 3 + 1] += velocities[i].y;
        posAttr.array[i * 3 + 2] += velocities[i].z;
        for (const axis of [0, 1, 2]) {
          const bound = axis === 2 ? 40 : 70;
          if (Math.abs(posAttr.array[i * 3 + axis]) > bound) velocities[i][["x","y","z"][axis]] *= -1;
        }
      }
      posAttr.needsUpdate = true;

      // rebuild connecting lines (limited radius for perf)
      let idx = 0;
      const maxDist = 18;
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = posAttr.array[i*3] - posAttr.array[j*3];
          const dy = posAttr.array[i*3+1] - posAttr.array[j*3+1];
          const dz = posAttr.array[i*3+2] - posAttr.array[j*3+2];
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (dist < maxDist && idx < linePositions.length - 6) {
            linePositions[idx++] = posAttr.array[i*3];
            linePositions[idx++] = posAttr.array[i*3+1];
            linePositions[idx++] = posAttr.array[i*3+2];
            linePositions[idx++] = posAttr.array[j*3];
            linePositions[idx++] = posAttr.array[j*3+1];
            linePositions[idx++] = posAttr.array[j*3+2];
          }
        }
      }
      lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions.slice(0, idx), 3));

      scene.rotation.y = Math.sin(t) * 0.15 + t * 0.05;
      scene.rotation.x = Math.cos(t * 0.7) * 0.08;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      mount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, []);
  return <div ref={mountRef} style={styles.neuralCanvas} />;
}

const ABOUT_ME = `
Name: Saikiran Tagare Shankar
Location: Hyderabad, India
Background: MSc Data Science from Cardiff Metropolitan University, UK. B.E. Mechanical Engineering from TKR College, JNTUH, Hyderabad. Spent 4 years in the UK, worked as a Data and Operations Analyst at A2Z Drinks Ltd, where he grew daily sales revenue from £10,000 to £25,000 in 2 months through inventory automation and data-driven marketing.
Skills: Python, SQL, Machine Learning (KNN, SVM, ANN), Tableau, Excel, AI tools like Claude and ChatGPT, prompt engineering, basic Azure/Databricks fundamentals.
Currently: Based in Hyderabad, actively looking for opportunities as an AI Analyst / Data Analyst / AI Tools Specialist. Open to remote and India-based roles.
Languages: English, Telugu (native), Hindi, Marathi.
Contact: saikirantagare@gmail.com, LinkedIn: linkedin.com/in/sai-kiran-shankar-tagare-97973014a
Interests: Cricket (follows it out of curiosity, not a die-hard fan), exploring AI tools.
Personality note: Friendly, direct, curious, enjoys deep conversations and figuring things out from first principles. Known among people close to him for staying positive and steady even when things aren't working out — keeps trying rather than giving up, and people who get to know him tend to enjoy his company because of that grounded, upbeat nature.
`;

const SYSTEM_PROMPT = `You are a friendly, professional personal assistant chatbot representing Saikiran on his social media profile. Visitors land here because Saikiran isn't online to reply personally. Answer questions about him using ONLY the information below. Keep answers short (2-4 sentences), warm, and engaging — confident when talking about his strengths, casual and a little playful for fun questions, professional when discussing his background and what he's looking for.

IMPORTANT — when a recruiter or visitor asks if Saikiran fits a specific role, or asks about a skill: actively match his real skills/experience to what they're asking about and explain the connection confidently. If a specific skill or tool he hasn't used comes up, be honest that it's not yet his strength, but always add that he's a fast learner and genuinely open to picking up whatever the role requires — do not just say "no" and stop there.

If asked something not covered below, say you don't have that info and suggest they message Saikiran directly or email him. Always be honest and never make up facts about him.

ABOUT SAIKIRAN:
${ABOUT_ME}`;

const SUGGESTED = [
  "Who is Saikiran?",
  "Why should I connect with him?",
  "Tell me a fun fact",
  "How can I reach him?",
];

export default function AboutMeBot() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hey! I'm Saikiran's assistant. He's not online right now, but ask me anything about him — his background, what he's looking for, or how to reach him." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // DEMO_MODE: true = uses local smart-reply logic (works in preview, no API needed)
  // Set to false once deployed live with real API access
  const DEMO_MODE = true;

  function demoReply(q) {
    const t = q.toLowerCase();
    if (t.includes("who") || t.includes("about")) {
      return "Saikiran is a Data Science graduate (MSc, Cardiff Metropolitan University, UK) with a Mechanical Engineering background and 4 years of experience in the UK, including growing a business's daily revenue from £10,000 to £25,000 through data-driven automation.";
    }
    if (t.includes("look") || t.includes("job") || t.includes("opportunit") || t.includes("hire")) {
      return "He's currently based in Hyderabad and actively looking for AI Analyst / Data Analyst / AI Tools Specialist roles, open to both remote and India-based opportunities.";
    }
    if (t.includes("reach") || t.includes("contact") || t.includes("email") || t.includes("connect")) {
      return "You can reach him on email at saikirantagare@gmail.com, on phone at 9396793969, or connect on LinkedIn: linkedin.com/in/sai-kiran-shankar-tagare-97973014a";
    }
    if (t.includes("skill") || t.includes("know") || t.includes("tech")) {
      return "His core skills: Python, SQL, Machine Learning (KNN, SVM, ANN), Tableau, Excel, and he's hands-on with AI tools like Claude and ChatGPT for analysis and automation.";
    }
    if (t.includes("locat") || t.includes("where") || t.includes("live") || t.includes("city")) {
      return "He's based in Hyderabad, India, open to remote roles and relocation within India.";
    }
    if (t.includes("football") || t.includes("cricket") || t.includes("hobb") || t.includes("interest")) {
      return "Outside of work, he follows cricket out of curiosity rather than die-hard fandom, and genuinely enjoys exploring new AI tools in his spare time.";
    }
    if (t.includes("why") && (t.includes("hire") || t.includes("connect") || t.includes("you"))) {
      return "Because he doesn't just talk about problems, he digs in and solves them. He once grew a UK business's daily revenue from £10,000 to £25,000 in 2 months by spotting operational gaps nobody else had time to fix. Give him a real problem, and he'll find a real way through it.";
    }
    if (t.includes("gap") || (t.includes("uk") && t.includes("return")) || t.includes("why") && t.includes("come back")) {
      return "He returned to India in late 2025 after 4 years in the UK. The time since has gone into understanding the Indian job market and repositioning from UK retail analytics toward AI and data-focused roles here — he's been deliberate about the shift, not idle.";
    }
    if (t.includes("project") || t.includes("built") || t.includes("portfolio") || (t.includes("github"))) {
      return "Two worth mentioning: a machine learning model that detected fake Twitter accounts with 99.11% accuracy using KNN (his MSc dissertation), and this very chatbot, which he built hands-on using the Claude AI API to represent himself online. Both show he can take an idea from data to working result.";
    }
    if (t.includes("relocat") || t.includes("move") || t.includes("remote") || t.includes("onsite") || t.includes("location")) {
      return "He's based in Hyderabad and open to both remote roles and relocation within India, depending on the opportunity.";
    }
    if (t.includes("right fit") || t.includes("suitable") || t.includes("match") || (t.includes("role") && (t.includes("fit") || t.includes("good")))) {
      return "He's strongest in data analysis, AI-assisted workflows, and problem-solving grounded in real business impact — proven by growing revenue from £10k to £25k/day in his last role. If a specific skill is missing for your role, he's genuinely quick to pick things up and ready to learn whatever's required.";
    }
    if (t.includes("weakness") || t.includes("learn") || t.includes("don't know") || t.includes("not familiar")) {
      return "He's upfront about this: his hands-on production experience with some advanced tools (like Azure/Databricks) is still developing rather than expert-level. But he learns fast and has a track record of figuring things out independently — like building this very AI assistant from scratch.";
    }
    if (t.includes("fun fact") || t.includes("interesting") || t.includes("tell me something")) {
      return "Here's one: no matter how things are going, he stays positive and just keeps trying. People who get to know him well say that steady, upbeat energy is what makes him genuinely good company, even on the rough days.";
    }
    if (t.includes("is that") || t.includes("why is that") || t.includes("really") || t.includes("how so")) {
      return "Fair question — it's less a quirky fact and more just how he handles setbacks. Things haven't always gone smoothly for him, but he doesn't let that sour his mood for long, and people around him notice that.";
    }
    const fallbacks = [
      "Good question! I don't have that specific detail on hand, but feel free to email Saikiran directly at saikirantagare@gmail.com — he'd love to answer that himself.",
      "I'm not fully sure on that one — but Saikiran can tell you himself. Reach him on LinkedIn or saikirantagare@gmail.com.",
      "That's outside what I know about him right now. Worth asking him directly though — he's pretty responsive.",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  async function send(text) {
    const userText = text ?? input;
    if (!userText.trim() || loading) return;
    const newMessages = [...messages, { role: "user", text: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 500));
      setMessages((prev) => [...prev, { role: "assistant", text: demoReply(userText) }]);
      setLoading(false);
      return;
    }

    try {
      const apiMessages = newMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text,
      }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });
      const data = await response.json();
      const textBlocks = (data.content || []).filter((b) => b.type === "text").map((b) => b.text);
      const reply = textBlocks.join("\n").trim() || "Sorry, I couldn't get a response just now — try again?";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Something went wrong reaching the AI. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <NeuralBackground3D />
        <div style={styles.header}>
          <div style={styles.avatar}>SK</div>
          <div>
            <div style={styles.name}>SAIKIRAN // ASSISTANT</div>
            <div style={styles.status}>
              <span style={styles.dot} /> SYSTEM ONLINE
            </div>
          </div>
        </div>

        <div style={styles.chatArea} ref={scrollRef}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.bubbleRow,
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  ...(m.role === "user" ? styles.userBubble : styles.botBubble),
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ ...styles.bubbleRow, justifyContent: "flex-start" }}>
              <div style={{ ...styles.bubble, ...styles.botBubble }}>
                <span style={styles.typing}>typing...</span>
              </div>
            </div>
          )}
        </div>

        {messages.length < 2 && (
          <div style={styles.suggestions}>
            {SUGGESTED.map((s) => (
              <button key={s} style={styles.chip} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={input}
            placeholder="Ask something about Saikiran..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button style={styles.sendBtn} onClick={() => send()} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    background: "radial-gradient(ellipse at top, #131A29 0%, #0B1220 60%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    overflow: "hidden",
  },
  neuralCanvas: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 420,
    height: "85vh",
    maxHeight: 700,
    background: "#0B1220",
    borderRadius: 22,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 25px 90px rgba(0,0,0,0.65), 0 0 60px rgba(94,234,212,0.08)",
    border: "1px solid rgba(94,234,212,0.18)",
  },
  header: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 18px",
    borderBottom: "1px solid rgba(94,234,212,0.15)",
    background: "rgba(13, 18, 32, 0.55)",
    backdropFilter: "blur(10px)",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "linear-gradient(135deg, #5EEAD4, #A78BFA)",
    color: "#0B1220",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    boxShadow: "0 4px 20px rgba(94,234,212,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset",
  },
  name: {
    color: "#E8EDF5",
    fontWeight: 600,
    fontSize: 14,
    letterSpacing: "0.04em",
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  status: {
    color: "#5EEAD4",
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
    letterSpacing: "0.06em",
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  dot: { width: 6, height: 6, borderRadius: "50%", background: "#5EEAD4", display: "inline-block", boxShadow: "0 0 8px #5EEAD4" },
  chatArea: {
    position: "relative",
    zIndex: 2,
    flex: 1,
    overflowY: "auto",
    padding: "16px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  bubbleRow: { display: "flex" },
  bubble: {
    maxWidth: "80%",
    padding: "11px 15px",
    borderRadius: 16,
    fontSize: 14,
    lineHeight: 1.5,
  },
  botBubble: {
    background: "rgba(27, 36, 54, 0.45)",
    backdropFilter: "blur(6px)",
    color: "#E8EDF5",
    borderBottomLeftRadius: 4,
    border: "1px solid rgba(94,234,212,0.2)",
    boxShadow: "0 4px 18px rgba(0,0,0,0.3), 0 0 16px rgba(94,234,212,0.05)",
  },
  userBubble: {
    background: "linear-gradient(135deg, #5EEAD4, #A78BFA)",
    color: "#0B1220",
    fontWeight: 500,
    borderBottomRightRadius: 4,
    boxShadow: "0 4px 20px rgba(167,139,250,0.35)",
  },
  typing: { color: "#5EEAD4", fontStyle: "italic", fontFamily: "'JetBrains Mono', monospace" },
  suggestions: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    padding: "0 14px 12px",
  },
  chip: {
    background: "#1B2436",
    color: "#9FB0C9",
    border: "1px solid #263352",
    borderRadius: 8,
    padding: "7px 12px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
  },
  inputRow: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    gap: 8,
    padding: 12,
    borderTop: "1px solid rgba(94,234,212,0.15)",
    background: "rgba(13, 18, 32, 0.55)",
    backdropFilter: "blur(10px)",
  },
  input: {
    flex: 1,
    background: "#1B2436",
    border: "1px solid #263352",
    borderRadius: 10,
    padding: "10px 16px",
    color: "#E8EDF5",
    fontSize: 14,
    outline: "none",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #5EEAD4, #A78BFA)",
    color: "#0B1220",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
};
