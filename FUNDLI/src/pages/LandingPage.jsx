import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { 
  DollarSign, 
  Users, 
  Shield, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  Handshake,
  Zap,
  Globe,
  Star,
  Play,
  ChevronDown,
  Menu,
  X,
  Smartphone,
  CreditCard,
  Lock,
  Award,
  Target,
  Heart,
  Lightbulb,
  Rocket,
  Sparkles,
  User
} from 'lucide-react';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);
  
  // Lottie Animation Data (you can replace these with actual Lottie JSON files)
  const heroAnimation = {
    "v": "5.7.4",
    "fr": 30,
    "ip": 0,
    "op": 90,
    "w": 400,
    "h": 400,
    "nm": "Hero Animation",
    "ddd": 0,
    "assets": [],
    "layers": [
      {
        "ddd": 0,
        "ind": 1,
        "ty": 4,
        "nm": "Circle",
        "sr": 1,
        "ks": {
          "o": {"a": 0, "k": 100},
          "r": {"a": 1, "k": [{"i": {"x": [0.667], "y": [1]}, "o": {"x": [0.333], "y": [0]}, "t": 0, "s": [0]}, {"t": 90, "s": [360]}]},
          "p": {"a": 0, "k": [200, 200, 0]},
          "a": {"a": 0, "k": [0, 0, 0]},
          "s": {"a": 0, "k": [100, 100, 100]}
        },
        "ao": 0,
        "shapes": [
          {
            "ty": "gr",
            "it": [
              {
                "d": 1,
                "ty": "el",
                "s": {"a": 0, "k": [200, 200]},
                "p": {"a": 0, "k": [0, 0]},
                "nm": "Ellipse Path 1",
                "mn": "ADBE Vector Shape - Ellipse",
                "hd": false
              },
              {
                "ty": "st",
                "c": {"a": 0, "k": [0.2, 0.6, 1, 1]},
                "o": {"a": 0, "k": 100},
                "w": {"a": 0, "k": 4},
                "lc": 1,
                "lj": 1,
                "ml": 4,
                "bm": 0,
                "nm": "Stroke 1",
                "mn": "ADBE Vector Graphic - Stroke",
                "hd": false
              },
              {
                "ty": "tr",
                "p": {"a": 0, "k": [0, 0], "ix": 2},
                "a": {"a": 0, "k": [0, 0], "ix": 1},
                "s": {"a": 0, "k": [100, 100], "ix": 3},
                "r": {"a": 0, "k": 0, "ix": 6},
                "o": {"a": 0, "k": 100, "ix": 7},
                "sk": {"a": 0, "k": 0, "ix": 4},
                "sa": {"a": 0, "k": 0, "ix": 5},
                "nm": "Transform"
              }
            ],
            "nm": "Ellipse 1",
            "np": 2,
            "cix": 2,
            "bm": 0,
            "ix": 1,
            "mn": "ADBE Vector Group",
            "hd": false
          }
        ],
        "ip": 0,
        "op": 90,
        "st": 0,
        "bm": 0
      }
    ],
    "markers": []
  };

  const features = [
    {
      icon: DollarSign,
      title: 'Direct Lending',
      description: 'Connect borrowers and lenders without traditional banking intermediaries',
      color: 'from-blue-500 to-purple-600',
      animation: 'bounce'
    },
    {
      icon: Shield,
      title: 'Secure & Trusted',
      description: 'Advanced KYC verification and secure transaction processing',
      color: 'from-green-500 to-teal-600',
      animation: 'pulse'
    },
    {
      icon: TrendingUp,
      title: 'Better Returns',
      description: 'Higher interest rates for lenders, lower fees for borrowers',
      color: 'from-orange-500 to-red-600',
      animation: 'wiggle'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Build trust through community verification and ratings',
      color: 'from-pink-500 to-rose-600',
      animation: 'float'
    }
  ];


  const steps = [
    {
      number: '01',
      title: 'Create Account',
      description: 'Sign up and complete KYC verification in minutes',
      icon: User,
      color: 'from-blue-500 to-purple-600'
    },
    {
      number: '02',
      title: 'Choose Your Role',
      description: 'Decide whether to borrow or lend based on your needs',
      icon: Target,
      color: 'from-green-500 to-teal-600'
    },
    {
      number: '03',
      title: 'Start Trading',
      description: 'Borrow funds or invest in lending pools with confidence',
      icon: Rocket,
      color: 'from-orange-500 to-red-600'
    }
  ];

  const stats = [
    { label: 'Active Users', value: '10K+', icon: Users, color: 'text-blue-500' },
    { label: 'Total Loans', value: '$2M+', icon: DollarSign, color: 'text-green-500' },
    { label: 'Success Rate', value: '98%', icon: Award, color: 'text-orange-500' },
    { label: 'Countries', value: '25+', icon: Globe, color: 'text-purple-500' }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Small Business Owner',
      content: 'Fundli helped me secure funding for my business expansion. The process was transparent and the rates were much better than traditional banks.',
      avatar: 'SJ',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Investor',
      content: 'I\'ve been earning consistent returns through Fundli\'s lending platform. The risk assessment tools are excellent.',
      avatar: 'MC',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Freelancer',
      content: 'As a freelancer, getting loans was always difficult. Fundli made it possible with their community-driven approach.',
      avatar: 'ER',
      rating: 5
    }
  ];

  const faqs = [
    {
      question: 'How does Fundli ensure security?',
      answer: 'We use advanced encryption, KYC verification, and secure transaction processing to protect all user data and funds.'
    },
    {
      question: 'What are the fees?',
      answer: 'Our fees are transparent and lower than traditional banks. We charge a small percentage only on successful transactions.'
    },
    {
      question: 'How quickly can I get a loan?',
      answer: 'Most loan applications are approved within 24-48 hours, with funds transferred within 1-3 business days.'
    },
    {
      question: 'Is my money safe?',
      answer: 'Yes, we use bank-level security measures and all transactions are insured and monitored 24/7.'
    }
  ];

  const pricingPlans = [
    {
      name: 'Borrower',
      price: '2.5%',
      period: 'per transaction',
      features: ['Up to $50K loans', '24-48hr approval', 'Flexible terms', 'No hidden fees'],
      color: 'from-blue-500 to-purple-600',
      popular: false
    },
    {
      name: 'Lender',
      price: '1.5%',
      period: 'per transaction',
      features: ['Up to 15% returns', 'Risk assessment', 'Diversified portfolio', 'Auto-invest options'],
      color: 'from-green-500 to-teal-600',
      popular: true
    },
    {
      name: 'Premium',
      price: '1%',
      period: 'per transaction',
      features: ['Priority support', 'Higher limits', 'Advanced analytics', 'Custom terms'],
      color: 'from-orange-500 to-red-600',
      popular: false
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Scroll animations
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 w-full z-50 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-bold text-neutral-900 dark:text-white">Fundli</span>
            </motion.div>

            <div className="hidden md:flex items-center space-x-8">
              <Link to="/marketplace/browse" className="text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Browse Loans
              </Link>
              <Link to="/referral" className="text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Referrals
              </Link>
              <Link to="/login" className="text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </div>

            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </motion.nav>
      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ y, opacity }}
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900 overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full blur-xl opacity-20"
          />
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-accent-400 to-primary-400 rounded-full blur-xl opacity-20"
            style={{ animationDelay: '1s' }}
          />
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-r from-secondary-400 to-primary-400 rounded-full blur-xl opacity-20"
            style={{ animationDelay: '2s' }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl mb-6 shadow-2xl">
                <Lottie 
                  animationData={heroAnimation}
                  loop={true}
                  className="w-12 h-12"
                />
              </div>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-5xl lg:text-7xl font-bold text-secondary-900 dark:text-secondary-100 mb-6 leading-tight"
            >
              The Future of{' '}
              <span className="text-gradient bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Interpersonal Lending
              </span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-xl lg:text-2xl text-neutral-600 dark:text-neutral-400 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Connect directly with borrowers and lenders. No banks, no intermediaries, 
              just people helping people with transparent, secure financial solutions.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/register"
                  className="btn-cta text-lg px-8 py-4 shadow-2xl hover:shadow-glow-primary"
                >
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/marketplace/browse"
                  className="btn-secondary text-lg px-8 py-4 shadow-xl"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap justify-center items-center gap-8 text-neutral-500 dark:text-neutral-400"
            >
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Bank-level Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>98% Success Rate</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>10K+ Happy Users</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center text-neutral-400 dark:text-neutral-500"
          >
            <span className="text-sm mb-2">Scroll to explore</span>
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-20 bg-white dark:bg-secondary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-accent-500/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl mb-4 group-hover:shadow-lg transition-all duration-300"
                >
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </motion.div>
                <motion.div 
                  className="text-4xl lg:text-5xl font-bold text-gradient mb-2"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-neutral-600 dark:text-neutral-400 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-br from-neutral-100 via-white to-primary-50 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-4xl lg:text-5xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">
                Why Choose{' '}
                <span className="text-gradient bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  Fundli?
                </span>
              </h2>
              <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed">
                We're revolutionizing the lending industry by creating direct connections 
                between borrowers and lenders with cutting-edge technology.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group"
              >
                <div className="card p-8 text-center hover:shadow-2xl transition-all duration-500 bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-neutral-200/50 dark:border-white/10 h-full">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300`}
                  >
                    <feature.icon className="h-10 w-10 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Animated border */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(45deg, transparent, transparent), linear-gradient(45deg, #3b82f6, #8b5cf6)',
                      backgroundClip: 'padding-box, border-box',
                      backgroundOrigin: 'border-box'
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-br from-white via-primary-50 to-accent-50 dark:from-secondary-800 dark:via-secondary-700 dark:to-secondary-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-10 right-10 w-32 h-32 border border-primary-200 dark:border-primary-800 rounded-full opacity-20"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-10 left-10 w-24 h-24 border border-accent-200 dark:border-accent-800 rounded-full opacity-20"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-4xl lg:text-5xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">
                How It{' '}
                <span className="text-gradient bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  Works
                </span>
              </h2>
              <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed">
                Getting started with Fundli is simple and straightforward. 
                Follow these three easy steps to begin your financial journey.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                variants={itemVariants}
                className="text-center relative group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-24 h-24 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center mx-auto mb-8 text-white shadow-2xl group-hover:shadow-glow-primary transition-all duration-300`}
                >
                  <step.icon className="h-12 w-12" />
                </motion.div>
                
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  {step.number}
                </div>
                
                <h3 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                  {step.title}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {step.description}
                </p>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary-300 to-accent-300 transform translate-x-6 origin-left"
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-neutral-100 via-white to-secondary-50 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-4xl lg:text-5xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">
                What Our{' '}
                <span className="text-gradient bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  Users Say
                </span>
              </h2>
              <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed">
                Join thousands of satisfied users who have transformed their financial lives with Fundli.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group"
              >
                <div className="card p-8 bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-neutral-200/50 dark:border-white/10 h-full">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold text-secondary-900 dark:text-secondary-100">{testimonial.name}</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{testimonial.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gradient-to-br from-white via-primary-50 to-accent-50 dark:from-secondary-800 dark:via-secondary-700 dark:to-secondary-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-4xl lg:text-5xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">
                Simple{' '}
                <span className="text-gradient bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  Pricing
                </span>
              </h2>
              <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed">
                Choose the plan that works best for you. No hidden fees, no surprises.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`relative group ${plan.popular ? 'md:-mt-8' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className={`card p-8 h-full bg-white/80 dark:bg-white/5 backdrop-blur-sm border-2 ${
                  plan.popular 
                    ? 'border-primary-500 dark:border-primary-400 shadow-2xl' 
                    : 'border-neutral-200/50 dark:border-white/10'
                }`}>
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gradient">{plan.price}</span>
                      <span className="text-neutral-600 dark:text-neutral-400 ml-2">{plan.period}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-neutral-600 dark:text-neutral-400">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/register"
                      className={`w-full py-3 px-6 rounded-xl font-semibold text-center transition-all duration-300 ${
                        plan.popular
                          ? 'btn-cta'
                          : 'btn-secondary'
                      }`}
                    >
                      Get Started
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gradient-to-br from-neutral-100 via-white to-primary-50 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-4xl lg:text-5xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">
                Frequently Asked{' '}
                <span className="text-gradient bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  Questions
                </span>
              </h2>
              <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed">
                Got questions? We've got answers. Find everything you need to know about Fundli.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="card bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-neutral-200/50 dark:border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: activeFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                  </motion.div>
                </button>
                
                <motion.div
                  initial={false}
                  animate={{ height: activeFaq === index ? 'auto' : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6">
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Start Your{' '}
                <span className="text-gradient bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                  Journey?
                </span>
              </h2>
              <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
                Join thousands of users who are already benefiting from direct lending. 
                Start building your financial future today.
              </p>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/register"
                  className="bg-white text-primary-600 hover:bg-neutral-100 font-semibold py-4 px-8 rounded-xl transition-all duration-300 inline-flex items-center shadow-2xl hover:shadow-glow-white"
                >
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/marketplace/browse"
                  className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-xl"
                >
                  Explore Marketplace
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 gap-12"
          >
            <motion.div variants={itemVariants} className="col-span-1 md:col-span-2">
              <motion.div 
                className="flex items-center space-x-3 mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <span className="text-2xl font-bold">Fundli</span>
              </motion.div>
              <p className="text-neutral-300 mb-6 max-w-md leading-relaxed">
                Revolutionizing interpersonal lending by connecting borrowers and lenders 
                directly, without traditional banking intermediaries. Building the future of finance, one connection at a time.
              </p>
              <div className="flex space-x-6">
                <motion.a 
                  href="#" 
                  className="text-neutral-400 hover:text-primary-400 transition-colors"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                >
                  <Globe className="h-6 w-6" />
                </motion.a>
                <motion.a 
                  href="#" 
                  className="text-neutral-400 hover:text-primary-400 transition-colors"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                >
                  <Heart className="h-6 w-6" />
                </motion.a>
                <motion.a 
                  href="#" 
                  className="text-neutral-400 hover:text-primary-400 transition-colors"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                >
                  <Sparkles className="h-6 w-6" />
                </motion.a>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <h3 className="font-semibold text-lg mb-6 text-white">Platform</h3>
              <ul className="space-y-3 text-neutral-300">
                <li>
                  <Link to="/marketplace/browse" className="hover:text-primary-400 transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Browse Loans
                  </Link>
                </li>
                <li>
                  <Link to="/referral" className="hover:text-primary-400 transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Referrals
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-400 transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    How It Works
                  </a>
                </li>
                <li>
                  <Link to="/login" className="hover:text-primary-400 transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </li>
              </ul>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <h3 className="font-semibold text-lg mb-6 text-white">Support</h3>
              <ul className="space-y-3 text-neutral-300">
                <li>
                  <a href="#" className="hover:text-primary-400 transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-400 transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-400 transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-400 transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Terms of Service
                  </a>
                </li>
              </ul>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="border-t border-secondary-700 mt-12 pt-8 text-center text-neutral-400"
          >
            <p>&copy; 2024 Fundli. All rights reserved. Built with ❤️ for the future of finance.</p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 