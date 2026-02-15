"use client";

import { Card } from "@/components/ui/card";
import { Star, Quote, Users, Star as StarIcon, Heart } from "lucide-react";
import LogoLoop from "@/components/LogoLoop";

export default function HappyClientsSection() {
  const clientReviews = [
    {
      node: (
        <Card className="p-6 bg-[var(--card-dark)] border border-[var(--border-subtle)] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-96 mx-4">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
              JD
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[var(--text-primary)]">John Doe</h4>
              <p className="text-sm text-[var(--text-secondary)]">CEO, TechCorp</p>
            </div>
          </div>
          <div className="flex items-center mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
            ))}
          </div>
          <div className="relative">
            <Quote className="absolute -top-2 -left-2 w-6 h-6 text-accent/30" />
            <p className="text-sm text-[var(--text-secondary)] italic pl-4 leading-relaxed">
              "&quot;FinCortex has revolutionized our expense management. The AI-powered &quot;OCR saves us hours every week, and the automated approval process is incredibly efficient.&quot;
            </p>
          </div>
        </Card>
      ),
      title: "John Doe - CEO, TechCorp"
    },
    {
      node: (
        <Card className="p-6 bg-[var(--card-dark)] border border-[var(--border-subtle)] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-96 mx-4">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
              SM
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[var(--text-primary)]">Sarah Miller</h4>
              <p className="text-sm text-[var(--text-secondary)]">CFO, FinanceFlow</p>
            </div>
          </div>
          <div className="flex items-center mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
            ))}
          </div>
          <div className="relative">
            <Quote className="absolute -top-2 -left-2 w-6 h-6 text-accent/30" />
            <p className="text-sm text-[var(--text-secondary)] italic pl-4 leading-relaxed">
              "The policy enforcement feature is a game-changer. We&apos;ve reduced compliance issues by 90% and our team loves how intuitive the interface is."
            </p>
          </div>
        </Card>
      ),
      title: "Sarah Miller - CFO, FinanceFlow"
    },
    {
      node: (
        <Card className="p-6 bg-[var(--card-dark)] border border-[var(--border-subtle)] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-96 mx-4">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
              RJ
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[var(--text-primary)]">Robert Johnson</h4>
              <p className="text-sm text-[var(--text-secondary)]">Operations Director, GlobalTech</p>
            </div>
          </div>
          <div className="flex items-center mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
            ))}
          </div>
          <div className="relative">
            <Quote className="absolute -top-2 -left-2 w-6 h-6 text-accent/30" />
            <p className="text-sm text-[var(--text-secondary)] italic pl-4 leading-relaxed">
              &quot;Implementation was seamless and the support team is outstanding. Our reimbursement process is now 75% faster than before.&quot;
            </p>
          </div>
        </Card>
      ),
      title: "Robert Johnson - Operations Director, GlobalTech"
    },
    {
      node: (
        <Card className="p-6 bg-[var(--card-dark)] border border-[var(--border-subtle)] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-96 mx-4">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
              EW
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[var(--text-primary)]">Emily Wilson</h4>
              <p className="text-sm text-[var(--text-secondary)]">HR Manager, PeopleFirst</p>
            </div>
          </div>
          <div className="flex items-center mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
            ))}
          </div>
          <div className="relative">
            <Quote className="absolute -top-2 -left-2 w-6 h-6 text-accent/30" />
            <p className="text-sm text-[var(--text-secondary)] italic pl-4 leading-relaxed">
              &quot;The mobile app is fantastic! Our employees can submit expenses on the go, and the real-time notifications keep everyone in the loop.&quot;
            </p>
          </div>
        </Card>
      ),
      title: "Emily Wilson - HR Manager, PeopleFirst"
    },
    {
      node: (
        <Card className="p-6 bg-[var(--card-dark)] border border-[var(--border-subtle)] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-96 mx-4">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
              MC
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[var(--text-primary)]">Michael Chen</h4>
              <p className="text-sm text-[var(--text-secondary)]">Finance Director, StartupHub</p>
            </div>
          </div>
          <div className="flex items-center mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
            ))}
          </div>
          <div className="relative">
            <Quote className="absolute -top-2 -left-2 w-6 h-6 text-accent/30" />
            <p className="text-sm text-[var(--text-secondary)] italic pl-4 leading-relaxed">
              "The analytics dashboard provides incredible insights into our spending patterns. It&apos;s helped us make better financial decisions across the company."
            </p>
          </div>
        </Card>
      ),
      title: "Michael Chen - Finance Director, StartupHub"
    }
  ];

  return (
    <section id="reviews" className="py-20 px-4 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-[var(--card-dark)] backdrop-blur-sm rounded-full border border-[var(--border-subtle)] mb-6 animate-fade-in-up">
            <Star className="w-4 h-4 text-accent mr-2" />
            <span className="text-sm font-medium text-accent">Client Testimonials</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Our Happy
            <span className="block text-gradient-primary">Clients</span>
          </h2>

          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Don&apos;t just take our word for it. Here's what our clients have to say about their experience with FinCortex.
          </p>
        </div>

        {/* Animated Client Reviews */}
        <div className="animate-fade-in-up h-96 flex items-center w-full mt-4" style={{ animationDelay: '0.3s' }}>
          <LogoLoop
            logos={clientReviews}
            speed={30}
            direction="left"
            width="100%"
            logoHeight={320}
            gap={32}
            pauseOnHover={true}
            fadeOut={true}
            scaleOnHover={true}
            ariaLabel="Client testimonials carousel"
            className="py-4 w-full"
          />
        </div>

        {/* Stats Section */}
        <div className="mt-36 grid grid-cols-1 lg:grid-cols-3 gap-8 text-center">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex flex-col lg:flex-row items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 lg:mb-0 lg:mr-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-center lg:text-left">
                <div className="text-4xl font-bold text-[var(--text-primary)] mb-2">500+</div>
                <div className="text-[var(--text-secondary)]">Happy Clients</div>
              </div>
            </div>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex flex-col lg:flex-row items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mb-4 lg:mb-0 lg:mr-4">
                <StarIcon className="w-8 h-8 text-white" />
              </div>
              <div className="text-center lg:text-left">
                <div className="text-4xl font-bold text-[var(--text-primary)] mb-2">4.9/5</div>
                <div className="text-[var(--text-secondary)]">Average Rating</div>
              </div>
            </div>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="flex flex-col lg:flex-row items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mb-4 lg:mb-0 lg:mr-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div className="text-center lg:text-left">
                <div className="text-4xl font-bold text-[var(--text-primary)] mb-2">98%</div>
                <div className="text-[var(--text-secondary)]">Client Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
