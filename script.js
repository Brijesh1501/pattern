// --- Configuration & Data ---
/**
 * Nickname Mapping: 
 * Used to expand search results. If a user enters "Mike", the system 
 * finds "Michael" and all other related nicknames like "Mikey".
 */
const nicknames = {
    // Original & Classics
    "michael": ["mike", "mikey"],
    "robert": ["rob", "bob", "bobby", "bert"],
    "william": ["bill", "will", "liam", "billy"],
    "elizabeth": ["liz", "beth", "eliza", "libby", "betsy", "bessie"],
    "richard": ["rich", "dick", "rick", "richie"],
    "thomas": ["tom", "tommy"],
    "jonathan": ["jon", "john"],
    "matthew": ["matt", "matty"],
    "nicholas": ["nick", "nicky"],
    "james": ["jim", "jimmy", "jamie"],
    "christopher": ["chris", "topher", "kit","christ"],

    // Additional Male Names
    "alexander": ["alex", "xander", "al", "lex"],
    "andrew": ["andy", "drew"],
    "arthur": ["art", "artie"],
    "benjamin": ["ben", "benny", "benji"],
    "charles": ["charlie", "chuck", "chas"],
    "daniel": ["dan", "danny"],
    "david": ["dave", "davy"],
    "edward": ["ed", "eddie", "ned", "ted"],
    "frederick": ["fred", "freddie", "ricky"],
    "henry": ["hank", "harry", "hal"],
    "joseph": ["joe", "joey"],
    "lawrence": ["larry", "laurie"],
    "patrick": ["pat", "paddy", "rick", "ricky"],
    "samuel": ["sam", "sammy"],
    "theodore": ["theo", "ted", "teddy"],

    // Additional Female Names
    "alexandra": ["alex", "alexa", "lexi", "sasha"],
    "catherine": ["cat", "cathy", "kate", "katie", "kit", "trina"],
    "eleanor": ["ellie", "nell", "nora"],
    "isabella": ["izzy", "bella", "belle"],
    "margaret": ["maggie", "marge", "peggy", "daisy", "rita", "margo"],
    "samantha": ["sam", "sammy"],
    "sarah": ["sally", "sadie"],
    "victoria": ["vicky", "tori", "vic"],
    "virginia": ["ginny", "ginger"]
};

// --- DOM Elements ---
const generateBtn = document.getElementById('generateBtn');
const resultsGrid = document.getElementById('resultsGrid');
const copyAllBtn = document.getElementById('copyAllBtn');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');

// --- Helper: Generate Combinations ---
/**
 * Takes name components and returns an array of objects containing 
 * the formatted email and the pattern label.
 */
function getPatterns(first, mid, last, domain) {
    const f = first[0], l = last[0];
    const m = mid ? mid[0] : '';
    
    let patterns = [
        // Standard Dot & No-Dot
        { p: `${first}.${last}`,   label: "first.last" },   // john.doe 
        { p: `${first}${last}`,    label: "firstlast" },    // johndoe
        { p: `${f}${last}`,        label: "flast" },        // jdoe
        { p: `${f}.${last}`,       label: "f.last" },       // j.doe
        { p: `${first}${l}`,       label: "firstl" },       // johnd
        { p: `${first}.${l}`,      label: "first.l" },      // john.d
        
        // Underscore & Hyphen (Common in Tech/Edu)
        { p: `${first}_${last}`,   label: "first_last" },   // john_doe
        { p: `${first}-${last}`,   label: "first-last" },   // john-doe
        { p: `${f}_${last}`,       label: "f_last" },       // j_doe
        
        // Reversed
        { p: `${last}.${first}`,   label: "last.first" },   // doe.john
        { p: `${last}${f}`,        label: "lastf" },        // doej
        
        // Minimalist
        { p: `${first}`,           label: "first" },        // john
        { p: `${f}${l}`,           label: "fl" },           // jd
    ];

    // Add middle name patterns only if a middle name exists
    if (mid) {
        patterns.push(
            { p: `${first}.${mid}.${last}`,  label: "first.mid.last" },  // john.quincy.doe
            { p: `${first}${mid[0]}${last}`, label: "firstmlast" },      // johnqdoe
            { p: `${f}${m}${last}`,          label: "fmlast" },         // jqd
            { p: `${f}.${m}.${last}`,        label: "f.m.last" },       // j.q.doe
            { p: `${first}${mid}${last}`,    label: "firstmidlast" },   // johnquincydoe
            { p: `${first}_${mid}_${last}`,  label: "first_mid_last" }  // john_quincy_doe
        );
    }

    // Clean formatting, remove whitespace, handle double dots, and attach domain
    return patterns.map(item => {
        const cleanPath = item.p.replace(/\s+/g, '').toLowerCase().replace(/\.\.+/g, '.');
        return { 
            email: `${cleanPath}@${domain}`, 
            label: item.label 
        };
    });
}

