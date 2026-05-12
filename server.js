const express = require('express');
const cors = require('express');
const path = require('path');

const app = express();

// CORS + JSON parsing
app.use(cors());
app.use(express.json());

// SERVE FRONTEND FILES (this fixes everything)
app.use(express.static(path.join(__dirname)));

// Timeout
app.use((req, res, next) => {
    req.setTimeout(500);
    res.setTimeout(500);
    next();
});

// ===== MOCK DATA =====
const generateMockData = () => ({
    user: { id: "rahul_demo_001", name: "Rahul Sharma", age: 26, city: "Bangalore", salary: 52000, salary_day: 1, persona_preference: "bhai" },
    dna: { weekend_spike: true, month_end_impulse: true, salary_party: true, food_delivery_addict: true, stress_spend: false },
    commitments: [
        { id: "c1", name: "Home Loan EMI", amount: 8500, due_day: 5, category: "loan", locked: true },
        { id: "c2", name: "1BHK Rent Whitefield", amount: 14000, due_day: 1, category: "housing", locked: true },
        { id: "c3", name: "SIP Nifty 50", amount: 5000, due_day: 10, category: "investment", locked: true },
        { id: "c4", name: "iPhone 15 EMI", amount: 3500, due_day: 15, category: "loan", locked: true },
        { id: "c5", name: "Netflix+Spotify+Prime", amount: 849, due_day: 20, category: "subscription", locked: true },
        { id: "c6", name: "LIC Term Plan", amount: 1200, due_day: 25, category: "insurance", locked: true }
    ],
    vault: { total_locked: 33049, safe_to_spend: 18951, last_updated: new Date().toISOString() },
    spending_history: [
        { date: "2026-05-10", amount: 820, category: "food", merchant: "Zomato", regret: true, day: "Saturday", days_since_salary: 9 },
        { date: "2026-05-09", amount: 2100, category: "shopping", merchant: "Amazon", regret: true, day: "Friday", days_since_salary: 8 },
        { date: "2026-05-08", amount: 750, category: "food", merchant: "Swiggy", regret: false, day: "Thursday", days_since_salary: 7 },
        { date: "2026-05-07", amount: 200, category: "bills", merchant: "Airtel", regret: false, day: "Wednesday", days_since_salary: 6 },
        { date: "2026-05-06", amount: 1500, category: "entertainment", merchant: "BrewDog", regret: true, day: "Tuesday", days_since_salary: 5 },
        { date: "2026-05-05", amount: 8500, category: "loan", merchant: "Home Loan EMI", regret: false, day: "Monday", days_since_salary: 4 },
        { date: "2026-05-04", amount: 14000, category: "housing", merchant: "Rent", regret: false, day: "Sunday", days_since_salary: 3 },
        { date: "2026-05-03", amount: 450, category: "food", merchant: "Zomato", regret: false, day: "Saturday", days_since_salary: 2 },
        { date: "2026-05-02", amount: 1200, category: "travel", merchant: "Uber", regret: false, day: "Friday", days_since_salary: 1 },
        { date: "2026-05-01", amount: 52000, category: "salary", merchant: "TechCorp", regret: false, day: "Thursday", days_since_salary: 0 }
    ],
    immunity: { score: 65, previous_score: 70, streak_days: 0, band: "Vulnerable", active_challenges: [] },
    twin: { persona: "bhai", last_message: "", context: "", roast_level: 3, acceptances: [], conversation_history: [] },
    flags: { demo_mode: true, salary_received_today: false }
});

let usersDb = {
    "rahul_demo_001": generateMockData()
};

