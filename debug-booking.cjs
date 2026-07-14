/**
 * USAGE:
 *   node debug-booking.cjs <JWT_TOKEN> <patient_id> <specialist_id>
 *
 * HOW TO GET YOUR JWT TOKEN:
 *   1. Open the app in Chrome, login as a patient
 *   2. Open DevTools → Application → Local Storage → select your site
 *   3. Copy the value of the "token" key
 *   4. Run: node debug-booking.cjs <that_token> <your_user_id> <specialist_id>
 *
 * HOW TO GET YOUR USER ID:
 *   In DevTools → Console, type: JSON.parse(localStorage.getItem('user'))
 *   or check the Redux store in DevTools → Redux tab
 */

const axios = require('axios');

const API_BASE = 'https://mental-health-api-rke4.onrender.com/api/v1';
const API_KEY  = 'ygXk1R15vil+RD9Ix5c4cUPqND5i7+M3NRsEmxByDL8=';

const TOKEN   = process.argv[2];
const PAT_ID  = process.argv[3];
const PROF_ID = process.argv[4];

if (!TOKEN) {
    console.error('\n❌ Please provide a JWT token as the first argument.');
    console.error('   Example: node debug-booking.cjs eyJhbGciO... 9 4\n');
    process.exit(1);
}

async function tryBook(payload, label) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📤 [${label}]`);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    try {
        const res = await axios.post(`${API_BASE}/resource/consults`, payload, {
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                'x-api-key': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ SUCCESS [${res.status}]:`, JSON.stringify(res.data, null, 2));
        return true;
    } catch (err) {
        console.error(`❌ FAILED [status=${err.response?.status}]:`, JSON.stringify(err.response?.data, null, 2));
        return false;
    }
}

async function getMe(token) {
    try {
        const res = await axios.get(`${API_BASE}/users/me`, {
            headers: { Authorization: `Bearer ${token}`, 'x-api-key': API_KEY }
        });
        return res.data?.data || res.data;
    } catch (err) {
        console.warn('⚠️  Could not fetch /users/me:', err.response?.data?.message || err.message);
        return null;
    }
}

async function getSpecialists(token) {
    const endpoints = [
        'specialists/directory',
        'users?role=psychiatrist&limit=5',
        'users?role=psychologist&limit=5'
    ];
    for (const ep of endpoints) {
        try {
            const res = await axios.get(`${API_BASE}/${ep}`, {
                headers: { Authorization: `Bearer ${token}`, 'x-api-key': API_KEY }
            });
            const d = res.data?.data || res.data;
            const arr = Array.isArray(d) ? d : (d?.masters || d?.data || d?.users || []);
            if (arr.length > 0) {
                console.log(`✅ Specialists via /${ep}: ${arr.length} found`);
                arr.slice(0, 3).forEach(s => {
                    console.log(`   id=${s.userId || s._id || s.id} | ${s.firstName} ${s.lastName} | role=${s.role}`);
                });
                return arr;
            }
        } catch { /* try next */ }
    }
    return [];
}

async function run() {
    console.log('\n=== 🔬 Appointment Booking Diagnostics ===\n');

    // Auto-resolve patient ID from /users/me if not provided
    let patId  = PAT_ID;
    let profId = PROF_ID;

    const me = await getMe(TOKEN);
    if (me) {
        console.log('✅ /users/me →', JSON.stringify({ 
            id: me.id, userId: me.userId, _id: me._id,
            name: `${me.firstName} ${me.lastName}`, role: me.role 
        }, null, 2));
        if (!patId) patId = me.userId || me._id || me.id;
    }

    if (!profId) {
        const specs = await getSpecialists(TOKEN);
        if (specs.length > 0) {
            profId = specs[0].userId || specs[0]._id || specs[0].id;
        }
    }

    if (!patId || !profId) {
        console.error('\n❌ Cannot determine patId or profId. Pass them as arguments:');
        console.error('   node debug-booking.cjs <token> <pat_id> <prof_id>\n');
        return;
    }

    const futureAt = new Date(Date.now() + 25 * 3600 * 1000).toISOString();
    console.log(`\n🔑 patId=${patId}  profId=${profId}`);
    console.log(`📅 scheduled_at=${futureAt}`);

    // ── Variant A: ref_number as Number ──────────────────────────────────────
    const ok_A = await tryBook({
        scheduled_at: futureAt,
        reason: 'Debug Test A',
        consult_type: 'virtual',
        participants: [
            { participant_type: { code: 'professional' }, ref_number: Number(profId) },
            { participant_type: { code: 'patient' },      ref_number: Number(patId)  }
        ],
        additional_info: { notes: 'debug', referred_by: 'Self' }
    }, 'A — ref_number=Number');
    if (ok_A) return;

    // ── Variant B: ref_number as String ──────────────────────────────────────
    const ok_B = await tryBook({
        scheduled_at: futureAt,
        reason: 'Debug Test B',
        consult_type: 'virtual',
        participants: [
            { participant_type: { code: 'professional' }, ref_number: String(profId) },
            { participant_type: { code: 'patient' },      ref_number: String(patId)  }
        ],
        additional_info: { notes: 'debug', referred_by: 'Self' }
    }, 'B — ref_number=String');
    if (ok_B) return;

    // ── Variant C: No additional_info ────────────────────────────────────────
    const ok_C = await tryBook({
        scheduled_at: futureAt,
        reason: 'Debug Test C',
        consult_type: 'virtual',
        participants: [
            { participant_type: { code: 'professional' }, ref_number: Number(profId) },
            { participant_type: { code: 'patient' },      ref_number: Number(patId)  }
        ]
    }, 'C — no additional_info');
    if (ok_C) return;

    // ── Variant D: Different participant_type format ──────────────────────────
    const ok_D = await tryBook({
        scheduled_at: futureAt,
        reason: 'Debug Test D',
        consult_type: 'virtual',
        participants: [
            { participant_type: 'professional', ref_number: Number(profId) },
            { participant_type: 'patient',      ref_number: Number(patId)  }
        ],
        additional_info: { notes: 'debug', referred_by: 'Self' }
    }, 'D — participant_type as string');
    if (ok_D) return;

    // ── Variant E: professional_id / patient_id top-level ────────────────────
    await tryBook({
        scheduled_at: futureAt,
        reason: 'Debug Test E',
        consult_type: 'virtual',
        professional_id: Number(profId),
        patient_id: Number(patId),
        additional_info: { notes: 'debug', referred_by: 'Self' }
    }, 'E — top-level professional_id/patient_id (no participants array)');

    console.log('\n=== All variants exhausted — check ❌ error messages above ===\n');
}

run();
