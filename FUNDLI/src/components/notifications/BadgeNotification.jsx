import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Share2, CheckCircle } from 'lucide-react';

const BadgeNotification = ({ notification, onClose, onMarkAsRead }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    // Auto-hide after 8 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleMarkAsRead = () => {
    if (onMarkAsRead) {
      onMarkAsRead();
    }
    handleClose();
  };

  const handleShare = async () => {
    const badgeData = notification.metadata;
    const shareText = `I just earned the "${badgeData.badgeName}" badge on Fundli! 🏅 Keep building your reliability!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Badge Earned!',
          text: shareText,
          url: window.location.origin
        });
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      } catch (error) {
        console.error('Failed to copy to clipboard');
      }
    }
  };

  if (!notification || !notification.metadata) {
    return null;
  }

  const { badgeName, icon, badgeKey } = notification.metadata;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.3 
          }}
          className="fixed top-4 right-4 z-50 max-w-sm w-full"
        >
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-2xl border border-primary-200 dark:border-primary-700 overflow-hidden">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-primary-500 to-accent-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Badge Unlocked!</h3>
                    <p className="text-sm opacity-90">Congratulations!</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Badge Content */}
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="text-6xl mb-3 animate-bounce">
                  {icon}
                </div>
                <h4 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">
                  {badgeName}
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  You've earned this badge for your reliable payment behavior!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleShare}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center text-sm"
                >
                  {isShared ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </>
                  )}
                </button>
                <button
                  onClick={handleMarkAsRead}
                  className="flex-1 bg-neutral-100 dark:bg-secondary-700 text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-secondary-600 transition-colors text-sm"
                >
                  View Badges
                </button>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="h-1 bg-neutral-200 dark:bg-secondary-700">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 8, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BadgeNotification;