// ===== DNA DETECTOR =====
const DNADetector = {
    analyze: (state) => {
        const history = state.spending_history;
        const safeToSpend = state.vault.safe_to_spend;
        const commitments = state.commitments;

        let dna = {
            weekend_spike: false,
            month_end_impulse: false,
            salary_party: false,
            food_delivery_addict: false,
            stress_spend: false
        };

        let weekendFood = { total: 0, count: 0 }, weekdayFood = { total: 0, count: 0 };
        let monthEndShopping = 0, midMonthShopping = 0;
        let salaryPartySpend = 0;
        let deliveryCount = 0, deliveryTotal = 0;
        let dailySpendMap = {};

        history.forEach(tx => {
            const cat = tx.category.toLowerCase();
            const txDayNum = new Date(tx.date).getDate();

            if (cat === 'food') {
                if (tx.day === 'Saturday' || tx.day === 'Sunday') { weekendFood.total += tx.amount; weekendFood.count++; }
                else { weekdayFood.total += tx.amount; weekdayFood.count++; }
            }
            if (cat === 'shopping') {
                if (txDayNum >= 25 && txDayNum <= 31) monthEndShopping += tx.amount;
                else midMonthShopping += tx.amount;
            }
            if ((cat === 'entertainment' || cat === 'travel') && tx.days_since_salary >= 1 && tx.days_since_salary <= 3) {
                salaryPartySpend += tx.amount;
            }
            if (tx.merchant.toLowerCase() === 'zomato' || tx.merchant.toLowerCase() === 'swiggy') {
                deliveryCount++; deliveryTotal += tx.amount;
            }
            if (cat !== 'salary') {
                if (!dailySpendMap[tx.date]) dailySpendMap[tx.date] = 0;
                dailySpendMap[tx.date] += tx.amount;
            }
        });

        const weekendAvg = weekendFood.count ? weekendFood.total / weekendFood.count : 0;
        const weekdayAvg = weekdayFood.count ? weekdayFood.total / weekdayFood.count : 0;
        if (weekdayAvg === 0 && weekendAvg > 0) dna.weekend_spike = true;
        else if (weekdayAvg > 0 && weekendAvg > (weekdayAvg * 1.5)) dna.weekend_spike = true;

        const monthEndAvg = monthEndShopping / 7;
        const midMonthAvg = midMonthShopping / 24;
        if (midMonthAvg === 0 && monthEndAvg > 0) dna.month_end_impulse = true;
        else if (midMonthAvg > 0 && (monthEndAvg / midMonthAvg) > 1.3) dna.month_end_impulse = true;

        if (salaryPartySpend > (safeToSpend * 0.10)) dna.salary_party = true;

        const totalWeeks = history.length > 0 ? 2 : 1;
        const countPerWeek = deliveryCount / totalWeeks;
        const avgDelivery = deliveryCount ? deliveryTotal / deliveryCount : 0;
        if (countPerWeek > 3 && avgDelivery > 400) dna.food_delivery_addict = true;

        const emiDays = commitments.filter(c => c.category.toLowerCase() === 'loan').map(c => c.due_day);
        let globalSum = 0;
        const days = Object.keys(dailySpendMap);
        days.forEach(d => globalSum += dailySpendMap[d]);
        const globalAvg = days.length ? globalSum / days.length : 0;

        let preEmiTotal = 0, preEmiCount = 0;
        days.forEach(dateStr => {
            const txDayNum = new Date(dateStr).getDate();
            let isPreEmi = false;
            emiDays.forEach(emi => {
                let diff = emi - txDayNum;
                if (diff < 0) diff += 30;
                if (diff === 1 || diff === 2) isPreEmi = true;
            });
            if (isPreEmi) { preEmiTotal += dailySpendMap[dateStr]; preEmiCount++; }
        });

        const preEmiAvg = preEmiCount ? preEmiTotal / preEmiCount : 0;
        if (globalAvg > 0 && preEmiAvg > (globalAvg * 1.5)) dna.stress_spend = true;

        state.dna = dna;

        let insight = "Your spending is perfectly balanced.";
        let savings = 0;
        if (dna.stress_spend) { insight = "You panic-spend right before EMIs hit. Breathe, don't buy."; savings = preEmiAvg * 12 * 0.3; }
        else if (dna.food_delivery_addict) { insight = "You're single-handedly funding food apps. Cook at home and watch your wealth grow."; savings = avgDelivery * countPerWeek * 52 * 0.5; }
        else if (dna.salary_party) { insight = "Payday isn't a festival. Stop blowing your safe budget in the first 3 days."; savings = salaryPartySpend * 12 * 0.5; }
        else if (dna.weekend_spike) { insight = "Your weekends are a disaster for your wallet. Find cheaper hobbies."; savings = weekendAvg * 52 * 0.5; }
        else if (dna.month_end_impulse) { insight = "You impulse buy when you should be saving for the next month."; savings = monthEndAvg * 12 * 0.4; }

        return { dna, insight, projected_savings: `₹${Math.round(savings).toLocaleString()}/year` };
    }
};

