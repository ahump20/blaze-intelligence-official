import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShareIcon,
  XMarkIcon,
  LinkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import {
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  TelegramIcon,
  WhatsappIcon,
  RedditIcon,
} from 'react-share';
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  TelegramShareButton,
  WhatsappShareButton,
  RedditShareButton,
} from 'react-share';
import toast from 'react-hot-toast';

interface SocialSharingProps {
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  gameData?: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    status: string;
    prediction?: string;
  };
  predictionData?: {
    matchup: string;
    prediction: string;
    confidence: number;
    reasoning?: string;
  };
  className?: string;
}

const SocialSharing: React.FC<SocialSharingProps> = ({
  url = window.location.href,
  title = 'Check out this sports prediction from Blaze Intelligence',
  description = 'Advanced AI-powered sports analytics and predictions',
  image = `${window.location.origin}/og-image.png`,
  gameData,
  predictionData,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate dynamic content based on data
  const generateShareContent = () => {
    if (predictionData) {
      return {
        title: `🏈 AI Prediction: ${predictionData.matchup}`,
        description: `Prediction: ${predictionData.prediction} (${predictionData.confidence}% confidence) | ${predictionData.reasoning || 'Powered by advanced ML models'} #SportsPrediction #AI`,
        hashtags: ['SportsPrediction', 'AI', 'BlazeIntelligence'],
      };
    }

    if (gameData) {
      return {
        title: `🔥 Live Game Update: ${gameData.homeTeam} vs ${gameData.awayTeam}`,
        description: `Current Score: ${gameData.homeTeam} ${gameData.homeScore} - ${gameData.awayScore} ${gameData.awayTeam} | Status: ${gameData.status.toUpperCase()} ${gameData.prediction ? `| Prediction: ${gameData.prediction}` : ''} #LiveSports #GameUpdate`,
        hashtags: ['LiveSports', 'GameUpdate', 'BlazeIntelligence'],
      };
    }

    return {
      title,
      description,
      hashtags: ['SportsAnalytics', 'AI', 'BlazeIntelligence'],
    };
  };

  const shareContent = generateShareContent();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const trackShare = (platform: string) => {
    // Analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: platform,
        content_type: gameData ? 'game_update' : predictionData ? 'prediction' : 'general',
        item_id: gameData?.homeTeam || predictionData?.matchup || 'general',
      });
    }
    console.log(`Shared on ${platform}:`, shareContent);
  };

  const socialPlatforms = [
    {
      name: 'Twitter',
      component: TwitterShareButton,
      icon: TwitterIcon,
      props: {
        title: shareContent.description,
        hashtags: shareContent.hashtags,
      },
      color: '#1DA1F2',
    },
    {
      name: 'Facebook',
      component: FacebookShareButton,
      icon: FacebookIcon,
      props: {
        quote: shareContent.description,
      },
      color: '#1877F2',
    },
    {
      name: 'LinkedIn',
      component: LinkedinShareButton,
      icon: LinkedinIcon,
      props: {
        title: shareContent.title,
        summary: shareContent.description,
        source: 'Blaze Intelligence',
      },
      color: '#0A66C2',
    },
    {
      name: 'WhatsApp',
      component: WhatsappShareButton,
      icon: WhatsappIcon,
      props: {
        title: `${shareContent.title}\n\n${shareContent.description}`,
      },
      color: '#25D366',
    },
    {
      name: 'Telegram',
      component: TelegramShareButton,
      icon: TelegramIcon,
      props: {
        title: `${shareContent.title}\n\n${shareContent.description}`,
      },
      color: '#0088CC',
    },
    {
      name: 'Reddit',
      component: RedditShareButton,
      icon: RedditIcon,
      props: {
        title: shareContent.title,
      },
      color: '#FF4500',
    },
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Share Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center space-x-2 bg-blaze-600 text-white px-4 py-2 rounded-lg hover:bg-blaze-700 transition-colors shadow-md"
      >
        <ShareIcon className="w-4 h-4" />
        <span className="text-sm font-medium">Share</span>
      </motion.button>

      {/* Share Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            >
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Share this content</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Preview */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-1">{shareContent.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-3">{shareContent.description}</p>
                  <div className="flex items-center space-x-1 mt-2">
                    {shareContent.hashtags.map((tag) => (
                      <span key={tag} className="text-xs text-blaze-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Copy Link */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share Link
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={url}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {copied ? (
                        <CheckIcon className="w-4 h-4 text-green-600" />
                      ) : (
                        <LinkIcon className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Social Platforms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Share on Social Media
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {socialPlatforms.map((platform) => {
                      const ShareButton = platform.component;
                      const Icon = platform.icon;
                      
                      return (
                        <ShareButton
                          key={platform.name}
                          url={url}
                          {...platform.props}
                          onShareWindowClose={() => trackShare(platform.name)}
                          className="group"
                        >
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group-hover:shadow-md"
                          >
                            <Icon
                              size={32}
                              round
                              className="mb-2"
                            />
                            <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                              {platform.name}
                            </span>
                          </motion.div>
                        </ShareButton>
                      );
                    })}
                  </div>
                </div>

                {/* Native Share API (Mobile) */}
                {navigator.share && (
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        navigator.share({
                          title: shareContent.title,
                          text: shareContent.description,
                          url: url,
                        }).then(() => {
                          trackShare('native');
                          setIsOpen(false);
                        }).catch(console.error);
                      }}
                      className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors"
                    >
                      More Sharing Options
                    </button>
                  </div>
                )}

                {/* Analytics Note */}
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Share your insights with the sports community and help others discover Blaze Intelligence!
                </p>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Quick Share Button Component for inline usage
export const QuickShareButton: React.FC<{
  url?: string;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}> = ({ 
  url = window.location.href, 
  title = 'Check out Blaze Intelligence',
  description = 'Advanced sports analytics and predictions',
  size = 'md',
  variant = 'primary'
}) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleQuickShare = async () => {
    setIsSharing(true);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        toast.success('Shared successfully!');
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${title}\n\n${description}\n\n${url}`);
        toast.success('Link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to share');
      }
    }
    
    setIsSharing(false);
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const variantClasses = {
    primary: 'bg-blaze-600 text-white hover:bg-blaze-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border border-blaze-600 text-blaze-600 hover:bg-blaze-50',
  };

  return (
    <motion.button
      onClick={handleQuickShare}
      disabled={isSharing}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        inline-flex items-center space-x-2 rounded-lg font-medium transition-colors disabled:opacity-50
        ${sizeClasses[size]} ${variantClasses[variant]}
      `}
    >
      <ShareIcon className="w-4 h-4" />
      <span>{isSharing ? 'Sharing...' : 'Share'}</span>
    </motion.button>
  );
};

export default SocialSharing;