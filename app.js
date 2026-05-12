const STORE_KEY = 'FinLockState';

const MockDataGenerator = () => {
    const newState = {
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
        twin: { persona: "bhai", last_message: "Bhai, weekend pe Zomato daba ke pel rahe ho? SIP bounce ho jaayegi aise hi chalte raha toh.", context: "", roast_level: "high" },
        flags: { demo_mode: true, salary_received_today: false }
    };
    
    localStorage.setItem(STORE_KEY, JSON.stringify(newState));
    return newState;
};

let state = JSON.parse(localStorage.getItem(STORE_KEY));
if (!state || !state.user || state.user.id !== "rahul_demo_001") {
    state = MockDataGenerator();
}

function saveState() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    render();
}

const DNADetector = {
    analyze: (user_id) => {
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

        saveState();

        return { dna: dna, insight: insight, projected_savings: `₹${Math.round(savings).toLocaleString()}/year` };
    }
};

const CommitmentVault = {
    calculateVault: ({ user_id, salary_amount }) => {
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

        const alertStr = `${vaults.length} vaults locked. True safe: ₹${true_safe.toLocaleString()}`;

        state.vault = { total_locked: total_locked, safe_to_spend: true_safe, buffers: buffers, last_updated: new Date().toISOString() };

        saveState();

        return { status: status, safe_to_spend: true_safe, total_locked: total_locked, buffers: buffers, vaults: vaults, alert: alertStr };
    }
};

const PreRegretGuard = {
    evaluate: ({ user_id, spend_attempt: { amount, category, merchant, timestamp } }) => {
        const dna = state.dna;
        const safeToSpend = state.vault.safe_to_spend;
        
        const txDate = new Date(timestamp);
        const dayOfWeek = txDate.getDay();
        const dayOfMonth = txDate.getDate();

        if (safeToSpend < (amount * 2)) {
            return { decision: "block", reason: "You are spending more than 50% of your safe balance. This is a massive risk.", dna_trigger: "none", suggested_action: "Sleep on this purchase for 48 hours.", twin_trigger: "block_roast" };
        }

        if (dna.weekend_spike && (dayOfWeek === 0 || dayOfWeek === 6) && category.toLowerCase() === 'food' && amount > 400) {
            return { decision: "block", reason: "Weekend food spike detected. You already overspend on weekends.", dna_trigger: "weekend_spike", suggested_action: "Cook the groceries sitting in your fridge.", twin_trigger: "roast" };
        }

        if (dna.month_end_impulse && dayOfMonth > 25 && category.toLowerCase() === 'shopping' && amount > 1000) {
            return { decision: "block", reason: "Month-end impulse buy detected. You are running out of money for this month.", dna_trigger: "month_end", suggested_action: "Add to wishlist, review on the 5th of next month.", twin_trigger: "roast" };
        }

        if (dna.food_delivery_addict && ['zomato', 'swiggy'].includes(merchant.toLowerCase())) {
            let thisWeekCount = 0;
            const now = txDate;
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            state.spending_history.forEach(tx => {
                if (['zomato', 'swiggy'].includes(tx.merchant.toLowerCase())) {
                    const d = new Date(tx.date);
                    if (d >= oneWeekAgo && d <= now) thisWeekCount++;
                }
            });

            if (thisWeekCount > 3) {
                return { decision: "block", reason: "Food delivery addict alert! You've already ordered more than 3 times this week.", dna_trigger: "delivery", suggested_action: "Delete the food delivery app for 24 hours.", twin_trigger: "block_roast" };
            }
        }

        if (dna.stress_spend && amount > 1000) {
            let daysToCommitment = 999;
            state.commitments.forEach(c => {
                let diff = c.due_day - dayOfMonth;
                if (diff < 0) diff += 30;
                if (diff < daysToCommitment) daysToCommitment = diff;
            });
            
            if (daysToCommitment < 3) {
                return { decision: "warn", reason: `Stress spending detected! You have a commitment due in ${daysToCommitment} days.`, dna_trigger: "stress", suggested_action: "Take a deep breath and wait until the EMI clears.", twin_trigger: "advise" };
            }
        }

        return { decision: "allow", reason: "Purchase looks safe based on your current DNA profile.", dna_trigger: "none", suggested_action: "Enjoy your purchase!", twin_trigger: "celebrate" };
    }
};

const ImmunityScore = {
    evaluate: ({ user_id, event_type }) => {
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

        state.immunity = { score: newScore, previous_score: currentScore, delta: delta, band: band, band_emoji: emoji, streak_days: streak, active_challenges: challenges, recovery_action: recovery };

        return state.immunity;
    }
};

