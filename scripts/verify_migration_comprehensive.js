// verify_migration_comprehensive.js (Node.js version using native fetch)

const SUPABASE_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co';
// Using the "sb_publishable_..." key found in previous working scripts
const SUPABASE_ANON_KEY = 'sb_publishable_Lig8VlcMiSf6pgcxPK8HZw_L57kxIZ9';
const EMAIL = 'aryamoy03@gmail.com';
const PASSWORD = 'TemporaryPassword123!';

async function runTests() {
    console.log('Starting Comprehensive Migration Verification (Fetch Mode)...');

    // 1. Authenticate (REST)
    console.log('Authenticating...');
    const authResp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });

    if (!authResp.ok) {
        console.error('Auth failed:', authResp.status, await authResp.text());
        return;
    }

    const authData = await authResp.json();
    const token = authData.access_token;
    console.log('Authenticated successfully.');

    // Helper (Standard JSON)
    const invokeFunction = async (name, body) => {
        console.log(`\nTesting ${name}...`);
        const start = Date.now();
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const duration = Date.now() - start;
            if (!response.ok) {
                let errorText = await response.text();
                console.error(`FAILED ${name} (${duration}ms): ${response.status} - ${errorText}`);
                return null;
            }

            const data = await response.json();
            console.log(`SUCCESS ${name} (${duration}ms)`);
            if (data.choices && data.choices[0] && data.choices[0].message) {
                console.log(`[${name} OUTPUT]:`, data.choices[0].message.content.substring(0, 2000));
            } else if (data.feedback) {
                console.log(`[${name} OUTPUT]:`, JSON.stringify(data, null, 2));
            } else {
                console.log(`[${name} OUTPUT]:`, JSON.stringify(data).substring(0, 500));
            }
            return data;
        } catch (e) {
            console.error(`ERROR calling ${name}:`, e);
            return null;
        }
    };

    // Helper for Streaming Functions
    const invokeStreamFunction = async (name, body) => {
        console.log(`\nTesting ${name} (Streaming)...`);
        const start = Date.now();
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const duration = Date.now() - start;
            if (!response.ok) {
                let errorText = await response.text();
                console.error(`FAILED ${name} (${duration}ms): ${response.status} - ${errorText}`);
                return null;
            }

            const text = await response.text();
            console.log(`SUCCESS ${name} (${duration}ms) - Length: ${text.length}`);
            if (text.length > 0) console.log('Preview:', text.substring(0, 100).replace(/\n/g, '\\n') + '...');
            return text;
        } catch (e) {
            console.error(`ERROR calling ${name}:`, e);
            return null;
        }
    };

    // Test 1: Flashcards (Generator)
    await invokeFunction('generate-flashcards', {
        topic: 'Photosynthesis',
        amount: 3
    });

    // Test 2: Nexus Assessment (Generator)
    await invokeFunction('nexus-assessment-generator', {
        assessmentType: 'Quiz',
        subject: 'History',
        title: 'WWII',
        gradeLevel: '10',
        topic: 'Causes of WWII',
        numQuestions: 3,
        totalMarks: 10,
        curriculum: 'General'
    });

    // Test 3: Grade Assessment (JSON Output)
    await invokeFunction('grade-assessment', {
        assessmentType: 'Quiz',
        totalMarks: 10,
        questions: '1. What matches A? (A=1)',
        answers: '1. A matches 1'
    });

    // Test 4: Teacher Assistant (JSON)
    await invokeFunction('teacher-assistant', {
        messages: [{ role: 'user', content: 'What are my pods?' }]
    });

    // Test 5: Phoenix Text Chat (JSON with Whiteboard)
    await invokeFunction('phoenix-text-chat', {
        messages: [{ role: 'user', content: 'Graph y=x^2' }],
        includeWhiteboardActions: true
    });

    // Test 6: Nexus Curriculum (Streaming)
    await invokeStreamFunction('nexus-curriculum-generator', {
        subject: 'Math',
        gradeLevel: '9',
        duration: '2 weeks',
        learningGoals: 'Algebra basics'
    });

    // Test 7: Nexus Lesson (Streaming)
    await invokeStreamFunction('nexus-lesson-generator', {
        subject: 'Math',
        curriculum: 'Standard',
        gradeLevel: '9',
        duration: '1 hour',
        topic: 'Algebra'
    });

    // Test 8: Smart Assistant (Streaming)
    await invokeStreamFunction('smart-assistant', {
        messages: [{ role: 'user', content: 'Help me study.' }]
    });

    // Learnspace-chat is deleted, skipping.
}

runTests();
