import React from 'react';
import './css/Testimonial.css';

export default function Testimonial() {
  return (
    <section className="card-widget testimonial-card">
      <div className="testimonial-quote-icon">“</div>
      
      <div className="testimonial-text">
        "Prospera helped me increase my interview rate by 3x. The ATS scan and suggestions are game changers!"
      </div>
      
      <div className="testimonial-author">
        — Sarah Lee, Product Manager at Google
      </div>

      <div className="testimonial-art-wrapper">
        <img 
          src="/assets/testimonial_art.png" 
          alt="Woman working illustration" 
          className="testimonial-art-img" 
        />
      </div>
    </section>
  );
}