// new button persistance 
// --- Enhanced Core Functionality with Progress & Counter ---
generateBtn.addEventListener('click', () => {
    const fn = document.getElementById('firstName').value.trim();
    const mn = document.getElementById('midName').value.trim();
    const ln = document.getElementById('lastName').value.trim();
    let dom = document.getElementById('domain').value.trim().replace('@', '');

    // --- Professional Validation Logic ---
    const inputs = [
        { id: 'firstName', val: fn, label: 'First Name' },
        { id: 'lastName', val: ln, label: 'Last Name' },
        { id: 'domain', val: dom, label: 'Domain' }
    ];

    const missing = inputs.filter(input => !input.val);

    if (missing.length > 0) {
        missing.forEach(input => {
            const el = document.getElementById(input.id);
            if (el) {
                el.classList.add('border-red-500', 'ring-1', 'ring-red-500');
                el.addEventListener('input', () => {
                    el.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
                }, { once: true });
            }
        });
        showToast(`Required fields missing: ${missing.map(m => m.label).join(', ')}`, 'error');
        return; 
    }

    // --- Persistence Setup ---
    // Save exactly what's inside the button (icons, text, etc.)
    const originalContent = generateBtn.innerHTML; 
    
    // UI Elements
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const countDisplay = document.getElementById('resultCount');
    
    // Reset UI
    resultsGrid.innerHTML = '';
    if (countDisplay) countDisplay.classList.add('hidden');
    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '15%'; 
    
    // 1. SET LOADING STATE
    generateBtn.disabled = true;
    generateBtn.innerHTML = `
        <span class="flex items-center justify-center gap-2">
            <div class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Processing...
        </span>`;

    setTimeout(() => {
        if (progressBar) progressBar.style.width = '65%';

        const nameLower = fn.toLowerCase();
        let allData = [];

        // 1. Direct patterns
        allData = [...getPatterns(fn, mn, ln, dom)];

        // 2. Family/Sibling Logic
        let formalName = "";
        let siblingNicknames = [];

        if (nicknames[nameLower]) {
            formalName = nameLower;
            siblingNicknames = nicknames[nameLower];
        } else {
            for (const [key, nicks] of Object.entries(nicknames)) {
                if (nicks.includes(nameLower)) {
                    formalName = key;
                    siblingNicknames = nicks;
                    break;
                }
            }
        }

        if (formalName && formalName !== nameLower) {
            allData = [...allData, ...getPatterns(formalName, mn, ln, dom)];
        }

        // Safety check for .forEach
        if (siblingNicknames) {
            siblingNicknames.forEach(nick => {
                if (nick !== nameLower) {
                    allData = [...allData, ...getPatterns(nick, mn, ln, dom)];
                }
            });
        }

        // 3. Deduplication
        const seen = new Set();
        const uniqueData = allData.filter(item => {
            const isDuplicate = seen.has(item.email);
            seen.add(item.email);
            return !isDuplicate;
        });

        if (progressBar) progressBar.style.width = '100%';

        // Final Render Sequence
        setTimeout(() => {
            renderResults(uniqueData);
            
            if (countDisplay) {
                countDisplay.innerText = `${uniqueData.length} Variations Found`;
                countDisplay.classList.remove('hidden');
            }

            // 2. RESTORE ORIGINAL STATE
            if (progressContainer) progressContainer.classList.add('hidden');
            if (progressBar) progressBar.style.width = '0%';
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalContent; // Restores icons and styling
        }, 400);

    }, 600);
});

