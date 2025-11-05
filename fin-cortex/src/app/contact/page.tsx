"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Footer from "@/components/layout/Footer";
import { EnhancedSeparator } from "@/components/ui/separator-enhanced";

export default function ContactPage() {
  const { isDarkTheme } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
    inquiryType: "general"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: "",
        email: "",
        company: "",
        subject: "",
        message: "",
        inquiryType: "general"
      });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "General Inquiries",
      description: "For general questions and support",
      value: "support@fincortex.com",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: Mail,
      title: "Sales & Demos",
      description: "Request a personalized demo",
      value: "sales@fincortex.com",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: Phone,
      title: "Technical Support",
      description: "24/7 technical assistance",
      value: "+1 (555) 123-4567",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: Mail,
      title: "Admin Support",
      description: "For administrators and managers",
      value: "admin@fincortex.com",
      color: "from-orange-500 to-red-600"
    }
  ];


  return (
    <section id="contact" className="py-20 bg-dark text-primary relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/4 -right-16 w-32 h-32 bg-gradient-to-br from-green-500/10 to-teal-600/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-16 right-1/3 w-36 h-36 bg-gradient-to-br from-orange-500/10 to-red-600/10 rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-card/20 text-accent border-accent/30 rounded-full mb-6 backdrop-blur-sm hover:shadow-md hover:shadow-blue-500/20 hover:border-blue-400/40 transition-all duration-300 animate-fade-in-up">
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Get In Touch</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Contact Us
            <span className="block text-gradient-primary">Get In Touch</span>
          </h1>
          
          <p className="text-xl text-muted max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Ready to transform your reimbursement management? Our team of experts is here to help you get started with FinCortex.
          </p>
        </div>

        {/* Contact Form - Full Width */}
        <div className="animate-fade-in-up mb-16" style={{ animationDelay: '0.3s' }}>
          <Card className="p-8 border border-subtle bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-25 hover:shadow-lg hover:shadow-blue-500/25 hover:border-blue-400/50 transition-all duration-400 relative overflow-hidden group">
              {/* Shimmer Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-primary">Send us a Message</h2>
                    <p className="text-muted">We'll get back to you within 24 hours</p>
                  </div>
                </div>

                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-primary mb-2">Message Sent!</h3>
                    <p className="text-muted">Thank you for reaching out. We'll be in touch soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-primary">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="bg-card/50 border-subtle focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-primary">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="bg-card/50 border-subtle focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-sm font-medium text-primary">Company</Label>
                        <Input
                          id="company"
                          name="company"
                          type="text"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="bg-card/50 border-subtle focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300"
                          placeholder="Your company name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inquiryType" className="text-sm font-medium text-primary">Inquiry Type</Label>
                        <select
                          id="inquiryType"
                          name="inquiryType"
                          value={formData.inquiryType}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-card/50 border border-subtle rounded-md text-primary focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300"
                        >
                          <option value="general">General Inquiry</option>
                          <option value="demo">Request Demo</option>
                          <option value="support">Technical Support</option>
                          <option value="admin">Admin Support</option>
                          <option value="manager">Manager Support</option>
                          <option value="user">User Support</option>
                          <option value="integration">System Integration</option>
                          <option value="pricing">Pricing Information</option>
                          <option value="partnership">Partnership</option>
                          <option value="training">Training & Onboarding</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium text-primary">Subject *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="bg-card/50 border-subtle focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300"
                        placeholder="What's this about?"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium text-primary">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleInputChange}
                        className="bg-card/50 border-subtle focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300 min-h-[120px]"
                        placeholder="Tell us more about your needs..."
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Sending Message...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          Send Message
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </Card>
        </div>

        {/* Contact Information - 2 Columns */}
        <div className="animate-fade-in-up mb-16" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-2xl font-bold text-primary mb-6 text-center">Get in Touch</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {contactInfo.map((item, index) => (
                  <Card
                    key={index}
                    className="p-6 border border-subtle bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-25 hover:shadow-lg hover:shadow-blue-500/25 hover:border-blue-400/50 transition-all duration-400 relative overflow-hidden group"
                    style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                  >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-primary mb-1">{item.title}</h4>
                        <p className="text-sm text-muted mb-2">{item.description}</p>
                        <p className="text-primary font-medium">{item.value}</p>
                      </div>
                    </div>
                  </Card>
                ))}
          </div>
        </div>

        {/* Separator */}
        <EnhancedSeparator variant="gradient" thickness="medium" animated className="my-16" />

        {/* FAQ Section */}
        <div className="animate-fade-in-up mb-16" style={{ animationDelay: '1.2s' }}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">Frequently Asked Questions</h2>
            <p className="text-muted max-w-2xl mx-auto">
              Quick answers to common questions about FinCortex and our services.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                question: "How quickly can I get started with FinCortex?",
                answer: "You can get started within 24 hours. Our onboarding process includes user setup, department configuration, and manager assignment based on your organizational structure."
              },
              {
                question: "What user roles are supported?",
                answer: "FinCortex supports multiple user roles including Admins, Managers, and Users. Each role has specific permissions and access levels for secure reimbursement management."
              },
              {
                question: "How does the approval workflow work?",
                answer: "Our system supports hierarchical approval workflows where users submit expenses, managers review and approve, and admins have full oversight of all transactions."
              },
              {
                question: "Can I integrate with existing systems?",
                answer: "Yes, we provide APIs and webhooks for seamless integration with your existing accounting, ERP, and HR systems. Custom integrations are available for enterprise clients."
              },
              {
                question: "Is my data secure and compliant?",
                answer: "Absolutely. We use enterprise-grade security with SOC 2 compliance, end-to-end encryption, and regular security audits. All data is stored securely with role-based access control."
              },
              {
                question: "What support options are available?",
                answer: "We offer 24/7 technical support, dedicated account managers, comprehensive training resources, and role-specific support for admins, managers, and users."
              }
            ].map((faq, index) => (
              <Card
                key={index}
                className="p-6 border border-subtle bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-25 hover:shadow-lg hover:shadow-blue-500/25 hover:border-blue-400/50 transition-all duration-400 relative overflow-hidden group"
                style={{ animationDelay: `${1.3 + index * 0.1}s` }}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </div>

                <div className="relative z-10">
                  <h4 className="text-lg font-semibold text-primary mb-3 group-hover:text-blue-400 transition-colors duration-300">
                    {faq.question}
                  </h4>
                  <p className="text-muted leading-relaxed group-hover:text-secondary transition-colors duration-300">
                    {faq.answer}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      {/* Separator before Footer */}
      <EnhancedSeparator variant="gradient" thickness="medium" animated className="my-16" />
      
      {/* Footer */}
      <Footer />
    </section>
  );
}
