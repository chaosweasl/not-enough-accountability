export interface WebsiteCategory {
  id: string;
  name: string;
  description: string;
  domains: string[];
  icon: string;
}

export const WEBSITE_CATEGORIES: WebsiteCategory[] = [
  {
    id: "adult",
    name: "Adult Content",
    description: "Block adult and pornographic websites",
    icon: "🔞",
    domains: [
      "pornhub.com",
      "xvideos.com",
      "xnxx.com",
      "xhamster.com",
      "redtube.com",
      "youporn.com",
      "tube8.com",
      "spankbang.com",
      "txxx.com",
      "porn.com",
      "eporner.com",
      "hqporner.com",
      "onlyfans.com",
    ],
  },
  {
    id: "social",
    name: "Social Media",
    description: "Block social networking platforms",
    icon: "📱",
    domains: [
      "facebook.com",
      "instagram.com",
      "twitter.com",
      "x.com",
      "tiktok.com",
      "snapchat.com",
      "reddit.com",
      "linkedin.com",
      "pinterest.com",
      "tumblr.com",
      "whatsapp.com",
      "web.whatsapp.com",
      "discord.com",
      "threads.net",
    ],
  },
  {
    id: "video",
    name: "Video Streaming",
    description: "Block video streaming platforms",
    icon: "📺",
    domains: [
      "youtube.com",
      "m.youtube.com",
      "netflix.com",
      "twitch.tv",
      "hulu.com",
      "disneyplus.com",
      "primevideo.com",
      "hbomax.com",
      "max.com",
      "vimeo.com",
      "dailymotion.com",
      "crunchyroll.com",
    ],
  },
  {
    id: "gaming",
    name: "Gaming",
    description: "Block gaming and game-related websites",
    icon: "🎮",
    domains: [
      "steam.com",
      "store.steampowered.com",
      "steamcommunity.com",
      "epicgames.com",
      "roblox.com",
      "minecraft.net",
      "blizzard.com",
      "battle.net",
      "riot.com",
      "leagueoflegends.com",
      "valorant.com",
      "playvalorant.com",
      "ea.com",
      "origin.com",
      "ubisoft.com",
      "ign.com",
      "gamespot.com",
    ],
  },
  {
    id: "shopping",
    name: "Online Shopping",
    description: "Block e-commerce and shopping websites",
    icon: "🛒",
    domains: [
      "amazon.com",
      "ebay.com",
      "walmart.com",
      "target.com",
      "aliexpress.com",
      "wish.com",
      "etsy.com",
      "shopify.com",
      "bestbuy.com",
      "newegg.com",
    ],
  },
  {
    id: "news",
    name: "News & Media",
    description: "Block news websites and media outlets",
    icon: "📰",
    domains: [
      "cnn.com",
      "bbc.com",
      "nytimes.com",
      "washingtonpost.com",
      "theguardian.com",
      "foxnews.com",
      "reuters.com",
      "apnews.com",
      "bloomberg.com",
      "wsj.com",
    ],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Block entertainment and gossip websites",
    icon: "🎭",
    domains: [
      "buzzfeed.com",
      "tmz.com",
      "9gag.com",
      "imgur.com",
      "giphy.com",
      "memes.com",
      "knowyourmeme.com",
    ],
  },
];

// Helper function to get all domains from selected categories
export function getDomainsFromCategories(categoryIds: string[]): string[] {
  const domains: string[] = [];

  for (const categoryId of categoryIds) {
    const category = WEBSITE_CATEGORIES.find((c) => c.id === categoryId);
    if (category) {
      domains.push(...category.domains);
    }
  }

  return domains;
}

// Helper function to normalize domain (remove protocol, www variations)
export function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, "") // Remove protocol
    .replace(/^www\./, "") // Remove www
    .replace(/\/$/, "") // Remove trailing slash
    .split("/")[0]; // Keep only domain, remove path
}