function renderResults(data) {
    resultsGrid.innerHTML = '';
    
    // Show action buttons
    copyAllBtn.style.display = 'inline-flex';
    downloadCsvBtn.style.display = 'inline-flex';
    verifyAllBtn.style.display = 'inline-flex';
    
    // Update and show the counter
    const countDisplay = document.getElementById('resultCount');
    if (countDisplay) {
        countDisplay.style.display = 'block'; 
        countDisplay.innerText = `${data.length} Variations Found`;
    }

    data.forEach((item, index) => {
        const card = document.createElement('div');
        
        // Ensure 'email-result-card' is present for the sparkle logic to find the card
        card.className = 'glass-card email-result-card animate-card p-4 rounded-xl flex flex-col justify-between gap-3 border border-slate-200 dark:border-white/5 transition-all duration-300 group';
        
        // Staggered animation delay
        card.style.animationDelay = `${index * 40}ms`;
        
       // Inside renderResults loop
card.innerHTML = `
    <div class="flex justify-between items-start gap-2">
        <span class="text-slate-700 dark:text-white font-medium truncate text-sm" title="${item.email}">
            ${item.email}
        </span>
        <span class="pattern-badge bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 whitespace-nowrap text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
            ${item.label}
        </span>
    </div>
    <div class="flex gap-2">
        <button onclick="copyToClipboard('${item.email}', this)" 
            class="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 p-2 rounded text-[10px] uppercase tracking-wider font-bold text-slate-800 dark:text-white transition-colors">
            Copy
        </button>
        <a href="mailto:${item.email}" 
            class="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 p-2 rounded text-[10px] uppercase tracking-wider font-bold text-center text-slate-800 dark:text-white transition-colors">
            Test
        </a>
        <button onclick="verifyIndividualEmail('${item.email}', this)" 
            class="flex-1 bg-blue-600/10 dark:bg-blue-600/20 hover:bg-blue-600/20 dark:hover:bg-blue-600/40 text-blue-600 dark:text-blue-400 p-2 rounded text-[10px] uppercase tracking-wider font-bold transition-colors">
            Verify
        </button>
    </div>
`;
        resultsGrid.appendChild(card);
    });
}

/**
 * Copies a single email to the clipboard with Sparkle Particles and Glow feedback.
 */
window.copyToClipboard = (text, btn) => {
    navigator.clipboard.writeText(text).then(() => {
        // 1. Trigger the card blink/glow effect
        const card = btn.closest('.email-result-card');
        if (card) {
            card.classList.add('copy-success-blink');
            setTimeout(() => card.classList.remove('copy-success-blink'), 500);
        }

        // 2. Change button text feedback
        const originalText = btn.innerText;
        btn.innerText = "COPIED!";
        btn.classList.add('text-emerald-500');
        
        // 3. Create Sparkle Particles
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle-particle';
            
            // Random direction and spread
            const angle = (i / 8) * Math.PI * 2;
            const velocity = 30 + Math.random() * 40;
            const x = Math.cos(angle) * velocity;
            const y = Math.sin(angle) * velocity;

            // Position sparkle in the center of the button
            sparkle.style.left = `50%`;
            sparkle.style.top = `50%`;
            
            btn.appendChild(sparkle);

            // Animate using Web Animations API (High performance)
            sparkle.animate([
                { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
                { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.2)`, opacity: 0 }
            ], {
                duration: 600,
                easing: 'cubic-bezier(0, .9, .57, 1)'
            });

            // Clean up particle from DOM
            setTimeout(() => sparkle.remove(), 600);
        }

        // 4. Reset button text after delay
        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.remove('text-emerald-500');
        }, 1500);

        // 5. Optional Toast feedback
        showToast("Email copied to clipboard!", "success");
    });
};
/**
 * Copies all generated emails as a newline-separated list.
 */

/**
 * Copies all generated emails with a mass sparkle burst and grid glow.
 */
copyAllBtn.addEventListener('click', () => {
    const emails = Array.from(document.querySelectorAll('#resultsGrid span.truncate')).map(s => s.innerText);
    
    if (emails.length === 0) return;

    navigator.clipboard.writeText(emails.join('\n')).then(() => {
        // 1. Trigger Glow on ALL result cards
        document.querySelectorAll('.email-result-card').forEach(card => {
            card.classList.add('copy-success-blink');
            setTimeout(() => card.classList.remove('copy-success-blink'), 500);
        });

        // 2. Button Feedback Text
        const originalText = copyAllBtn.innerText;
        copyAllBtn.innerText = "ALL COPIED!";
        copyAllBtn.classList.add('text-emerald-500');

        // 3. Create Mass Sparkle Burst (12 particles for a bigger impact)
        for (let i = 0; i < 12; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle-particle';
            
            const angle = (i / 12) * Math.PI * 2;
            const velocity = 50 + Math.random() * 50; // Faster/wider burst
            const x = Math.cos(angle) * velocity;
            const y = Math.sin(angle) * velocity;

            sparkle.style.left = `50%`;
            sparkle.style.top = `50%`;
            
            copyAllBtn.appendChild(sparkle);

            sparkle.animate([
                { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
                { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.5)`, opacity: 0 }
            ], {
                duration: 800,
                easing: 'cubic-bezier(0, .9, .57, 1)'
            });

            setTimeout(() => sparkle.remove(), 800);
        }

        // 4. Reset & Toast
        setTimeout(() => {
            copyAllBtn.innerText = originalText;
            copyAllBtn.classList.remove('text-emerald-500');
        }, 2000);

        showToast(`${emails.length} emails copied!`, "success");
    });
});
/**
 * Generates and downloads a CSV file containing all patterns.
 */
