// Smooth nav scrolling + active link handling (existing) + Formspree integration
document.addEventListener('DOMContentLoaded', function(){
  const links = document.querySelectorAll('.nav-list a');
  links.forEach(link=>{
    link.addEventListener('click', (e)=>{
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if(target) target.scrollIntoView({behavior:'smooth'});
      links.forEach(l=>l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // Update active nav while scrolling (for sections with ids)
  const sections = Array.from(document.querySelectorAll('main section[id], main [id]'));
  if('IntersectionObserver' in window && sections.length){
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        const id = e.target.id;
        if(id){
          const link = document.querySelector('.nav-list a[href="#'+id+'"]');
          if(link){
            if(e.isIntersecting) {
              links.forEach(l=>l.classList.remove('active'));
              link.classList.add('active');
            }
          }
        }
      });
    }, {threshold:0.45});
    sections.forEach(s=>obs.observe(s));
  }

  // Skills animation: fill progress bars when skills section enters viewport
  const skillSection = document.querySelector('#skills');
  if(skillSection && 'IntersectionObserver' in window){
    const skillObserver = new IntersectionObserver((entries, observer)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          document.querySelectorAll('.skill .fill').forEach(fill=>{
            const target = fill.getAttribute('data-target') || fill.dataset.target || '0';
            const delay = Array.from(document.querySelectorAll('.skill .fill')).indexOf(fill) * 90;
            setTimeout(()=> fill.style.width = target + '%', delay);
          });
          observer.unobserve(skillSection);
        }
      });
    }, {threshold: 0.25});
    skillObserver.observe(skillSection);
  }

  // Contact form: Formspree AJAX submit with fallback to simulated send
  const contactForm = document.getElementById('contactForm');
  const feedback = document.getElementById('formFeedback');

  function simulateSend(form) {
    // previous simulated behavior for development/testing if user hasn't set Formspree
    const sendBtn = form.querySelector('button[type="submit"]');
    sendBtn.disabled = true;
    const origText = sendBtn.textContent;
    sendBtn.textContent = 'Sending…';
    setTimeout(()=>{
      sendBtn.disabled = false;
      sendBtn.textContent = origText;
      feedback.style.color = 'var(--accent)';
      feedback.textContent = 'Message sent — (simulated) thanks! Replace YOUR_FORM_ID with your Formspree id to enable real deliveries.';
      form.reset();
      setTimeout(()=> {
        feedback.textContent = '';
        feedback.style.color = '';
      }, 5000);
    }, 1000);
  }

  if(contactForm){
    contactForm.addEventListener('submit', async function(e){
      e.preventDefault();
      feedback.textContent = '';
      feedback.style.color = '';
      const name = contactForm.name.value.trim();
      const email = contactForm.email.value.trim();
      const message = contactForm.message.value.trim();

      // basic client validation
      if(!name || !email || !message){
        feedback.style.color = '';
        feedback.textContent = 'Please fill in all fields.';
        return;
      }
      if(!/^\S+@\S+\.\S+$/.test(email)){
        feedback.textContent = 'Please enter a valid email address.';
        return;
      }

      // set hidden replyto for Formspree convenience
      const replyInput = document.getElementById('_replyto');
      if(replyInput) replyInput.value = email;

      const sendBtn = contactForm.querySelector('button[type="submit"]');
      const origText = sendBtn.textContent;
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending…';

      // retrieve endpoint; user must replace YOUR_FORM_ID with actual id
      const endpoint = contactForm.dataset.formspreeEndpoint || '';

      if(!endpoint || endpoint.includes('YOUR_FORM_ID')){
        // fallback if user hasn't set up Formspree yet
        simulateSend(contactForm);
        return;
      }

      try {
        // POST FormData to Formspree with Accept: application/json to receive JSON response
        const formData = new FormData(contactForm);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Accept': 'application/json'
          },
          body: formData
        });

        if(res.ok){
          // success
          sendBtn.disabled = false;
          sendBtn.textContent = origText;
          feedback.style.color = 'var(--accent)';
          feedback.textContent = 'Message sent — thanks! I will reply soon.';
          contactForm.reset();
          setTimeout(()=> {
            feedback.textContent = '';
            feedback.style.color = '';
          }, 6000);
        } else {
          // try to parse body for errors (Formspree returns JSON with errors)
          let data;
          try { data = await res.json(); } catch(err){ data = null; }
          sendBtn.disabled = false;
          sendBtn.textContent = origText;
          if(data && data.errors && data.errors.length){
            feedback.textContent = data.errors.map(x => x.message).join(', ') || 'Unable to send message.';
          } else {
            feedback.textContent = 'There was an error sending your message. Please try again later.';
          }
        }
      } catch(err){
        sendBtn.disabled = false;
        sendBtn.textContent = origText;
        feedback.textContent = 'Network error — please check your connection and try again.';
      }
    });
  }
});