const BhaiModeVoice = {
    generate: ({ roast_level, dna_trigger, context }) => {
        let msg = "", tone = "roasting";
        const { amount, merchant, pattern, suggested_action } = context;

        let start = Math.random() > 0.5 ? "Bhai," : "Arre bhai,";
        let phrase = "";
        
        switch (dna_trigger) {
            case 'weekend_spike': phrase = "Weekend ka virus aa gaya?"; break;
            case 'delivery': phrase = "Kitchen mein chuhe bhi nahi aate?"; break;
            case 'month_end': phrase = "Salary aa gaya kya? Nahi, to kyu kharch?"; break;
            case 'stress': phrase = "EMI tension = shopping? Therapy sasti hai."; break;
            default: phrase = "Ye extra kharcha zaroori tha?"; break;
        }

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

        if (!state.twin.last_roast_msg) state.twin.last_roast_msg = "";
        if (state.twin.last_roast_msg === msg) {
            msg = `${start} I am repeating myself bhai, because you are repeating mistakes. ₹${amount} mat waste kar. ${alt} Try karega?`;
        }
        state.twin.last_roast_msg = msg;

        return { message: msg, tone: tone };
    }
};

const FinancialTwin = {
    generateResponse: ({ user_id, persona, trigger_event, context }) => {
        if (!state.twin.conversation_history) state.twin.conversation_history = [];
        if (!state.twin.roast_level) state.twin.roast_level = 3;
        if (!state.twin.acceptances) state.twin.acceptances = [];

        const dna = state.dna;
        const streak = state.immunity.streak_days || 0;
        let roastLevel = state.twin.roast_level;
        
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
            switch(trigger_event) {
                case 'salary_detected':
                    tone = "celebrate";
                    if (isBhai) message = `Paisa aa gaya bhai! ₹${context.amount}. Ab isko 3 din mein udaa mat dena.`;
                    else message = `Salary credited! ₹${context.amount}. Let's lock away your commitments before you spend it.`;
                    break;
                case 'guard_blocked':
                case 'guard_warned':
                    if (isBhai) {
                        const bhaiRes = BhaiModeVoice.generate({ roast_level: roastLevel, dna_trigger: context.dna_trigger, context: context });
                        message = bhaiRes.message; tone = bhaiRes.tone;
                    } else {
                        tone = trigger_event === 'guard_blocked' ? 'roast' : 'advisory';
                        message = `Transaction ${trigger_event === 'guard_blocked' ? 'blocked' : 'flagged'}. ${context.reason}. <br><br><b>Twin Advice:</b> ${context.suggested_action}`;
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
                case 'mode_switch':
                    tone = "neutral";
                    if (isBhai) message = `Bhai, ab main teri language mein bolunga! Zomato pe mat jaa, ghar ka khana khaa le.`;
                    else message = `Mode switched to professional. Based on your spending pattern, I recommend focusing on essential expenses.`;
                    break;
                default:
                    tone = "neutral";
                    if (isBhai) message = `Aur bhai, kaisa chal raha hai? Safe balance ₹${state.vault.safe_to_spend} bacha hai.`;
                    else message = `Welcome. You have ₹${state.vault.safe_to_spend} safe to spend.`;
                    if (context && context.suggested_action) message += ` <br><br><b>Twin:</b> ${context.suggested_action}`;
                    break;
            }
        }

        state.twin.conversation_history.push({ role: 'twin', message, timestamp: new Date().toISOString() });
        if (state.twin.conversation_history.length > 10) state.twin.conversation_history.shift();
        
        state.twin.last_message = message;
        state.twin.roast_level = roastLevel;
        saveState();

        return { message: message, tone: tone, actions: actions, persona_used: isBhai ? 'BHAI' : 'FORMAL' };
    },
    
    speak: (message, type="twin") => {
        const chatWindow = document.getElementById('twin-chat');
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${type}`;
        bubble.innerHTML = message;
        chatWindow.appendChild(bubble);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
};

const GoalVault = {
    initialize: () => {
        if (!state.goals) {
            state.goals = [
                {
                    id: "g1", name: "Dream Bike (Royal Enfield)", target_amount: 80000, current_amount: 12000,
                    deadline_months: 6, priority: "high", locked: true, status: "on_track", penalty_message: "Touch this, bike delayed by 2 months"
                },
                {
                    id: "g2", name: "Emergency Fund (3 months)", target_amount: 50000, current_amount: 8000,
                    deadline_months: 12, priority: "high", locked: true, status: "on_track", penalty_message: "Medical emergency = loan at 18% interest"
                },
                {
                    id: "g3", name: "Home Down Payment", target_amount: 300000, current_amount: 45000,
                    deadline_months: 36, priority: "medium", locked: true, status: "on_track", penalty_message: "Rent forever. No equity."
                },
                {
                    id: "g4", name: "Solo Trip to Manali", target_amount: 25000, current_amount: 3000,
                    deadline_months: 4, priority: "low", locked: true, status: "on_track", penalty_message: "Another year of Instagram scrolling"
                }
            ];
            state.goal_settings = { auto_lock_on_salary: true, emergency_buffer: 5000 };
            saveState();
        }
        
        state.goals.forEach(g => {
            if (!g.total_months) g.total_months = g.deadline_months;
            const remaining = g.target_amount - (g.current_amount || 0);
            g.monthly_needed = Math.ceil(remaining / g.deadline_months);
        });
        
        return state.goals;
    },
    calculateProgress: () => {
        GoalVault.initialize();
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
            g.status = status;
            return {
                id: g.id,
                name: g.name,
                progress_percent: Math.round(progress * 100) / 100,
                status,
                color,
                months_remaining: monthsRemaining,
                target_amount: g.target_amount,
                current_amount: g.current_amount,
                monthly_needed: g.monthly_needed,
                locked: g.locked,
                penalty_message: g.penalty_message
            };
        });
        
        const overallProgress = state.goals.length ? totalProgressSum / state.goals.length : 0;
        
        return {
            goals: results,
            total_monthly_needed: totalMonthlyNeeded,
            overall_progress: Math.round(overallProgress * 100) / 100
        };
    }
};

let currentWithdrawGoalId = null;

function render() {
    const progressBar = document.getElementById('immunity-progress');
    const scoreText = document.getElementById('immunity-score-text');
    const statusText = document.getElementById('immunity-status');
    
    const score = state.immunity.score;
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score / 100) * circumference;
    
    progressBar.style.strokeDasharray = `${circumference} ${circumference}`;
    progressBar.style.strokeDashoffset = offset;
    
    scoreText.textContent = score;
    
    let status = '', colorClass = '';
    
    if (score >= 90) { status = 'IRON WALL'; colorClass = 'iron-wall'; }
    else if (score >= 70) { status = 'STABLE'; colorClass = 'stable'; }
    else if (score >= 50) { status = 'EXPOSED'; colorClass = 'exposed'; }
    else if (score >= 30) { status = 'VULNERABLE'; colorClass = 'vulnerable'; }
    else { status = 'CRITICAL'; colorClass = 'critical'; }
    
    statusText.textContent = status;
    
    progressBar.classList.remove('critical', 'vulnerable', 'exposed', 'stable', 'iron-wall');
    progressBar.classList.add(colorClass);
    
    const colors = { 'critical': '#ff3366', 'vulnerable': '#ff9500', 'exposed': '#ffcc00', 'stable': '#007aff', 'iron-wall': '#00ff88' };
    statusText.style.color = colors[colorClass];

    document.getElementById('safe-to-spend').textContent = `₹${state.vault.safe_to_spend.toLocaleString()}`;
    document.getElementById('total-locked').textContent = `₹${state.vault.total_locked.toLocaleString()}`;
    
    const commitmentsList = document.getElementById('commitments-list');
    commitmentsList.innerHTML = state.commitments.map(c => `
        <div class="commitment-item">
            <div>
                <strong>${c.name}</strong> <br>
                <small style="color:var(--text-secondary)">Due Day: ${c.due_day} • ${c.category}</small>
            </div>
            <div style="font-weight: 800">₹${c.amount.toLocaleString()} 🔒</div>
        </div>
    `).join('');

    const dnaTags = document.getElementById('dna-tags');
    dnaTags.innerHTML = Object.entries(state.dna).map(([key, value]) => {
        const formattedKey = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return `<div class="dna-tag ${value ? 'active' : ''}">${formattedKey}</div>`;
    }).join('');

    // Render Goal Vault
    const goalData = GoalVault.calculateProgress();
    
    document.getElementById('goal-overall-progress').style.width = `${goalData.overall_progress}%`;
    document.getElementById('goal-overall-text').textContent = `${goalData.overall_progress}% Overall Progress`;
    document.getElementById('goal-monthly-needed').textContent = `₹${goalData.total_monthly_needed.toLocaleString()}`;
    document.getElementById('goal-active-count').textContent = goalData.goals.filter(g => g.status !== 'completed').length;
    
    const safeAfterGoals = state.vault.safe_to_spend - goalData.total_monthly_needed;
    document.getElementById('goal-safe-after').textContent = `₹${safeAfterGoals.toLocaleString()}`;
    
    const goalsGrid = document.getElementById('goals-grid');
    goalsGrid.innerHTML = goalData.goals.map(g => {
        const pCircumference = 2 * Math.PI * 24;
        const pOffset = pCircumference - (Math.min(100, g.progress_percent) / 100) * pCircumference;
        return `
        <div class="goal-item">
            <div class="goal-item-header">
                <div class="goal-info">
                    <h3>${g.name}</h3>
                    <p>Target: ₹${g.target_amount.toLocaleString()}</p>
                </div>
                <div class="goal-status-badge ${g.status}">
                    ${g.locked ? '🔒' : ''} ${g.status.replace('_', ' ')}
                </div>
            </div>
            <div class="goal-progress-section">
                <div class="goal-ring-container">
                    <svg class="goal-svg" viewBox="0 0 60 60">
                        <circle class="goal-ring-bg" cx="30" cy="30" r="24"></circle>
                        <circle class="goal-ring-bar" cx="30" cy="30" r="24" stroke="${g.color}" stroke-dasharray="${pCircumference}" stroke-dashoffset="${pOffset}"></circle>
                    </svg>
                    <div class="goal-ring-text">${Math.round(g.progress_percent)}%</div>
                </div>
                <div class="goal-details">
                    <div class="goal-detail-row">
                        <span>Current</span>
                        <strong style="color:var(--text-primary)">₹${g.current_amount.toLocaleString()}</strong>
                    </div>
                    <div class="goal-detail-row">
                        <span>Monthly Needed</span>
                        <strong>₹${g.monthly_needed.toLocaleString()}</strong>
                    </div>
                </div>
            </div>
            <div class="goal-actions">
                <span class="months-badge">${g.months_remaining} months left</span>
                <button class="withdraw-btn" onclick="openWithdrawModal('${g.id}')">Withdraw</button>
            </div>
        </div>
        `;
    }).join('');
}

document.getElementById('btn-attempt-spend').addEventListener('click', () => {
    const merchant = document.getElementById('spend-merchant').value || 'Unknown';
    const amount = parseFloat(document.getElementById('spend-amount').value);
    const category = document.getElementById('spend-category').value;

    if (isNaN(amount) || amount <= 0) {
        FinancialTwin.speak("Bhai, ₹0 ka transaction? Kuch toh daal!", "twin");
        return;
    }

    FinancialTwin.speak(`Attempting to spend ₹${amount} on ${category} at ${merchant}...`, "user");

    const guardResult = PreRegretGuard.evaluate({
        user_id: state.user.id,
        spend_attempt: { amount, category, merchant, timestamp: new Date().toISOString() }
    });
    
    setTimeout(() => {
        let trigger = 'guard_warned';
        if (guardResult.decision === 'block') trigger = 'guard_blocked';
        else if (guardResult.decision === 'allow') trigger = 'general';

        const twinResponse = FinancialTwin.generateResponse({
            user_id: state.user.id,
            persona: state.user.persona_preference,
            trigger_event: trigger,
            context: {
                amount: amount,
                merchant: merchant,
                reason: guardResult.reason,
                suggested_action: guardResult.suggested_action,
                dna_trigger: guardResult.dna_trigger
            }
        });
        
        const chatMsg = `[${guardResult.decision.toUpperCase()}] ${twinResponse.message} <br><small style="opacity:0.6;"><i>(${twinResponse.persona_used} - Tone: ${twinResponse.tone} - Roast Level: ${state.twin.roast_level})</i></small>`;

        FinancialTwin.speak(chatMsg, "twin");
        
        if (guardResult.decision === 'block') {
            ImmunityScore.evaluate({ user_id: state.user.id, event_type: 'pre_regret_triggered' });
        } else {
            state.vault.safe_to_spend -= amount;
            state.spending_history.push({
                id: Date.now(),
                amount,
                category,
                merchant,
                date: new Date().toISOString(),
                regret: guardResult.decision === 'warn',
                day: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()],
                days_since_salary: new Date().getDate() - state.user.salary_day
            });
            DNADetector.analyze(state.user.id);
            CommitmentVault.calculateVault({ user_id: state.user.id, salary_amount: state.user.salary });
            
            let event = amount < 500 ? 'micro_save' : null;
            if (state.vault.safe_to_spend < 0) event = 'overspend';
            else if (state.vault.safe_to_spend === 0) event = 'safe_balance_zero';
            if (event) ImmunityScore.evaluate({ user_id: state.user.id, event_type: event });
        }
        
        saveState();
        
        document.getElementById('spend-merchant').value = '';
        document.getElementById('spend-amount').value = '';
        
    }, 800);
});

document.getElementById('mode-toggle').addEventListener('change', (e) => {
    const isFormal = e.target.checked;
    state.user.persona_preference = isFormal ? 'formal' : 'bhai';
    saveState();
    
    const labels = document.querySelectorAll('.mode-label');
    labels[0].classList.toggle('active', !isFormal);
    labels[1].classList.toggle('active', isFormal);
    
    const response = FinancialTwin.generateResponse({
        user_id: state.user.id,
        persona: state.user.persona_preference,
        trigger_event: 'mode_switch',
        context: { previous_mode: isFormal ? 'bhai' : 'formal', new_mode: isFormal ? 'formal' : 'bhai' }
    });
    
    FinancialTwin.speak(response.message, "twin");
});

document.getElementById('simulate-salary-btn').addEventListener('click', async () => {
    const btn = document.getElementById('simulate-salary-btn');
    btn.disabled = true;
    btn.textContent = '🔄 Processing...';
    
    const salaryAmount = state.user.salary;
    const commitments = state.commitments;
    const totalLocked = commitments.reduce((sum, c) => sum + c.amount, 0);
    const safeToSpend = salaryAmount - totalLocked;
    
    const commitmentItems = document.querySelectorAll('.commitment-item');
    for (let i = 0; i < commitmentItems.length; i++) {
        setTimeout(() => {
            commitmentItems[i].classList.add('locking');
            setTimeout(() => { commitmentItems[i].classList.remove('locking'); }, 600);
        }, i * 300);
    }
    
    setTimeout(() => {
        const safeToSpendElement = document.getElementById('safe-to-spend');
        safeToSpendElement.classList.add('counting-animation');
        
        let currentValue = 0;
        const targetValue = safeToSpend;
        const increment = targetValue / 50;
        const duration = 1500;
        const stepTime = duration / 50;
        
        const counter = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(counter);
                safeToSpendElement.classList.remove('counting-animation');
            }
            safeToSpendElement.textContent = `₹${Math.round(currentValue).toLocaleString()}`;
        }, stepTime);
        
        document.getElementById('total-locked').textContent = `₹${totalLocked.toLocaleString()}`;
        
        state.vault.total_locked = totalLocked;
        state.vault.safe_to_spend = safeToSpend;
        state.vault.last_updated = new Date().toISOString();
        
    }, commitmentItems.length * 300 + 500);
    
    setTimeout(() => {
        const twinResponse = FinancialTwin.generateResponse({
            user_id: state.user.id,
            persona: state.user.persona_preference,
            trigger_event: 'salary_detected',
            context: { amount: salaryAmount, total_locked: totalLocked, safe_to_spend: safeToSpend }
        });
        FinancialTwin.speak(twinResponse.message, "twin");
    }, commitmentItems.length * 300 + 2000);
    
    setTimeout(() => {
        ImmunityScore.evaluate({ user_id: state.user.id, event_type: 'salary_locked' });
        render();
    }, commitmentItems.length * 300 + 2500);
    
    setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '💰 Simulate Salary Day';
    }, commitmentItems.length * 300 + 3000);
    
    saveState();
});

function showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => { toast.classList.add('show'); }, 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => { container.removeChild(toast); }, 300);
        }, 10);
    }, duration);
}

document.getElementById('reset-demo-btn').addEventListener('click', () => {
    state = MockDataGenerator();
    document.getElementById('twin-chat').innerHTML = '';
    state.immunity.score = 65;
    state.immunity.band = "Vulnerable";
    state.immunity.band_emoji = "🟠";
    saveState();
    DNADetector.analyze(state.user.id);
    CommitmentVault.calculateVault({ user_id: state.user.id, salary_amount: state.user.salary });
    ImmunityScore.evaluate({ user_id: state.user.id, event_type: 'none' });
    
    const modeToggle = document.getElementById('mode-toggle');
    const isInitiallyFormal = state.user.persona_preference === 'formal';
    modeToggle.checked = isInitiallyFormal;
    
    const labels = document.querySelectorAll('.mode-label');
    labels[0].classList.toggle('active', !isInitiallyFormal);
    labels[1].classList.toggle('active', isInitiallyFormal);
    
    FinancialTwin.speak(state.twin.last_message, "twin");
    showToast("Demo reset. Try again!");
});

const modeToggle = document.getElementById('mode-toggle');
const isInitiallyFormal = state.user.persona_preference === 'formal';
modeToggle.checked = isInitiallyFormal;

const labels = document.querySelectorAll('.mode-label');
labels[0].classList.toggle('active', !isInitiallyFormal);
labels[1].classList.toggle('active', isInitiallyFormal);

DNADetector.analyze(state.user.id);
CommitmentVault.calculateVault({ user_id: state.user.id, salary_amount: state.user.salary });
ImmunityScore.evaluate({ user_id: state.user.id, event_type: 'none' });
render();
document.getElementById('twin-chat').innerHTML = '';
FinancialTwin.speak(state.twin.last_message, "twin");

// GoalVault Actions
window.openWithdrawModal = (goalId) => {
    currentWithdrawGoalId = goalId;
    const goal = state.goals.find(g => g.id === goalId);
    if(!goal) return;
    
    // For demo purposes, assuming a fixed 5000 withdrawal or remaining amount
    const withdrawAmount = Math.min(5000, goal.current_amount); 
    if (withdrawAmount === 0) {
        showToast("No funds available to withdraw.");
        return;
    }
    
    document.getElementById('withdraw-modal-text').innerHTML = `Are you sure you want to withdraw <strong>₹${withdrawAmount}</strong> from <strong>${goal.name}</strong>?`;
    
    const penaltyContainer = document.getElementById('withdraw-penalty-container');
    const penaltyText = document.getElementById('withdraw-penalty-text');
    
    if (goal.locked) {
        const delay_months = Math.ceil(withdrawAmount / (goal.monthly_needed || 1));
        penaltyContainer.style.display = 'block';
        penaltyText.innerHTML = `⚠️ Penalty! ${goal.name} delayed by ${delay_months} month(s).<br><br><em>${goal.penalty_message}</em>`;
        document.getElementById('btn-confirm-withdraw').textContent = 'Confirm Penalty & Withdraw';
    } else {
        penaltyContainer.style.display = 'none';
        document.getElementById('btn-confirm-withdraw').textContent = 'Confirm Withdraw';
    }
    
    document.getElementById('withdraw-modal').classList.add('active');
};

document.getElementById('btn-cancel-withdraw').addEventListener('click', () => {
    document.getElementById('withdraw-modal').classList.remove('active');
    currentWithdrawGoalId = null;
});

document.getElementById('btn-confirm-withdraw').addEventListener('click', () => {
    if(!currentWithdrawGoalId) return;
    const goal = state.goals.find(g => g.id === currentWithdrawGoalId);
    
    if(goal) {
        const amount = Math.min(5000, goal.current_amount);
        goal.current_amount -= amount;
        
        // Trigger Twin message
        const delay_months = Math.ceil(amount / (goal.monthly_needed || 1));
        const twinResponse = FinancialTwin.generateResponse({
            user_id: state.user.id,
            persona: state.user.persona_preference,
            trigger_event: 'goal_withdraw_penalty',
            context: { amount, name: goal.name, delay_months }
        });
        FinancialTwin.speak(twinResponse.message, "twin");
        
        saveState();
        showToast(`Withdrew ₹${amount} from ${goal.name}`);
    }
    
    document.getElementById('withdraw-modal').classList.remove('active');
    currentWithdrawGoalId = null;
});

// Auto-lock toggle handling
const autoLockToggle = document.getElementById('goal-autolock-toggle');
if(autoLockToggle) {
    autoLockToggle.checked = state.goal_settings?.auto_lock_on_salary ?? true;
    autoLockToggle.addEventListener('change', (e) => {
        if(!state.goal_settings) state.goal_settings = {};
        state.goal_settings.auto_lock_on_salary = e.target.checked;
        saveState();
        
        if(!e.target.checked) {
            showToast("⚠️ Warning: Disabling auto-lock may derail goals");
            // Ask Twin to warn
            const twinResponse = FinancialTwin.generateResponse({
                user_id: state.user.id,
                persona: state.user.persona_preference,
                trigger_event: 'guard_warned',
                context: { reason: "Goal auto-lock disabled", suggested_action: "Turn it back on to secure your future." }
            });
            FinancialTwin.speak(twinResponse.message, "twin");
        }
    });
}