downloadCsvBtn.addEventListener('click', () => {
    const emails = Array.from(document.querySelectorAll('#resultsGrid span.truncate')).map(s => s.innerText);
    const content = "Email\n" + emails.join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email_patterns_${new Date().getTime()}.csv`;
    a.click();
});

// --- Theme Toggle ---
/**
 * Switches between Light and Dark mode using Tailwind classes and custom body styles.
 */
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    document.body.classList.toggle('light');
    
    const isLight = document.body.classList.contains('light');
    document.getElementById('themeIcon').innerText = isLight ? '☀️' : '🌙';
});
//toast 
function showToast(message, type = 'error') {
    const container = document.getElementById('toastContainer');
    if (!container) return; // Safety check
    
    const toast = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-red-600' : 'bg-emerald-600';
    
    toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-card pointer-events-auto transition-all cursor-pointer`;
    toast.innerHTML = `
        <span class="font-bold text-lg">${type === 'error' ? '✕' : '✓'}</span>
        <span class="text-sm font-medium">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
//clear
// --- Clear Functionality ---
const clearBtn = document.getElementById('clearBtn');

clearBtn.addEventListener('click', () => {
    mxStatusArea.classList.add('hidden');
    // 1. Clear all input values
    const fields = ['firstName', 'midName', 'lastName', 'domain'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = '';
            // Remove any error highlights if they exist
            el.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
        }
    });

    // 2. Clear Results and UI state
    resultsGrid.innerHTML = '';
    
    // Hide buttons using the style.display method to match your new show/hide logic
    copyAllBtn.style.display = 'none';
    downloadCsvBtn.style.display = 'none';
    verifyAllBtn.style.display = 'none';
    
    // Consistent hiding for the counter
    const countDisplay = document.getElementById('resultCount');
    if (countDisplay) {
        countDisplay.style.display = 'none'; // Replaces .classList.add('hidden')
    }

    // 3. Feedback
    showToast("Workspace cleared", "success");
});
// --- Keyboard Shortcuts ---
// --- Global Keyboard Event Listener ---
document.addEventListener('keydown', (e) => {
    // Prevent shortcuts if user is holding Ctrl or Alt (avoid browser conflict)
    if (e.ctrlKey || e.altKey) return;

    // Trigger Generate on Enter
    if (e.key === 'Enter') {
        // Only click if the button isn't currently "Processing"
        if (!generateBtn.disabled) {
            e.preventDefault(); // Prevent accidental form submission
            generateBtn.click();
        }
    }

    // Trigger Clear on Escape
    if (e.key === 'Escape') {
        clearBtn.click();
    }
});
//mx logic
const domainInput = document.getElementById('domain');
const verifyBtn = document.getElementById('verifyDomainBtn');
const mxStatusArea = document.getElementById('mxStatusArea');
const mxStatusIcon = document.getElementById('mxStatusIcon');
const mxStatusText = document.getElementById('mxStatusText');

async function checkMX() {
    const domain = domainInput.value.trim().replace('@', '');

    if (!domain || domain.length < 3 || !domain.includes('.')) {
        showToast("Please enter a valid domain to verify", "error");
        return;
    }

    // UI Loading State
    verifyBtn.disabled = true;
    verifyBtn.innerText = "Checking...";
    mxStatusArea.classList.remove('hidden');
    mxStatusText.innerText = "Querying DNS Records...";
    mxStatusText.className = "text-[11px] font-bold uppercase tracking-tight text-blue-500";
    mxStatusIcon.innerHTML = `<div class="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>`;

    try {
        // USE GOOGLE DNS API: Higher compatibility for hosted environments (Vercel/GitHub)
        const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
        
        if (!response.ok) throw new Error("Network response was not ok");
        
        const data = await response.json();

        // Google returns Status 0 for a successful query (NOERROR)
        if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
            // SUCCESS: Domain can receive emails
            mxStatusIcon.innerHTML = `<svg class="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`;
            mxStatusText.innerText = "Valid: Mail Server Active";
            mxStatusText.className = "text-[11px] font-bold uppercase tracking-tight text-emerald-500";
            showToast(`${domain} is ready to receive mail`, 'success');
        } else {
            // FAIL: Domain exists but has no mail server records
            mxStatusIcon.innerHTML = `<svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>`;
            mxStatusText.innerText = "Warning: No Mail Records";
            mxStatusText.className = "text-[11px] font-bold uppercase tracking-tight text-red-500";
            showToast(`No MX records found for ${domain}`, 'error');
        }
    } catch (error) {
        console.error("DNS Error:", error);
        mxStatusArea.classList.add('hidden');
        showToast("DNS Check failed (Check connection)", "error");
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerText = "Verify";
    }
}

