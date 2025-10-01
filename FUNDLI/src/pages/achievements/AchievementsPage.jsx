import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Target, 
  Award, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  ArrowLeft,
  Share2,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const AchievementsPage = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all'); // all, earned, unearned
  const [sortBy, setSortBy] = useState('points'); // points, name, earned

  // Badge system data
  const badgesCatalog = [
    { key: 'seed', name: 'Seed Starter', min: 10, icon: '🌱', description: 'Complete your first on-time payment' },
    { key: 'sprout', name: 'Sprout Saver', min: 30, icon: '🌿', description: 'Build a foundation of reliability' },
    { key: 'ember', name: 'Ember Earner', min: 60, icon: '🔥', description: 'Show consistent payment behavior' },
    { key: 'river', name: 'River Reliable', min: 100, icon: '🌊', description: 'Demonstrate steady financial flow' },
    { key: 'steel', name: 'Steel Steady', min: 150, icon: '🛡️', description: 'Prove unshakeable reliability' },
    { key: 'hawk', name: 'Hawk Honest', min: 210, icon: '🦅', description: 'Earn trust through transparency' },
    { key: 'oak', name: 'Oak On‑time', min: 280, icon: '🌳', description: 'Stand strong with punctual payments' },
    { key: 'aurum', name: 'Aurum Achiever', min: 360, icon: '🏅', description: 'Achieve golden reliability status' },
    { key: 'titan', name: 'Titan Trustworthy', min: 450, icon: '🏆', description: 'Become a pillar of trust' },
    { key: 'legend', name: 'Legendary Lender‑Friend', min: 550, icon: '👑', description: 'Reach the pinnacle of reliability' }
  ];

  const getNextBadge = () => {
    const currentPoints = user?.reliabilityPoints || 0;
    const ownedKeys = new Set((user?.badges || []).map(b => b.key));
    return badgesCatalog.find(badge => !ownedKeys.has(badge.key) && badge.min > currentPoints);
  };

  const getProgressToNextBadge = () => {
    const currentPoints = user?.reliabilityPoints || 0;
    const nextBadge = getNextBadge();
    if (!nextBadge) return { progress: 100, pointsNeeded: 0 };
    
    const previousBadge = badgesCatalog
      .filter(b => b.min <= currentPoints)
      .sort((a, b) => b.min - a.min)[0];
    
    const startPoints = previousBadge ? previousBadge.min : 0;
    const endPoints = nextBadge.min;
    const progress = ((currentPoints - startPoints) / (endPoints - startPoints)) * 100;
    const pointsNeeded = endPoints - currentPoints;
    
    return { progress: Math.min(100, Math.max(0, progress)), pointsNeeded };
  };

  const getFilteredBadges = () => {
    let filtered = badgesCatalog;

    // Apply filter
    if (filter === 'earned') {
      filtered = filtered.filter(badge => 
        user?.badges?.some(userBadge => userBadge.key === badge.key)
      );
    } else if (filter === 'unearned') {
      filtered = filtered.filter(badge => 
        !user?.badges?.some(userBadge => userBadge.key === badge.key)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return a.min - b.min;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'earned':
          const aEarned = user?.badges?.some(userBadge => userBadge.key === a.key);
          const bEarned = user?.badges?.some(userBadge => userBadge.key === b.key);
          if (aEarned && !bEarned) return -1;
          if (!aEarned && bEarned) return 1;
          return a.min - b.min;
        default:
          return a.min - b.min;
      }
    });

    return filtered;
  };

  const shareAchievement = (badge) => {
    if (navigator.share) {
      navigator.share({
        title: `I earned the ${badge.name} badge!`,
        text: `I just earned the ${badge.name} badge on Fundli! ${badge.description}`,
        url: window.location.origin
      });
    } else {
      // Fallback: copy to clipboard
      const text = `I earned the ${badge.name} badge on Fundli! ${badge.description}`;
      navigator.clipboard.writeText(text).then(() => {
        alert('Achievement copied to clipboard!');
      });
    }
  };

  if (user?.role !== 'borrower') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
            Achievements Available for Borrowers
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Badge achievements are designed for borrowers to track their reliability and payment history.
          </p>
          <Link
            to="/dashboard"
            className="btn-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2 flex items-center">
              <Trophy className="h-8 w-8 mr-3 text-primary-600" />
              Achievement Badges
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Track your reliability progress and earn badges for consistent payments
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Total Points
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {user?.reliabilityPoints || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
              <Star className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Badges Earned
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {user?.badges?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/20 rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-accent-600 dark:text-accent-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Collection
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {Math.round(((user?.badges?.length || 0) / badgesCatalog.length) * 100)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Next Badge
              </p>
              <p className="text-lg font-bold text-secondary-900 dark:text-white">
                {getNextBadge() ? getNextBadge().name : 'Complete!'}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/20 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progress to Next Badge */}
      {getNextBadge() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-lg border border-primary-200 dark:border-primary-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white flex items-center">
                <Target className="h-5 w-5 mr-2 text-primary-600" />
                Progress to {getNextBadge().name}
              </h3>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {getProgressToNextBadge().pointsNeeded} points needed
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-secondary-700 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-primary-500 to-accent-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${getProgressToNextBadge().progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400 mt-2">
              <span>{user?.reliabilityPoints || 0} points</span>
              <span>{getNextBadge().min} points</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-neutral-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">All Badges</option>
            <option value="earned">Earned</option>
            <option value="unearned">Not Earned</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-neutral-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field text-sm"
          >
            <option value="points">Points Required</option>
            <option value="name">Name</option>
            <option value="earned">Earned Status</option>
          </select>
        </div>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredBadges().map((badge, index) => {
          const isEarned = user?.badges?.some(userBadge => userBadge.key === badge.key);
          const earnedBadge = user?.badges?.find(userBadge => userBadge.key === badge.key);
          
          return (
            <motion.div
              key={badge.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`relative p-6 rounded-lg border-2 transition-all duration-300 ${
                isEarned 
                  ? 'bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30 border-primary-300 dark:border-primary-700 shadow-lg' 
                  : 'bg-white dark:bg-secondary-800 border-neutral-200 dark:border-secondary-700'
              }`}
            >
              {/* Badge Icon and Status */}
              <div className="text-center mb-4">
                <div className={`text-6xl mb-2 ${isEarned ? '' : 'grayscale opacity-50'}`}>
                  {badge.icon}
                </div>
                {isEarned && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                )}
              </div>

              {/* Badge Info */}
              <div className="text-center mb-4">
                <h3 className={`text-lg font-semibold mb-2 ${
                  isEarned 
                    ? 'text-secondary-900 dark:text-white' 
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}>
                  {badge.name}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  {badge.description}
                </p>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isEarned 
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300' 
                    : 'bg-neutral-100 text-neutral-600 dark:bg-secondary-700 dark:text-neutral-400'
                }`}>
                  <Star className="h-3 w-3 mr-1" />
                  {badge.min} points
                </div>
              </div>

              {/* Earned Date */}
              {isEarned && earnedBadge?.earnedAt && (
                <div className="text-center mb-4">
                  <p className="text-xs text-success flex items-center justify-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Earned {new Date(earnedBadge.earnedAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Share Button for Earned Badges */}
              {isEarned && (
                <div className="text-center">
                  <button
                    onClick={() => shareAchievement(badge)}
                    className="btn-outline text-sm py-2 px-4"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Achievement
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {getFilteredBadges().length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
            No badges found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            Try adjusting your filters to see more badges.
          </p>
        </div>
      )}
    </div>
  );
};

export default AchievementsPage;
