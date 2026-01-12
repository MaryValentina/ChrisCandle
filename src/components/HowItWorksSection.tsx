import { Gift, Users, Sparkles, Mail, PartyPopper, ShoppingBag, Crown, Share2, Eye, Shuffle, Heart, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const HowItWorksSection = () => {
  const [activeTab, setActiveTab] = useState<'participant' | 'organizer'>('participant');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const participantSteps = [
    {
      icon: Mail,
      title: 'Get Your Code',
      description: 'Your organizer will share a special code with you via WhatsApp, text, email, or in person.',
      example: 'SANTA2024'
    },
    {
      icon: Sparkles,
      title: 'Enter the Code',
      description: 'Visit ChrisCandle and type your code in the box, then click \'Join Event\' to see the magic unfold.',
      example: null
    },
    {
      icon: Eye,
      title: 'See Party Details',
      description: 'View the party date, gift budget, and see who else is joining the festive fun!',
      example: null
    },
    {
      icon: Users,
      title: 'Join the Fun',
      description: 'Click \'Join This Event\' and enter your name, email, and optional wishlist to participate.',
      example: null
    },
    {
      icon: Gift,
      title: 'Get Your Match',
      description: 'When the draw happens, you\'ll receive an email with your Secret Santa match and their wishlist!',
      example: null
    },
    {
      icon: ShoppingBag,
      title: 'Buy & Surprise',
      description: 'Find the perfect gift within budget, wrap it beautifully, and watch their face light up at the party!',
      example: null
    }
  ];

  const organizerSteps = [
    {
      icon: Crown,
      title: 'Create Your Event',
      description: 'Click \'Create Event\' and enter your party name, date, and gift budget to get started.',
      example: null
    },
    {
      icon: Sparkles,
      title: 'Get Your Magic Code',
      description: 'You\'ll receive a unique code and shareable link to invite your friends and family.',
      example: 'SANTA2024'
    },
    {
      icon: Share2,
      title: 'Share with Friends',
      description: 'Send the code via WhatsApp, group chat, or email. Everyone can join with one simple code!',
      example: null
    },
    {
      icon: Eye,
      title: 'Watch Everyone Join',
      description: 'Your dashboard shows who\'s joined in real-time. See the excitement build as people sign up!',
      example: null
    },
    {
      icon: Shuffle,
      title: 'Do the Draw',
      description: 'When everyone\'s ready, click \'Draw Names\' and the magic happens automatically!',
      example: null
    },
    {
      icon: PartyPopper,
      title: 'Enjoy the Party',
      description: 'Sit back, relax, and watch the joy unfold as everyone exchanges their surprise gifts!',
      example: null
    }
  ];

  const faqs = [
    {
      question: 'Do I need to download an app?',
      answer: 'No! ChrisCandle works perfectly in any phone or computer browser. No downloads needed!'
    },
    {
      question: 'Is it free to use?',
      answer: 'Yes! ChrisCandle is completely free forever. Spread the holiday cheer without spending a penny on the platform!'
    },
    {
      question: 'What if I lose my code?',
      answer: 'No worries! Simply ask your event organizer to send it to you again. They can find it in their dashboard.'
    },
    {
      question: 'Can I change my wishlist later?',
      answer: 'Absolutely! Just visit the event again using the same code and update your wishlist anytime before the draw.'
    },
    {
      question: 'When will I know who I\'m buying for?',
      answer: 'You\'ll receive an email notification as soon as your organizer clicks \'Draw Names\'. The suspense is part of the fun!'
    },
    {
      question: 'What if someone can\'t come to the party?',
      answer: 'The organizer can easily remove participants before the draw happens. No problem at all!'
    }
  ];

  return (
    <section id="how-it-works" className="relative py-24 px-4">
      {/* Decorative Elements */}
      <div className="absolute top-40 left-10 text-6xl opacity-20 animate-float pointer-events-none">🎄</div>
      <div className="absolute top-60 right-20 text-5xl opacity-20 animate-float pointer-events-none" style={{ animationDelay: '1s' }}>⭐</div>
      <div className="absolute bottom-40 left-20 text-5xl opacity-20 animate-float pointer-events-none" style={{ animationDelay: '2s' }}>🎁</div>
      <div className="absolute bottom-60 right-10 text-6xl opacity-20 animate-float pointer-events-none" style={{ animationDelay: '0.5s' }}>❄️</div>

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-gradient-gold mb-4">
            How It Works
          </h2>
          <p className="font-body text-snow-white/80 text-lg md:text-xl max-w-2xl mx-auto">
            Spreading holiday joy is easier than ever! Follow these simple steps to create magical memories.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="bg-christmas-red-dark/50 backdrop-blur-sm rounded-full p-2 border border-gold/20 flex gap-2">
            <button
              onClick={() => setActiveTab('participant')}
              className={cn(
                'px-6 py-3 rounded-full font-body font-medium transition-all duration-300 flex items-center gap-2',
                activeTab === 'participant'
                  ? 'bg-gradient-to-r from-gold to-gold-light text-christmas-red-900 shadow-gold'
                  : 'text-snow-white/70 hover:text-snow-white'
              )}
            >
              <Gift className="w-5 h-5" />
              I'm Joining
            </button>
            <button
              onClick={() => setActiveTab('organizer')}
              className={cn(
                'px-6 py-3 rounded-full font-body font-medium transition-all duration-300 flex items-center gap-2',
                activeTab === 'organizer'
                  ? 'bg-gradient-to-r from-gold to-gold-light text-christmas-red-900 shadow-gold'
                  : 'text-snow-white/70 hover:text-snow-white'
              )}
            >
              <Crown className="w-5 h-5" />
              I'm Organizing
            </button>
          </div>
        </div>

        {/* Steps Section */}
        <div className="mb-20">
          <h3 className="font-display text-2xl md:text-3xl font-bold text-center mb-8 text-snow-white">
            {activeTab === 'participant' ? (
              <span className="flex items-center justify-center gap-3">
                <Gift className="w-8 h-8 text-gold" />
                For Participants
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <Crown className="w-8 h-8 text-gold" />
                For Organizers
              </span>
            )}
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeTab === 'participant' ? participantSteps : organizerSteps).map((step, index) => (
              <div
                key={index}
                className="group bg-christmas-red-dark/40 backdrop-blur-sm rounded-2xl p-6 border border-gold/20 hover:border-gold/40 transition-all duration-300 hover:shadow-gold relative overflow-hidden"
              >
                {/* Step Number */}
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="font-display text-gold font-bold">{index + 1}</span>
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-christmas-red-500 to-christmas-red-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <step.icon className="w-7 h-7 text-gold" />
                </div>

                {/* Content */}
                <h4 className="font-display text-xl font-bold text-snow-white mb-2 group-hover:text-gold transition-colors duration-300">
                  {step.title}
                </h4>
                <p className="font-body text-snow-white/70 text-sm leading-relaxed">
                  {step.description}
                </p>

                {/* Example Code Badge */}
                {step.example && (
                  <div className="mt-4 inline-block px-4 py-2 bg-gold/10 rounded-lg border border-gold/30">
                    <span className="font-mono text-gold text-sm font-bold">{step.example}</span>
                  </div>
                )}

                {/* Decorative Glow */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gold/5 rounded-full blur-2xl group-hover:bg-gold/10 transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h3 className="font-display text-2xl md:text-3xl font-bold text-center mb-8 text-snow-white flex items-center justify-center gap-3">
            <Heart className="w-8 h-8 text-christmas-red-500" />
            Common Questions
          </h3>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-christmas-red-dark/40 backdrop-blur-sm rounded-xl border border-gold/20 overflow-hidden transition-all duration-300 hover:border-gold/40"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-body font-medium text-snow-white pr-4">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-gold transition-transform duration-300 flex-shrink-0',
                      openFaq === index && 'rotate-180'
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300',
                    openFaq === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  <p className="px-6 pb-4 font-body text-snow-white/70 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="font-body text-snow-white/60 mb-4">Ready to spread some holiday magic?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-gold to-gold-light text-christmas-red-900 font-body font-semibold rounded-full hover:shadow-gold-lg transition-all duration-300"
            >
              <Crown className="w-5 h-5" />
              Create Event
            </Link>
            <Link
              to="/join"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-christmas-red-500/20 border border-christmas-red-500/40 text-snow-white font-body font-semibold rounded-full hover:bg-christmas-red-500/30 transition-all duration-300"
            >
              <Gift className="w-5 h-5" />
              Join Event
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