// Event Listeners
verifyBtn.addEventListener('click', checkMX);
//mouse movement with glow
document.addEventListener('mousemove', (e) => {
    // Only run in Dark Mode
    if (document.body.classList.contains('light')) return;

    // Update the main ambient glow position
    const mainGlow = document.querySelector('.bg-glow');
    if (mainGlow) {
        mainGlow.style.left = `${e.clientX}px`;
        mainGlow.style.top = `${e.clientY}px`;
    }

    // Create the "Golden Smoke" trail
    createSmokeParticle(e.clientX, e.clientY);
});


function createSmokeParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'smoke-particle';
    document.body.appendChild(particle);

    const destinationX = (Math.random() - 0.5) * 60;
    const destinationY = -Math.random() * 100;

    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    particle.animate([
        { 
            // STARTING STATE
            transform: 'translate(-50%, -50%) scale(1)', 
            opacity: 1,
            filter: 'blur(2px) brightness(1)'
        },
        { 
            // ENDING STATE (Add the code here)
            transform: `translate(calc(-50% + ${destinationX}px), calc(-50% + ${destinationY}px)) scale(0) rotate(180deg)`, 
            opacity: 0,
            filter: 'blur(8px) brightness(2)' 
        }
    ], {
        duration: 800 + Math.random() * 1000,
        easing: 'cubic-bezier(0, .9, .57, 1)'
    }).onfinish = () => particle.remove();
}
// verify email
// Reference to the new Global button
const verifyAllBtn = document.getElementById('verifyAllBtn');

// Individual Verification
// Updated Individual Verification with Real API Integration
// Optimized Individual Verification for Verifalia Responses
async function verifyIndividualEmail(email, btn) {
    // 1. Setup UI state
    const originalContent = btn.innerHTML;
    const card = btn.closest('.email-result-card');
    
    btn.disabled = true;
    // Spinner matches current text color
    btn.innerHTML = `<div class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto"></div>`;

    try {
        // 2. Call your local API route
        const response = await fetch(`/api/verify?email=${encodeURIComponent(email)}`);
        
        if (!response.ok) throw new Error('API Error');

        const data = await response.json();
        
        // 3. Clean up existing Tailwind color classes
        btn.classList.remove(
            'text-blue-600', 'dark:text-blue-400', 
            'text-emerald-500', 'text-amber-500', 'text-red-500',
            'bg-blue-600/10', 'dark:bg-blue-600/20'
        );

        /**
         * 4. Verifalia Logic Mapping:
         * - 'Success' -> Green (Valid)
         * - 'CatchAll' -> Amber (Risky)
         * - Others -> Red (Invalid)
         */
        if (data.status === 'Success') {
            btn.innerText = "Valid";
            btn.classList.add('text-emerald-500');
            if (card) card.style.borderColor = '#10b981'; // Emerald Green
        } 
        else if (data.status === 'CatchAll') {
            btn.innerText = "Risky";
            btn.classList.add('text-amber-500');
            if (card) card.style.borderColor = '#f59e0b'; // Amber/Orange
        } 
        else {
            btn.innerText = "Invalid";
            btn.classList.add('text-red-500');
            if (card) card.style.borderColor = '#ef4444'; // Red
        }

    } catch (err) {
        console.error("Verification failed:", err);
        showToast("Verification failed", "error");
        
        // Restore button if it fails
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}

// Bulk Verification Logic
verifyAllBtn.addEventListener('click', async () => {
    const buttons = document.querySelectorAll('.email-result-card button[onclick*="verifyIndividualEmail"]');
    if (buttons.length === 0) return;

    verifyAllBtn.disabled = true;
    verifyAllBtn.innerText = "Verifying All...";

    // Process in sequence or chunks to avoid rate limits
    for (const btn of buttons) {
        const email = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
        await verifyIndividualEmail(email, btn);
    }

    verifyAllBtn.disabled = false;
    verifyAllBtn.innerText = "Verify All";
    showToast("Bulk verification complete", "success");
});

