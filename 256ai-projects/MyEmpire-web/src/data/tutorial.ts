// ─────────────────────────────────────────
// TUTORIAL SYSTEM — Step definitions
// ─────────────────────────────────────────

export interface TutorialStep {
  id: string;
  title: string;
  message: string;
  /** CSS selector to highlight (spotlight). null = center modal. */
  target: string | null;
  /** Which view/tab the player must be on for this step */
  requiredView?: 'operation' | 'city' | 'legal' | 'finance';
  /** Action that advances to the next step. null = click "Got it" button. */
  advanceOn?: 'harvest' | 'sell' | 'plant' | 'buy-seed' | 'hire-dealer' | 'switch-city' | 'switch-legal' | 'switch-finance' | 'switch-operation' | 'buy-lot' | 'buy-business';
  /** Position of tooltip relative to target */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // ── WELCOME ──
  {
    id: 'welcome',
    title: 'Welcome to My Empire! 👑',
    message: "You're about to build a criminal empire from nothing. Let's walk through the basics so you know what you're doing. Ready?",
    target: null,
    position: 'center',
  },

  // ── OPERATION TAB ──
  {
    id: 'operation-intro',
    title: 'Your Operation 🌿',
    message: "This is your Operation tab — where you grow product. You've got a small grow closet to start. See that plant? It's ready to harvest!",
    target: null,
    requiredView: 'operation',
    position: 'center',
  },
  {
    id: 'harvest',
    title: 'Harvest Your Crop 🌾',
    message: "Tap the HARVEST button on your grow room to collect your first batch. Go ahead — tap it now!",
    target: '[data-tutorial="harvest-btn"]',
    requiredView: 'operation',
    advanceOn: 'harvest',
    position: 'top',
  },
  {
    id: 'product-stash',
    title: 'Nice! Product in Stash 💰',
    message: "You just harvested product! See your inventory at the top — that's your stash. Now you need to sell it to make money.",
    target: null,
    requiredView: 'operation',
    position: 'center',
  },
  {
    id: 'sell-product',
    title: 'Sell Your Product 🤑',
    message: "Scroll down and tap SELL to push product to your dealers. Even with no dealers hired, you can sell on the street.",
    target: '[data-tutorial="sell-btn"]',
    requiredView: 'operation',
    advanceOn: 'sell',
    position: 'top',
  },
  {
    id: 'dirty-cash',
    title: 'Dirty Cash! 💵',
    message: "You earned dirty cash! Look at the top of the screen — 💵 is dirty cash (from crime). You'll need to launder it later. For now, let's plant more seeds.",
    target: null,
    requiredView: 'operation',
    position: 'center',
  },
  {
    id: 'buy-seeds',
    title: 'Buy Seeds 🌱',
    message: "Tap BUY SEEDS to stock up. Seeds cost dirty cash. The more you buy, the cheaper per unit.",
    target: '[data-tutorial="buy-seed-btn"]',
    requiredView: 'operation',
    advanceOn: 'buy-seed',
    position: 'top',
  },
  {
    id: 'plant-seeds',
    title: 'Plant Seeds 🌱',
    message: "Now tap PLANT on your grow room to start the next cycle. Your plants will grow automatically!",
    target: '[data-tutorial="plant-btn"]',
    requiredView: 'operation',
    advanceOn: 'plant',
    position: 'top',
  },
  {
    id: 'auto-harvest',
    title: 'Auto-Harvest Tip 💡',
    message: "See the upgrades panel? You can buy AUTO-HARVEST later so plants harvest themselves. For now, let's check out the other tabs.",
    target: null,
    requiredView: 'operation',
    position: 'center',
  },

  // ── CITY TAB ──
  {
    id: 'switch-city',
    title: 'City Tab 🏙️',
    message: "Tap the CITY tab at the bottom to see the city map. This is where you buy front businesses to launder dirty cash into clean cash.",
    target: '[data-tutorial="nav-city"]',
    advanceOn: 'switch-city',
    position: 'top',
  },
  {
    id: 'city-intro',
    title: 'The City Map 🏙️',
    message: "Each colored block is a district. You can buy lots and build businesses here. Businesses are FRONTS — they turn dirty cash into clean cash through laundering.",
    target: null,
    requiredView: 'city',
    position: 'center',
  },
  {
    id: 'city-districts',
    title: 'Districts & Lots 🏗️',
    message: "You start with the Starter Neighborhood unlocked. You have 2 free lots — tap an empty lot (+) to place a business. Other lots can be purchased with clean cash. New districts unlock as you earn more money.",
    target: null,
    requiredView: 'city',
    position: 'center',
  },

  // ── LEGAL TAB ──
  {
    id: 'switch-legal',
    title: 'Legal Tab ⚖️',
    message: "Now tap the LEGAL tab. This is where you manage your heat level, hire lawyers, and get legit jobs.",
    target: '[data-tutorial="nav-legal"]',
    advanceOn: 'switch-legal',
    position: 'top',
  },
  {
    id: 'legal-intro',
    title: 'Heat & The Law ⚖️',
    message: "HEAT is how much attention you're getting from the police. Selling product, running businesses, and rival activity all increase heat. Too much heat = busted! Hire lawyers and lay low to reduce it.",
    target: null,
    requiredView: 'legal',
    position: 'center',
  },
  {
    id: 'legal-jobs',
    title: 'Get a Job 💼',
    message: "Jobs pay clean cash and give you a cover story. Some jobs boost your businesses too. Apply for one when you can — it's free money!",
    target: null,
    requiredView: 'legal',
    position: 'center',
  },

  // ── STATS TAB ──
  {
    id: 'switch-finance',
    title: 'Stats Tab 📊',
    message: "Tap the STATS tab to see your empire's performance — income, expenses, and net worth.",
    target: '[data-tutorial="nav-finance"]',
    advanceOn: 'switch-finance',
    position: 'top',
  },
  {
    id: 'finance-intro',
    title: 'Your Empire Stats 📊',
    message: "This dashboard shows your cash flow, total earnings, and empire net worth. Keep an eye on it as you grow!",
    target: null,
    requiredView: 'finance',
    position: 'center',
  },

  // ── WRAP UP ──
  {
    id: 'two-currencies',
    title: 'Two Currencies 💵🏦',
    message: "Remember: 💵 Dirty Cash comes from crime (growing & selling). 🏦 Clean Cash comes from laundering through businesses and jobs. You need clean cash to buy lots, unlock districts, and hire lawyers.",
    target: null,
    position: 'center',
  },
  {
    id: 'rivals-warning',
    title: 'Watch Your Back! 👀',
    message: "As you grow, rival gangs will enter the city. They'll steal your cash, raid your stash, and attack your businesses. Hire hitmen to protect yourself!",
    target: null,
    position: 'center',
  },
  {
    id: 'tutorial-complete',
    title: "You're Ready! 🎉",
    message: "That's the basics! Grow, sell, launder, expand. Build your empire and watch out for the law. Good luck, Kingpin!",
    target: null,
    position: 'center',
  },
];
