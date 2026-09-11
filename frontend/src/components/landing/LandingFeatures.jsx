import { useEffect, useRef } from 'react';
import { Check, Clock3, FileText, Mic2, Send, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './css/LandingFeatures.css';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    label: 'Resume intelligence',
    title: 'Tailor the draft before you send it.',
    description: 'DraftMe reads the role, checks your resume, and turns vague improvements into clear edits you can make now.',
  },
  {
    label: 'Application command',
    title: 'Every opportunity stays in motion.',
    description: 'Move from saved to applied, keep follow-ups visible, and know exactly where every conversation stands.',
  },
  {
    label: 'Interview practice',
    title: 'Practice until the answer feels natural.',
    description: 'Work through role-specific questions and get focused feedback on clarity, confidence, and relevance.',
  },
  {
    label: 'Search intelligence',
    title: 'See what is creating interviews.',
    description: 'Connect resume quality, application activity, and interview outcomes so your next move is based on evidence.',
  },
];

function ResumeScene() {
  return (
    <div className="product-scene resume-scene">
      <div className="scene-topbar"><span>Resume scan</span><span className="scene-state">Live analysis</span></div>
      <div className="resume-workspace">
        <div className="resume-paper-mini">
          <div className="resume-person"><strong>Aarav Mehta</strong><span>Product designer</span></div>
          <div className="resume-rule wide" /><div className="resume-rule mid" />
          <h4>Experience</h4>
          <div className="resume-rule wide" /><div className="resume-rule short" />
          <div className="resume-rule mid" /><div className="resume-rule wide" />
          <h4>Selected work</h4>
          <div className="resume-rule wide" /><div className="resume-rule mid" />
          <span className="resume-scan-line" />
        </div>
        <div className="resume-review">
          <div className="resume-score"><span>86</span><small>Strong match</small></div>
          <div className="resume-suggestions">
            <div><Check size={15} /><span><strong>Clear impact</strong>Four results use measurable outcomes.</span></div>
            <div><Sparkles size={15} /><span><strong>Add one keyword</strong>Include &quot;design systems&quot; in experience.</span></div>
            <div><Check size={15} /><span><strong>Ready to send</strong>Structure and formatting are ATS-safe.</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackerScene() {
  const columns = [
    { title: 'Saved', cards: ['Product designer', 'UX researcher'] },
    { title: 'Applied', cards: ['Design systems lead', 'Senior designer'] },
    { title: 'Interview', cards: ['Product design lead'] },
  ];

  return (
    <div className="product-scene tracker-scene">
      <div className="scene-topbar"><span>Applications</span><button type="button"><span>New opportunity</span></button></div>
      <div className="tracker-board">
        {columns.map((column) => (
          <section className="tracker-column" key={column.title}>
            <header><span>{column.title}</span><small>{column.cards.length}</small></header>
            {column.cards.map((card, index) => (
              <article className="tracker-card" key={card}>
                <strong>{card}</strong><span>{index ? 'Northstar Labs' : 'Paperplane Studio'}</span>
                <small>{column.title === 'Interview' ? 'Thu, 11:30 AM' : 'Remote'}</small>
              </article>
            ))}
          </section>
        ))}
        <article className="tracker-moving-card">
          <strong>Design systems lead</strong><span>Northstar Labs</span><small>Moved to interview</small>
        </article>
      </div>
      <div className="tracker-toast"><Check size={15} /><span>Follow-up scheduled for Friday</span></div>
    </div>
  );
}

function InterviewScene() {
  return (
    <div className="product-scene interview-scene">
      <div className="scene-topbar"><span>Mock interview</span><span className="scene-state">Product design</span></div>
      <div className="interview-workspace">
        <div className="interview-question">
          <small>Question 3</small>
          <h3>Tell me about a decision you changed after user research.</h3>
          <div className="interview-wave" aria-hidden="true">
            {Array.from({ length: 24 }, (_, index) => <span key={index} style={{ '--wave-index': index }} />)}
          </div>
          <div className="interview-recorder"><span><Mic2 size={17} /></span><strong>00:42</strong><small>Recording response</small></div>
        </div>
        <aside className="interview-feedback">
          <small>Live feedback</small>
          <div><Check size={16} /><span><strong>Clear context</strong>You set up the problem quickly.</span></div>
          <div><Check size={16} /><span><strong>Strong ownership</strong>Your role in the decision is specific.</span></div>
          <div className="feedback-pending"><Sparkles size={16} /><span><strong>Make it sharper</strong>Close with the measured result.</span></div>
        </aside>
      </div>
    </div>
  );
}

function AnalyticsScene() {
  const bars = [42, 58, 51, 76, 68, 92];
  return (
    <div className="product-scene analytics-scene">
      <div className="scene-topbar"><span>Search performance</span><span className="scene-state">Last 6 weeks</span></div>
      <div className="analytics-workspace">
        <div className="analytics-primary">
          <header><span>Interview momentum</span><strong>Moving up</strong></header>
          <div className="analytics-bars">
            {bars.map((height, index) => <span key={height + index} style={{ '--bar-height': `${height}%`, '--bar-index': index }} />)}
          </div>
          <div className="analytics-axis"><span>Week 1</span><span>Week 6</span></div>
        </div>
        <div className="analytics-signals">
          <article><FileText size={18} /><span><small>Top resume</small><strong>Product Design</strong></span></article>
          <article><Send size={18} /><span><small>Best source</small><strong>Direct outreach</strong></span></article>
          <article><Clock3 size={18} /><span><small>Follow-up window</small><strong>3 to 5 days</strong></span></article>
        </div>
      </div>
    </div>
  );
}

const scenes = [ResumeScene, TrackerScene, InterviewScene, AnalyticsScene];

export default function LandingFeatures() {
  const sectionRef = useRef(null);
  const tourRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const tour = tourRef.current;
    const stage = stageRef.current;
    if (!section || !tour || !stage) return undefined;

    const media = gsap.matchMedia();
    media.add('(min-width: 821px) and (prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        const sceneEls = gsap.utils.toArray('.product-stage > .product-scene');
        const copyEls = gsap.utils.toArray('.feature-copy-stage > .feature-copy-panel');
        const railEls = gsap.utils.toArray('.feature-stage-rail > .feature-rail-item');

        gsap.set(sceneEls.slice(1), {
          autoAlpha: 0,
          y: (_position, element) => element.offsetHeight,
          scale: 0.985,
        });
        gsap.set(copyEls.slice(1), {
          autoAlpha: 0,
          y: 18,
        });
        gsap.set(railEls.slice(1), { opacity: 0.34 });

        const timeline = gsap.timeline({
          defaults: { ease: 'power3.inOut' },
          scrollTrigger: {
            trigger: tour,
            start: 'top top',
            end: 'bottom bottom',
            pin: stage,
            pinSpacing: false,
            scrub: 1.15,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        for (let index = 1; index < sceneEls.length; index += 1) {
          const at = index;
          timeline
            .set(sceneEls[index], { autoAlpha: 1, zIndex: index + 1 }, at)
            .fromTo(
              sceneEls[index],
              { y: () => sceneEls[index].offsetHeight, scale: 0.985 },
              { y: 0, scale: 1, duration: 0.68, ease: 'power2.inOut' },
              at,
            )
            .to(
              sceneEls[index - 1],
              { y: () => sceneEls[index - 1].offsetHeight * -0.07, scale: 0.965, duration: 0.68, ease: 'power2.inOut' },
              at,
            )
            .set(sceneEls[index - 1], { autoAlpha: 0 }, at + 0.68)
            .to(
              copyEls[index - 1],
              { autoAlpha: 0, y: -14, duration: 0.24, ease: 'power2.in' },
              at + 0.08,
            )
            .fromTo(
              copyEls[index],
              { autoAlpha: 0, y: 18, zIndex: index + 1 },
              { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' },
              at + 0.36,
            )
            .to(railEls[index - 1], { opacity: 0.34, duration: 0.34 }, at + 0.22)
            .to(railEls[index], { opacity: 1, duration: 0.34 }, at + 0.22);
        }
      }, section);

      return () => context.revert();
    });

    return () => media.revert();
  }, []);

  return (
    <section id="features" className="features-section" ref={sectionRef}>
      <header className="features-intro">
        <p className="features-kicker">Inside DraftMe</p>
        <h2>Your job search, finally working as one system.</h2>
        <p>Watch each part of the workspace pick up where the last one left off.</p>
      </header>

      <div className="features-tour" ref={tourRef}>
        <div className="features-stage" ref={stageRef}>
          <div className="features-stage-inner">
            <nav className="feature-stage-rail" aria-label="DraftMe product tour">
              {features.map((feature) => (
                <span className="feature-rail-item" key={feature.label}>{feature.label}</span>
              ))}
            </nav>

            <div className="product-stage" aria-label="Animated DraftMe product demonstration">
              {scenes.map((Scene, index) => <Scene key={features[index].label} />)}
            </div>

            <div className="feature-copy-stage">
              {features.map((feature) => (
                <article className="feature-copy-panel" key={feature.title}>
                  <span>{feature.label}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="features-mobile-list">
        {features.map((feature, index) => {
          const Scene = scenes[index];
          return (
            <article className="feature-mobile-item" key={feature.title}>
              <div><span>{feature.label}</span><h3>{feature.title}</h3><p>{feature.description}</p></div>
              <div className="mobile-product-stage"><Scene /></div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
