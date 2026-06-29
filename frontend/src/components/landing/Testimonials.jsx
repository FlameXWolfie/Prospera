import { useState } from 'react';
import './css/Testimonials.css';

export default function Testimonials() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Product Manager at Google',
      quote: 'Prospera helped me improve my resume and land interviews at top product companies. The ATS scan is a game-changer!',
      initials: 'SJ',
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)'
    },
    {
      name: 'Michael Chen',
      role: 'Software Engineer at Microsoft',
      quote: 'The AI suggestions are spot on. I increased my interview rate by 3x within a month!',
      initials: 'MC',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      name: 'Priya Patel',
      role: 'UX Designer at Airbnb',
      quote: 'Finally, a platform that combines everything I need in one place. Highly recommended!',
      initials: 'PP',
      gradient: 'linear-gradient(135deg, #b180f9 0%, #8d36ef 100%)'
    }
  ];

  return (
    <section className="testimonials-section">
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 className="section-title" style={{ marginBottom: '12px' }}>
          Success stories from our users
        </h2>
      </div>

      <div className="testimonials-grid">
        {testimonials.map((item, idx) => (
          <div key={idx} className="testimonial-card-item">
            <div>
              <span className="quote-icon-blue">“</span>
              <p className="testimonial-quote-text">{item.quote}</p>
            </div>

            <div className="testimonial-user">
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: item.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '700',
                fontSize: '14px',
                fontFamily: 'Outfit, sans-serif',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                {item.initials}
              </div>
              <div>
                <h4 className="testimonial-user-name">{item.name}</h4>
                <span className="testimonial-user-title">{item.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="carousel-indicators">
        {testimonials.map((_, idx) => (
          <span
            key={idx}
            className={`indicator-dot ${activeTestimonial === idx ? 'active' : ''}`}
            onClick={() => setActiveTestimonial(idx)}
          ></span>
        ))}
      </div>
    </section>
  );
}