// ===== COMMITMENT VAULT =====
const CommitmentVault = {
    calculateVault: (state, salary_amount) => {
        const commitments = state.commitments;
        const total_locked = commitments.reduce((sum, c) => sum + c.amount, 0);
        const base_safe = salary_amount - total_locked;

        let buffers = [];
        let buffersTotal = 0;

        if (state.dna.weekend_spike) { buffers.push({ name: "weekend_buffer", amount: 2500, reason: "You spike spending on weekends." }); buffersTotal += 2500; }
        if (state.dna.stress_spend) { buffers.push({ name: "stress_buffer", amount: 1500, reason: "You stress spend before EMIs." }); buffersTotal += 1500; }
        if (state.dna.salary_party) { buffers.push({ name: "party_buffer", amount: 2000, reason: "You party too hard after salary." }); buffersTotal += 2000; }

        const true_safe = base_safe - buffersTotal;
        let status = "success";
        if (true_safe < 5000) status = "critical";
        else if (true_safe < 10000) status = "warning";

        const today = new Date().getDate();
        const vaults = commitments.map(c => {
            let dueIn = c.due_day - today;
            if (dueIn < 0) dueIn += 30;
            return { name: c.name, amount: c.amount, status: "locked", due_in: `${dueIn} days` };
        });

        state.vault = { total_locked, safe_to_spend: true_safe, buffers, last_updated: new Date().toISOString() };

        return { status, safe_to_spend: true_safe, total_locked, buffers, vaults, alert: `${vaults.length} vaults locked. True safe: ₹${true_safe.toLocaleString()}` };
    }
};

