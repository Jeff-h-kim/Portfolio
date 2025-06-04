import React, { useState } from 'react';
import { Mail, Linkedin, Github } from 'lucide-react';
import emailjs from '@emailjs/browser';

emailjs.init('9ipM6QCRhwW5f5Pho');

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (formData.name && formData.email && formData.message) {
    try {
      const result_recipient = await emailjs.send(
        'service_7b9l13b',
        'template_fmch43y',
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
          to_email:'jeffkim6511@Gmail.com',
        },
        '9ipM6QCRhwW5f5Pho'
      );

      const result_host = await emailjs.send(
        'service_7b9l13b',
        'template_mqcors4',
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
          to_email:'jeffkim6511@Gmail.com',
        },
        '9ipM6QCRhwW5f5Pho'
      );
      alert('Thank you for your message! I\'ll get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Sorry, there was an error sending your message. Please try again.');
    }
  } else {
    alert('Please fill in all fields.');
  }
};

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">Get In Touch</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-6 text-gray-800">Let's Work Together</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                I'm always interested in new opportunities and exciting projects. 
                Whether you have a question or just want to say hi, I'll do my best to get back to you!
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <a
                    href="mailto:jeffkim6511@gmail.com"
                    className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
                  >
                    <Mail className="text-blue-600" size={20} />
                    <span className="text-gray-700">jeffkim6511@gmail.com</span>
                  </a>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href="https://www.linkedin.com/in/jeff-kim/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
                  >
                    <Linkedin className="text-blue-600" size={20} />
                    <span className="text-gray-700">linkedin.com/in/jeff-kim</span>
                  </a>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href="https://github.com/Jeffkim6511"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
                  >
                    <Github className="text-blue-600" size={20} />
                    <span className="text-gray-700">github.com/Jeffkim6511</span>
                  </a>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Your Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Your message..."
                />
              </div>
              
              <button
                type="submit"
                className="w-full !bg-blue-600 !text-white py-3 rounded-lg hover:!bg-blue-800 !transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;