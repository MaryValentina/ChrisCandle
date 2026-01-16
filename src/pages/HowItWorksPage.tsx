import Navbar from '../components/Navbar';
import Snowflakes from '../components/Snowflakes';
import { Gift, Users, Sparkles, Mail, PartyPopper, ShoppingBag, Crown, Share2, Eye, Shuffle, Heart, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const HowItWorksPage = () => {
  const [activeTab, setActiveTab] = useState<'participant' | 'organizer'>('participant');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const participantSteps = [
    {
      icon: Mail,
      title: 'Get Your Event Link',
      description: 'Your organizer will share a special event link with you via WhatsApp, text, email, or in person.',
      example: null
    },
    {
      icon: Sparkles,
      title: 'Open the Link',
      description: 'Click the event link to view all the party details, date, time, venue, and see who else is joining!',
      example: null
    },
    {
      icon: Eye,
      title: 'See Party Details',
      description: 'View the party date, time, venue, gift budget, and see who else is joining the festive fun!',
      example: null
    },
    {
      icon: Users,
      title: 'Join the Fun',
      description: 'Click \'Join Event\' and enter your name, email, and optional wishlist to participate. You\'re automatically ready!',
      example: null
    },
    {
      icon: Gift,
      title: 'Get Your Match',
      description: 'When the organizer runs the draw, you\'ll receive an email with your Secret Santa match and their wishlist!',
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
      title: 'Sign Up & Create Event',
      description: 'Sign up for a free account, then click \'Organize Event\' to create your Secret Santa event with name, date, time, venue, and budget.',
      example: null
    },
    {
      icon: Sparkles,
      title: 'Get Your Event Link',
      description: 'After creating your event, you\'ll receive a unique shareable link. Copy and share it with your friends and family!',
      example: null
    },
    {
      icon: Share2,
      title: 'Share with Friends',
      description: 'Send the event link via WhatsApp, group chat, or email. Everyone can join by simply clicking the link!',
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
      title: 'Run the Draw',
      description: 'Once you have at least 2 participants, click \'Run Draw\' and the magic happens automatically! Everyone gets their match via email.',
      example: null
    },
    {
      icon: PartyPopper,
      title: 'Enjoy the Party',
      description: 'Sit back, relax, and watch the joy unfold as everyone exchanges their surprise gifts! After the event, everyone can see all pairings.',
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
      question: 'What if I lose my event link?',
      answer: 'No worries! Simply ask your event organizer to send you the link again. They can find it in their dashboard and share it with you.'
    },
    {
      question: 'Can I change my wishlist later?',
      answer: 'Absolutely! Just visit the event again using the same link and update your wishlist anytime before the draw.'
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Snowflakes />
      <Navbar />
      
      {/* Decorative Elements */}
      <div className="absolute top-40 left-4 md:left-10 text-3xl md:text-6xl opacity-20 animate-float">🎄</div>
      <div className="absolute top-60 right-4 md:right-20 text-2xl md:text-5xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>⭐</div>
      <div className="absolute bottom-40 left-4 md:left-20 text-2xl md:text-5xl opacity-20 animate-float" style={{ animationDelay: '2s' }}>🎁</div>
      <div className="absolute bottom-60 right-4 md:right-10 text-3xl md:text-6xl opacity-20 animate-float" style={{ animationDelay: '0.5s' }}>❄️</div>

      <div className="container mx-auto max-w-6xl px-4 pt-24 pb-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-gradient-gold mb-4">
            How It Works
          </h1>
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
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8 text-snow-white">
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
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeTab === 'participant' ? participantSteps : organizerSteps).map((step, index) => (
              <div
                key={index}
                className="group bg-christmas-red-dark/40 backdrop-blur-sm rounded-2xl p-6 border border-gold/20 hover:border-gold/40 transition-all duration-300 hover:shadow-gold relative overflow-hidden"
              >
                {/* Step Number */}
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="font-display text-gold font-bold text-center leading-none">{index + 1}</span>
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-christmas-red-500 to-christmas-red-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <step.icon className="w-7 h-7 text-gold" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-bold text-snow-white mb-2 group-hover:text-gold transition-colors duration-300">
                  {step.title}
                </h3>
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
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8 text-snow-white flex items-center justify-center gap-3">
            <Heart className="w-8 h-8 text-christmas-red-500" />
            Common Questions
          </h2>

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

        {/* Bottom CTA - Only show for organizers */}
        {activeTab === 'organizer' && (
          <div className="text-center mt-16">
            <p className="font-body text-snow-white/60 mb-4">Ready to spread some holiday magic?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/create-event"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-gold to-gold-light text-christmas-red-900 font-body font-semibold rounded-full hover:shadow-gold-lg transition-all duration-300"
              >
                <Crown className="w-5 h-5" />
                Create Event
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HowItWorksPage;

