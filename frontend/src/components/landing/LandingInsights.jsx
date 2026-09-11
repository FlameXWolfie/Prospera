import { useEffect, useRef } from 'react';
import { ArrowRight, CalendarCheck2, FileCheck2, MessageSquareText, Send } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './css/LandingInsights.css';

gsap.registerPlugin(ScrollTrigger);

const moments = [
  {
    icon: FileCheck2,
    label: 'Shape the story',
    title: 'A resume built for this role',
    description: 'Bring the job description into DraftMe and see what deserves attention before you apply.',
    state: 'Draft ready',
  },
  {
    icon: Send,
    label: 'Make the move',
    title: 'An application sent with context',
    description: 'Keep the role, company notes, resume version, and next action connected from day one.',
    state: 'In progress',
  },
  {
    icon: MessageSquareText,
    label: 'Build confidence',
    title: 'Practice that sounds like you',
    description: 'Turn the role into focused interview prompts, then sharpen the parts of each answer that matter.',
    state: 'Practice active',
  },
  {
    icon: CalendarCheck2,
    label: 'Keep momentum',
    title: 'The right follow-up at the right time',
    description: 'Know what is moving, what needs a response, and where to put your energy next.',
    state: 'Next step clear',
  },
];

export default function LandingInsights({ onEnterApp, isAuthed = false }) {
  const sectionRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const context = gsap.context(() => {
      const items = gsap.utils.toArray('.momentum-item');

      gsap.from('.momentum-heading > *', {
        y: 40,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.momentum-heading',
          start: 'top 78%',
          once: true,
        },
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: '.momentum-flow',
          start: 'top 72%',
          end: 'bottom 62%',
          scrub: 0.65,
        },
      });

      timeline
        .fromTo('.momentum-progress', { scaleY: 0 }, { scaleY: 1, ease: 'none' }, 0)
        .from(items, { x: 36, opacity: 0.58, stagger: 0.18, ease: 'power2.out' }, 0)
        .from('.momentum-node', { scale: 0.65, opacity: 0.58, stagger: 0.18, ease: 'back.out(1.8)' }, 0);
    }, sectionRef);

    return () => context.revert();
  }, []);

  return (
    <section className="momentum-section" id="workflow" ref={sectionRef}>
      <div className="momentum-shell">
        <div className="momentum-heading">
          <p className="momentum-kicker">One connected search</p>
          <h2>From first draft to signed offer.</h2>
          <p>
            DraftMe gives every application a clear history and a useful next step, so the work compounds instead of disappearing into tabs.
          </p>
        </div>

        <div className="momentum-layout">
          <div className="momentum-flow">
            <span className="momentum-track" aria-hidden="true">
              <span className="momentum-progress" />
            </span>

            {moments.map(({ icon: Icon, label, title, description, state }) => (
              <article className="momentum-item" key={title}>
                <span className="momentum-node" aria-hidden="true">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <div className="momentum-item-copy">
                  <span>{label}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <span className="momentum-state">{state}</span>
              </article>
            ))}
          </div>

          <aside className="momentum-aside">
            <p className="momentum-aside-label">Built around momentum</p>
            <p className="momentum-aside-quote">
              Less time reconstructing what happened. More time making the next move count.
            </p>
            <button type="button" onClick={onEnterApp} className="momentum-cta">
              <span>{isAuthed ? 'Open dashboard' : 'Get Started Free'}</span>
              <ArrowRight size={17} />
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}