// ===== PRE-REGRET GUARD =====
const PreRegretGuard = {
    evaluate: (state, { amount, category, merchant, timestamp }) => {
        const dna = state.dna;
        const safeToSpend = state.vault.safe_to_spend;
        const txDate = new Date(timestamp);
        const dayOfWeek = txDate.getDay();
        const dayOfMonth = txDate.getDate();

        if (safeToSpend < (amount * 2)) return { decision: "block", reason: "You are spending more than 50% of your safe balance. This is a massive risk.", dna_trigger: "none", suggested_action: "Sleep on this purchase for 48 hours.", twin_trigger: "block_roast" };

        if (dna.weekend_spike && (dayOfWeek === 0 || dayOfWeek === 6) && category.toLowerCase() === 'food' && amount > 400) return { decision: "block", reason: "Weekend food spike detected. You already overspend on weekends.", dna_trigger: "weekend_spike", suggested_action: "Cook the groceries sitting in your fridge.", twin_trigger: "roast" };

        if (dna.month_end_impulse && dayOfMonth > 25 && category.toLowerCase() === 'shopping' && amount > 1000) return { decision: "block", reason: "Month-end impulse buy detected. You are running out of money for this month.", dna_trigger: "month_end", suggested_action: "Add to wishlist, review on the 5th of next month.", twin_trigger: "roast" };

        if (dna.food_delivery_addict && ['zomato', 'swiggy'].includes(merchant.toLowerCase())) {
            let thisWeekCount = 0;
            const oneWeekAgo = new Date(txDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            state.spending_history.forEach(tx => {
                if (['zomato', 'swiggy'].includes(tx.merchant.toLowerCase())) {
                    const d = new Date(tx.date);
                    if (d >= oneWeekAgo && d <= txDate) thisWeekCount++;
                }
            });
            if (thisWeekCount > 3) return { decision: "block", reason: "Food delivery addict alert! You've already ordered more than 3 times this week.", dna_trigger: "delivery", suggested_action: "Delete the food delivery app for 24 hours.", twin_trigger: "block_roast" };
        }

        if (dna.stress_spend && amount > 1000) {
            let daysToCommitment = 999;
            state.commitments.forEach(c => {
                let diff = c.due_day - dayOfMonth;
                if (diff < 0) diff += 30;
                if (diff < daysToCommitment) daysToCommitment = diff;
            });
            if (daysToCommitment < 3) return { decision: "warn", reason: `Stress spending detected! You have a commitment due in ${daysToCommitment} days.`, dna_trigger: "stress", suggested_action: "Take a deep breath and wait until the EMI clears.", twin_trigger: "advise" };
        }

        return { decision: "allow", reason: "Purchase looks safe based on your current DNA profile.", dna_trigger: "none", suggested_action: "Enjoy your purchase!", twin_trigger: "celebrate" };
    }
};

// ===== IMMUNITY SCORE =====
const ImmunityScore = {
    evaluate: (state, event_type) => {
        let currentScore = state.immunity.score !== undefined ? state.immunity.score : 50;
        let streak = state.immunity.streak_days || 0;
        let delta = 0;

        const eventPoints = { 'salary_locked': 15, 'streak_day': 3, 'micro_save': 2, 'pre_regret_triggered': -15, 'overspend': -20, 'safe_balance_zero': -10 };
        if (eventPoints[event_type]) delta = eventPoints[event_type];

        if (delta < 0) streak = 0;
        else if (event_type === 'streak_day') streak++;

        let newScore = Math.max(0, Math.min(100, currentScore + delta));

        let band = "", emoji = "";
        if (newScore >= 90) { band = "Iron Wall"; emoji = "🛡️"; }
        else if (newScore >= 70) { band = "Stable"; emoji = "🟢"; }
        else if (newScore >= 50) { band = "Exposed"; emoji = "🟡"; }
        else if (newScore >= 30) { band = "Vulnerable"; emoji = "🟠"; }
        else { band = "Critical"; emoji = "🔴"; }

        let challenges = [];
        if (state.dna.weekend_spike) challenges.push({ name: "2 Weekends < ₹500 Food", progress: "1/2", reward: 20 });
        if (state.dna.food_delivery_addict) challenges.push({ name: "7 Days No Delivery", progress: "2/7", reward: 25 });
        if (state.dna.month_end_impulse) challenges.push({ name: "No Shopping (25th-31st)", progress: "0/5", reward: 15 });

        let recovery = "Maintain a daily no-spend streak for +3 points.";
        if (newScore < 50 && state.dna.food_delivery_addict) recovery = "Delete Zomato/Swiggy to instantly recover +10 points.";
        else if (newScore < 50 && state.dna.weekend_spike) recovery = "Lock ₹1000 in Vault before Friday to recover +15 points.";

        state.immunity = { score: newScore, previous_score: currentScore, delta, band, band_emoji: emoji, streak_days: streak, active_challenges: challenges, recovery_action: recovery };
        return state.immunity;
    }
};

// ===== GOAL VAULT =====
const GoalVault = {
    initialize: (state) => {
        if (!state.goals) {
            state.goals = [
                {
                    id: "g1",
                    name: "Dream Bike (Royal Enfield)",
                    target_amount: 80000,
                    current_amount: 12000,
                    deadline_months: 6,
                    priority: "high",
                    locked: true,
                    status: "on_track",
                    penalty_message: "Touch this, bike delayed by 2 months"
                },
                {
                    id: "g2",
                    name: "Emergency Fund (3 months)",
                    target_amount: 50000,
                    current_amount: 8000,
                    deadline_months: 12,
                    priority: "high",
                    locked: true,
                    status: "on_track",
                    penalty_message: "Medical emergency = loan at 18% interest"
                },
                {
                    id: "g3",
                    name: "Home Down Payment",
                    target_amount: 300000,
                    current_amount: 45000,
                    deadline_months: 36,
                    priority: "medium",
                    locked: true,
                    status: "on_track",
                    penalty_message: "Rent forever. No equity."
                },
                {
                    id: "g4",
                    name: "Solo Trip to Manali",
                    target_amount: 25000,
                    current_amount: 3000,
                    deadline_months: 4,
                    priority: "low",
                    locked: true,
                    status: "on_track",
                    penalty_message: "Another year of Instagram scrolling"
                }
            ];
        }
        // calculate monthly_needed and preserve original total months
        state.goals.forEach(g => {
            // Preserve original total months if not already stored
            if (!g.total_months) {
                g.total_months = g.deadline_months;
            }
            const remaining = g.target_amount - (g.current_amount || 0);
            g.monthly_needed = Math.ceil(remaining / g.deadline_months);
        });
        if (!state.goal_settings) {
            state.goal_settings = {
                auto_lock_on_salary: true,
                emergency_buffer: 5000
            };
        }
        return state.goals;
    }
};

// Extend GoalVault with salary locking logic
GoalVault.lockGoalsOnSalary = (state, safeToSpend) => {
    // Ensure goals are initialized and monthly_needed calculated
    GoalVault.initialize(state);

    const safe = safeToSpend !== undefined ? safeToSpend : (state.vault && state.vault.safe_to_spend) || 0;
    const limit = safe * 0.6;

    // Find emergency fund goal (keep fully funded)
    const emergencyGoal = state.goals.find(g => /emergency/i.test(g.name));
    let allocated = 0;
    const funded = [];
    let warning = null;

    if (emergencyGoal) {
        const needed = emergencyGoal.monthly_needed;
        emergencyGoal.current_amount = (emergencyGoal.current_amount || 0) + needed;
        allocated += needed;
        funded.push({ name: emergencyGoal.name, locked: needed, progress: `${Math.round((emergencyGoal.current_amount / emergencyGoal.target_amount) * 100)}%` });
    }

    // Sort remaining goals by priority (high -> medium -> low)
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    const remainingGoals = state.goals.filter(g => g !== emergencyGoal).sort((a, b) => {
        return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
    });

    for (const g of remainingGoals) {
        if (allocated >= limit) break;
        const needed = g.monthly_needed;
        const canAllocate = Math.min(needed, limit - allocated);
        if (canAllocate > 0) {
            g.current_amount = (g.current_amount || 0) + canAllocate;
            allocated += canAllocate;
            funded.push({ name: g.name, locked: canAllocate, progress: `${Math.round((g.current_amount / g.target_amount) * 100)}%` });
        }
    }

    // Determine if any low‑priority goals were left unfunded
    const lowUnfunded = state.goals.filter(g => g.priority === 'low' && !funded.find(f => f.name === g.name));
    if (lowUnfunded.length) {
        warning = "Low priority goals underfunded";
    }

    const safeAfter = safe - allocated;
    state.safe_after_goals = safeAfter;

    return {
        total_locked_for_goals: allocated,
        goals_funded: funded,
        safe_after_goals: safeAfter,
        warning
    };
};

// ===== GOAL VAULT PROGRESS CALCULATION =====
GoalVault.calculateProgress = (state) => {
    // Ensure goals are initialized (monthly_needed and total_months present)
    GoalVault.initialize(state);
    
    let totalProgressSum = 0;
    let totalMonthlyNeeded = 0;
    
    const results = state.goals.map(g => {
        const progress = (g.current_amount / g.target_amount) * 100;
        totalProgressSum += progress;
        totalMonthlyNeeded += (g.monthly_needed || 0);
        
        const totalMonths = g.total_months || g.deadline_months;
        const monthsRemaining = g.deadline_months;
        const monthsPassed = totalMonths - monthsRemaining;
        const expected = (monthsPassed / totalMonths) * 100;
        let status = 'missed';
        let color = '#ff3366'; // red
        if (progress >= expected) {
            status = 'on_track';
            color = '#00ff88'; // green
        } else if (progress >= expected * 0.5) {
            status = 'at_risk';
            color = '#ffcc00'; // yellow
        }
        return {
            id: g.id,
            name: g.name,
            progress_percent: Math.round(progress * 100) / 100,
            status,
            color,
            months_remaining: monthsRemaining
        };
    });
    
    const overallProgress = state.goals.length ? totalProgressSum / state.goals.length : 0;
    
    return {
        goals: results,
        total_monthly_needed: totalMonthlyNeeded,
        overall_progress: Math.round(overallProgress * 100) / 100
    };
};

// ===== BHAI MODE VOICE =====
const BhaiModeVoice = {
    generate: (state, { roast_level, dna_trigger, context }) => {
        let msg = "", tone = "roasting";
        const { amount, merchant, pattern, suggested_action } = context;

        let start = Math.random() > 0.5 ? "Bhai," : "Arre bhai,";
        let phrase = "Ye extra kharcha zaroori tha?";
        if (dna_trigger === 'weekend_spike') phrase = "Weekend ka virus aa gaya?";
        else if (dna_trigger === 'delivery') phrase = "Kitchen mein chuhe bhi nahi aate?";
        else if (dna_trigger === 'month_end') phrase = "Salary aa gaya kya? Nahi, to kyu kharch?";
        else if (dna_trigger === 'stress') phrase = "EMI tension = shopping? Therapy sasti hai.";

        const alt = suggested_action || "Save this instead.";

        if (roast_level <= 2) {
            msg = `${start} fact check. ₹${amount} at ${merchant} is a lot right now. ${phrase} Tera wallet ro raha hoga agar yeh pass hua. Bhai, ${alt} What say?`;
            tone = "concerned";
        } else if (roast_level <= 4) {
            msg = `${start} ${phrase} ₹${amount} on ${merchant} again? Yeh tera pattern saaf dikh raha hai. Tera future khud pe ro raha hai. Be smart bhai, ${alt} Kar paayega?`;
            tone = "roasting";
        } else {
            msg = `${start} ${phrase} ₹${amount} for ${merchant}? Bhai lagta hai Elon Musk ka dost ban gaya hai. Tera account seriously ro raha hai abhi. ${alt} Aukaat dikha de aur isko cancel kar, dare accepted?`;
            tone = "roasting";
        }

        if (state.twin.last_roast_msg === msg) msg = `${start} I am repeating myself bhai, because you are repeating mistakes. ₹${amount} mat waste kar. ${alt} Try karega?`;
        state.twin.last_roast_msg = msg;

        return { message: msg, tone };
    }
};

// ===== FINANCIAL TWIN =====
const FinancialTwin = {
    generateResponse: (state, { persona, trigger_event, context }) => {
        if (!state.twin.conversation_history) state.twin.conversation_history = [];
        if (!state.twin.roast_level) state.twin.roast_level = 3;
        if (!state.twin.acceptances) state.twin.acceptances = [];

        const dna = state.dna;
        const streak = state.immunity.streak_days || 0;
        let roastLevel = state.twin.roast_level;
        
        // Goal context for twin
        const goals = state.goals || [];
        const activeGoals = goals.filter(g => g.status !== 'completed');
        state.twin.active_goals_count = activeGoals.length;
        const progressVals = goals.map(g => (g.current_amount / g.target_amount) * 100);
        state.twin.total_goal_progress = progressVals.length ? (progressVals.reduce((a,b)=>a+b,0) / progressVals.length) : 0;
        const remainingMonths = activeGoals.map(g => {
            return { name: g.name, months: g.deadline_months - (g.total_months - g.deadline_months) };
        });
        if (remainingMonths.length > 0) {
            remainingMonths.sort((a, b) => a.months - b.months);
            state.twin.next_milestone = `${remainingMonths[0].name} (${remainingMonths[0].months} months)`;
        } else {
            state.twin.next_milestone = null;
        }
        
        const recentRejects = state.twin.acceptances.slice(-2).filter(a => a === false).length;
        const recentAccepts = state.twin.acceptances.slice(-2).filter(a => a === true).length;
        if (recentRejects === 2) roastLevel = Math.max(1, roastLevel - 1);
        if (recentAccepts === 2) roastLevel = Math.min(5, roastLevel + 1);
        
        let tone = "neutral", message = "", actions = []; 
        const isBhai = (persona || state.user.persona_preference).toLowerCase() === 'bhai';

        if (streak > 7 && trigger_event !== 'guard_blocked' && trigger_event !== 'score_drop') {
            tone = "praise";
            if (isBhai) message = "Bhai maan gaye! 7 din se control. Tere paas sach mein aukaat hai saving ki.";
            else message = "Incredible discipline! Over a week of smart spending.";
        } else {
            switch (trigger_event) {
                case 'salary_detected':
                    tone = "celebrate";
                    if (isBhai) message = `Paisa aa gaya bhai! ₹${context.amount}. Ab isko 3 din mein udaa mat dena.`;
                    else message = `Salary credited! ₹${context.amount}. Let's lock away your commitments before you spend it.`;
                    break;
                case 'guard_blocked':
                case 'guard_warned':
                    if (isBhai) {
                        const bhaiRes = BhaiModeVoice.generate(state, { roast_level: roastLevel, dna_trigger: context.dna_trigger, context });
                        message = bhaiRes.message; tone = bhaiRes.tone;
                    } else {
                        tone = trigger_event === 'guard_blocked' ? 'roast' : 'advisory';
                        message = `Transaction ${trigger_event === 'guard_blocked' ? 'blocked' : 'flagged'}. ${context.reason}. Twin Advice: ${context.suggested_action}`;
                    }
                    break;
                case 'score_drop':
                    tone = "concern";
                    if (isBhai) message = `Score gir raha hai tera (${state.immunity.score}). ${context.recovery_action} jaldi kar!`;
                    else message = `Your immunity dropped to ${state.immunity.score}. Please ${context.recovery_action}.`;
                    break;
                case 'streak_milestone':
                    tone = "celebrate";
                    if (isBhai) message = `Kya baat hai! ${streak} din ka streak.`;
                    else message = `Congratulations on your ${streak}-day streak!`;
                    break;
                case 'goal_created':
                    tone = "neutral";
                    if (isBhai) message = "Sapna dekhna free hai, pura karna ₹4,500/month.";
                    else message = "Goal established. Monthly commitment: ₹4,500. Auto-lock enabled.";
                    break;
                case 'goal_funded':
                    tone = "celebrate";
                    if (isBhai) message = "Bike fund mein ₹4,500 locked. 21% complete. On track!";
                    else message = "Goal funded. 21% complete. On track.";
                    break;
                case 'goal_at_risk':
                    tone = "concern";
                    if (isBhai) message = "Bike ka sapna ghaas charne gaya. Focus kar bhai.";
                    else message = "Progress deviation detected. Recommend increasing allocation.";
                    break;
                case 'goal_completed':
                    tone = "celebrate";
                    if (isBhai) message = "Aukaat dikha di! Ab road pe dikhna mat.";
                    else message = "Congratulations. Target achieved. Consider next goal.";
                    break;
                case 'goal_withdraw_penalty':
                    tone = "roast";
                    if (isBhai) message = "₹5k nikaal liya? Bike 1 month late. Soch le.";
                    else message = "Withdrawal processed. Goal delayed by 1 month.";
                    break;
                default:
                    tone = "neutral";
                    if (isBhai) message = `Aur bhai, kaisa chal raha hai? Safe balance ₹${state.vault.safe_to_spend} bacha hai.`;
                    else message = `Welcome. You have ₹${state.vault.safe_to_spend} safe to spend.`;
                    if (context && context.suggested_action) message += ` Twin: ${context.suggested_action}`;
                    break;
            }
        }

        state.twin.conversation_history.push({ role: 'twin', message, timestamp: new Date().toISOString() });
        if (state.twin.conversation_history.length > 10) state.twin.conversation_history.shift();

        state.twin.last_message = message;
        state.twin.roast_level = roastLevel;

        return { message, tone, actions, persona_used: isBhai ? 'BHAI' : 'FORMAL' };
    }
};

// ===== API ENDPOINTS =====
app.post('/finlock/dna/analyze', (req, res) => {
    const { user_id } = req.body;
    let state = usersDb[user_id];
    if (!state) return res.status(404).json({ error: "User not found" });
    const result = DNADetector.analyze(state);
    res.json(result);
});

app.post('/finlock/vault/lock', (req, res) => {
    const { user_id, salary_amount } = req.body;
    let state = usersDb[user_id];
    if (!state) return res.status(404).json({ error: "User not found" });
    const result = CommitmentVault.calculateVault(state, salary_amount || state.user.salary);
    res.json(result);
});

app.post('/finlock/guard/check', (req, res) => {
    const { user_id, spend_attempt } = req.body;
    let state = usersDb[user_id];
    if (!state) return res.status(404).json({ error: "User not found" });
    const result = PreRegretGuard.evaluate(state, spend_attempt);
    res.json(result);
});

app.post('/finlock/score/update', (req, res) => {
    const { user_id, event_type } = req.body;
    let state = usersDb[user_id];
    if (!state) return res.status(404).json({ error: "User not found" });
    const result = ImmunityScore.evaluate(state, event_type);
    res.json(result);
});

app.post('/finlock/twin/message', (req, res) => {
    const { user_id, persona, trigger_event, context } = req.body;
    let state = usersDb[user_id];
    if (!state) return res.status(404).json({ error: "User not found" });
    const result = FinancialTwin.generateResponse(state, { persona, trigger_event, context });
    res.json(result);
});

app.get('/finlock/user/state', (req, res) => {
    const { user_id } = req.query;
    let state = usersDb[user_id];
    if (!state) return res.status(404).json({ error: "User not found" });
    res.json(state);
});

// ===== GOAL VAULT ENDPOINT =====
app.post('/finlock/goals/init', (req, res) => {
    const { user_id } = req.body;
    let state = usersDb[user_id];
    if (!state) return res.status(404).json({ error: "User not found" });
    const goals = GoalVault.initialize(state);
    res.json({ goals, goal_settings: state.goal_settings });
});

// ===== GOAL VAULT LOCK ON SALARY =====
app.post('/finlock/goals/lock', (req, res) => {
    const { user_id, salary_amount, safe_to_spend_after_commitments } = req.body;
    let state = usersDb[user_id];
    if (!state) return res.status(404).json({ error: "User not found" });
    // Ensure safe_to_spend is available; if not, compute via CommitmentVault
    let safe = safe_to_spend_after_commitments;
    if (safe === undefined) {
        const vaultResult = CommitmentVault.calculateVault(state, salary_amount || state.user.salary);
        safe = vaultResult.safe_to_spend;
    }
    const result = GoalVault.lockGoalsOnSalary(state, safe);
    res.json(result);
});

// ===== GOAL VAULT WITHDRAW =====
app.post('/finlock/goals/withdraw', (req, res) => {
    const { user_id, goal_id, amount } = req.body;
    let state = usersDb[user_id];
    if (!state) return res.status(404).json({ error: "User not found" });
    
    if (!state.goals) return res.status(404).json({ error: "No goals found" });
    const goal = state.goals.find(g => g.id === goal_id);
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    if (goal.locked === false) {
        goal.current_amount -= amount;
        const percent = Math.round((goal.current_amount / goal.target_amount) * 100 * 100) / 100;
        return res.json({ allowed: true, new_progress: percent, new_status: goal.status });
    }

    if (goal.locked === true) {
        if (amount > (goal.current_amount || 0)) {
            return res.json({ allowed: false, penalty_message: "Amount exceeds saved balance." });
        }
        const delay_months = Math.ceil(amount / (goal.monthly_needed || 1));
        const new_amount = goal.current_amount - amount;
        const percent = Math.round((new_amount / goal.target_amount) * 100 * 100) / 100;
        return res.json({
            allowed: false,
            penalty_message: `Withdraw ₹${amount}? ${goal.name} delayed by ${delay_months} month(s). ${goal.penalty_message}`,
            confirm_required: true,
            new_progress: percent,
            new_status: "at_risk"
        });
    }
});

app.post('/finlock/reset', (req, res) => {
    usersDb["rahul_demo_001"] = generateMockData();
    res.json({ status: "reset" });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`FinLock Backend running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});