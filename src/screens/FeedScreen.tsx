import React, { useState } from 'react';
import type { FeedPost, PuddleFriend, Spot, SpotComment } from '../types/spot';
import { Flame, MapPin, MessageSquare } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { UrineRating } from '../components/UrineDrop';
import { SpotCommentsModal } from '../components/SpotCommentsModal';
import { getSpotRatings, calcAverageRating } from '../utils/rating';

interface FeedScreenProps {
  posts: FeedPost[];
  onSelectSpotOnMap: (spotId: string) => void;
  puddleFriends?: PuddleFriend[];
  onTogglePuddleFriend?: (authorData: { username: string; handle: string; avatar: string }) => void;
  spots?: Spot[];
  onAddComment?: (spotId: string, comment: SpotComment) => void;
  currentUser?: {
    username: string;
    avatar: string;
    handle?: string;
  };
}

const renderAvatar = (avatar?: string) => {
  if (!avatar) return '👤';
  if (avatar.startsWith('data:image') || avatar.startsWith('http') || avatar.startsWith('blob:')) {
    return <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />;
  }
  return <span>{avatar}</span>;
};

export const FeedScreen: React.FC<FeedScreenProps> = ({
  posts: initialPosts,
  onSelectSpotOnMap,
  puddleFriends = [],
  onTogglePuddleFriend,
  spots,
  onAddComment,
  currentUser
}) => {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [activeCommentSpot, setActiveCommentSpot] = useState<Spot | null>(null);

  const handleReaction = (postId: string, reactionType: keyof FeedPost['reactions']) => {
    soundFx.playDroplet();
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const currentReactions = { ...p.reactions };
        currentReactions[reactionType] = (currentReactions[reactionType] || 0) + 1;
        return {
          ...p,
          reactions: currentReactions,
          userReaction: reactionType
        };
      })
    );
  };

  return (
    <div className="w-full h-full text-black dark:text-white flex flex-col overflow-y-auto custom-scroll p-4 pb-24 transition-colors duration-150 relative z-10">
      
      {/* Feed Header */}
      <header className="max-w-xl mx-auto w-full pt-3 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#111827] border border-black dark:border-slate-800 flex items-center justify-center text-black dark:text-yellow-400 shadow-sm">
            <Flame className="w-5 h-5 fill-current text-amber-500 dark:text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-black dark:text-white">
              ŽIVÝ PROUD
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">live stream</p>
          </div>
        </div>
      </header>

      {/* Posts List */}
      <div className="max-w-xl mx-auto w-full space-y-3.5 mt-1">
        {posts.map((post) => {
          const allImages = post.images && post.images.length > 0 
            ? post.images 
            : post.imageUrl 
              ? [post.imageUrl] 
              : [];

          const isCurrentUser = post.author.includes('Ty') || post.authorHandle === '@LordOfStreams';
          const isFriend = puddleFriends.some(
            (f) => f.isFriend && (f.handle.toLowerCase() === post.authorHandle.toLowerCase() || f.username === post.author)
          );

          return (
            <article
              key={post.id}
              className="bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden transition-colors text-black dark:text-white"
            >
              {/* Top Post Info */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-[#1f2937] border border-black text-black dark:text-white flex items-center justify-center text-lg font-black overflow-hidden flex-shrink-0">
                    {renderAvatar(post.authorAvatar)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-sm text-black dark:text-white">{post.author}</span>
                      {!isCurrentUser && (
                        <button
                          type="button"
                          onClick={() => onTogglePuddleFriend?.({
                            username: post.author,
                            handle: post.authorHandle,
                            avatar: post.authorAvatar
                          })}
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border border-black transition active:scale-95 ${
                            isFriend
                              ? 'bg-amber-300 text-black hover:bg-amber-400'
                              : 'bg-[#facc15] hover:bg-yellow-400 text-black'
                          }`}
                        >
                          {isFriend ? '✓ V louži' : '+ Do louže'}
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-bold">
                      <span>{post.timeAgo}</span>
                      {post.distance && <span>• 📍 {post.distance}</span>}
                    </div>
                  </div>
                </div>

                {/* Rating with Yellow Urine Droplets */}
                <div className="text-right">
                  <UrineRating rating={post.rating} size="xs" />
                </div>
              </div>

              {/* Spot Card Preview within Post */}
              <div 
                onClick={() => onSelectSpotOnMap(post.spotId)}
                className="my-2.5 bg-slate-50 dark:bg-[#030712]/50 border border-black/20 dark:border-slate-800 rounded-2xl p-3.5 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm flex items-center gap-1.5 text-black dark:text-yellow-300">
                    <MapPin className="w-4 h-4 text-amber-600 dark:text-yellow-400" />
                    {post.spotTitle}
                  </span>
                  <span className="text-[10px] text-slate-700 dark:text-slate-400 font-black">
                    Na mapě →
                  </span>
                </div>

                {/* Photo thumbnails if attached */}
                {allImages.length > 0 && (
                  <div className="flex gap-1.5 mt-2 overflow-x-auto custom-scroll pb-1">
                    {allImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="Foto zářezu"
                        className="w-16 h-16 rounded-xl object-cover border border-black flex-shrink-0"
                      />
                    ))}
                  </div>
                )}

                {post.epiphany && (
                  <div className="mt-2 text-xs italic text-slate-800 dark:text-slate-300 border-l-2 border-black dark:border-yellow-400 pl-2.5 py-0.5 font-medium">
                    <span className="font-black not-italic mr-1 text-black dark:text-yellow-400">💭</span>
                    "{post.epiphany}"
                  </div>
                )}
              </div>

              {/* Reactions Bar */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleReaction(post.id, 'paper')}
                    className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-black transition ${
                      post.userReaction === 'paper'
                        ? 'bg-[#facc15] text-black font-black'
                        : 'bg-slate-50 dark:bg-[#030712] text-black dark:text-slate-200 hover:bg-slate-100'
                    }`}
                    title="Podej toaletní papír"
                  >
                    <span>🧻</span>
                    <span className="font-mono text-[11px] font-black">{post.reactions.paper}</span>
                  </button>

                  <button
                    onClick={() => handleReaction(post.id, 'target')}
                    className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-black transition ${
                      post.userReaction === 'target'
                        ? 'bg-[#facc15] text-black font-black'
                        : 'bg-slate-50 dark:bg-[#030712] text-black dark:text-slate-200 hover:bg-slate-100'
                    }`}
                    title="Čistý zásah terče"
                  >
                    <span>🎯</span>
                    <span className="font-mono text-[11px] font-black">{post.reactions.target}</span>
                  </button>

                  <button
                    onClick={() => handleReaction(post.id, 'respect')}
                    className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-black transition ${
                      post.userReaction === 'respect'
                        ? 'bg-[#facc15] text-black font-black'
                        : 'bg-slate-50 dark:bg-[#030712] text-black dark:text-slate-200 hover:bg-slate-100'
                    }`}
                    title="Respekt za odvahu"
                  >
                    <span>🫡</span>
                    <span className="font-mono text-[11px] font-black">{post.reactions.respect}</span>
                  </button>

                  <button
                    onClick={() => handleReaction(post.id, 'skunk')}
                    className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-black transition ${
                      post.userReaction === 'skunk'
                        ? 'bg-[#facc15] text-black font-black'
                        : 'bg-slate-50 dark:bg-[#030712] text-black dark:text-slate-200 hover:bg-slate-100'
                    }`}
                    title="Cítím to až sem"
                  >
                    <span>🦨</span>
                    <span className="font-mono text-[11px] font-black">{post.reactions.skunk}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playDroplet();
                    const targetSpot = spots?.find((s) => s.id === post.spotId) || {
                      id: post.spotId,
                      title: post.spotTitle,
                      category: 'view',
                      lat: 0,
                      lng: 0,
                      author: post.author,
                      authorHandle: post.authorHandle,
                      authorScope: 'world',
                      rating: post.rating,
                      reviewsCount: 1,
                      metrics: { view: 5, privacy: 4, smell: 3, wind: 4, amenities: 2, splashback: 0 },
                      ground: 'trava',
                      createdAt: post.timeAgo,
                      epiphany: post.epiphany
                    } as Spot;
                    setActiveCommentSpot(targetSpot);
                  }}
                  className="p-2 bg-[#facc15] hover:bg-yellow-400 text-black border border-black rounded-xl flex items-center justify-center transition shadow-2xs active:scale-95 ml-auto"
                  title="Komentáře a hodnocení"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>

            </article>
          );
        })}
      </div>

      {/* Spot Comments & Rating Modal directly inside Feed */}
      {activeCommentSpot && (
        <SpotCommentsModal
          isOpen={!!activeCommentSpot}
          onClose={() => setActiveCommentSpot(null)}
          spot={activeCommentSpot}
          onAddComment={(spotId, comment) => {
            onAddComment?.(spotId, comment);
            setActiveCommentSpot((prev) => {
              if (!prev || prev.id !== spotId) return prev;
              const newComments = [comment, ...(prev.comments || [])];
              const prevRatings = getSpotRatings(prev);
              const updatedRatings = [...prevRatings, comment.rating];
              const calculatedRating = calcAverageRating(updatedRatings);
              return {
                ...prev,
                reviewsCount: prev.reviewsCount + 1,
                rating: calculatedRating,
                ratings: updatedRatings,
                comments: newComments
              };
            });
          }}
          currentUser={currentUser}
        />
      )}

    </div>
  );
};
