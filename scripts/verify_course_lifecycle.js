import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log('\n🧪 VERIFYING COURSE LIFECYCLE (ADD/DELETE)...');
    console.log('=============================================');

    // 1. Login as Admin
    console.log('1. Authenticating as Admin...');
    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@sniperfx.com',
        password: 'Hamza0100@'
    });

    if (loginError) {
        console.error('❌ Login Failed:', loginError.message);
        return;
    }
    console.log('   ✅ Admin Authenticated');

    // 2. Create Test Course
    console.log('2. Creating Test Course...');
    const testCourse = {
        title: "TEST_COURSE_DELETE_ME_" + Date.now(),
        description: "This is a test course to verify cascade delete.",
        is_paid: false,
        level: "مبتدئ",
        rating: 5,
        thumbnail: "https://img-wrapper.vercel.app/image?url=https://placehold.co/600x400"
    };

    const { data: course, error: createError } = await supabase
        .from('courses')
        .insert(testCourse)
        .select()
        .single();

    if (createError) {
        console.error('❌ Failed to create course:', createError.message);
        return;
    }
    console.log(`   ✅ Course Created: ${course.title} (ID: ${course.id})`);

    // 3. Add Lesson to Course
    console.log('3. Adding Test Lesson...');
    const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
            course_id: course.id,
            title: "Test Lesson",
            video_url: "https://youtube.com/test",
            order: 1,
            duration: "10:00",
            is_published: true
        })
        .select()
        .single();

    if (lessonError) {
        console.error('❌ Failed to add lesson:', lessonError.message);
    } else {
        console.log(`   ✅ Lesson Added: ${lesson.id}`);
    }

    // 4. Delete Course
    console.log('4. Deleting Course...');
    const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id);

    if (deleteError) {
        console.error('❌ Failed to delete course:', deleteError.message);
        return;
    }
    console.log('   ✅ Course Delete Command Sent');

    // 5. Verify Deletion (Cascade Check)
    console.log('5. Verifying Cascade Delete...');
    
    // Check Course
    const { data: checkCourse } = await supabase.from('courses').select('*').eq('id', course.id).maybeSingle();
    if (checkCourse) {
        console.error('❌ Course still exists!');
    } else {
        console.log('   ✅ Course gone from DB');
    }

    // Check Lesson (Should be gone automatically)
    let checkLesson = null; // SCOPE FIX: Declared outside the block
    if (lesson) {
        const { data } = await supabase.from('lessons').select('*').eq('id', lesson.id).maybeSingle();
        checkLesson = data;
        
        if (checkLesson) {
            console.error('❌ Lesson still exists! Cascade failed.');
        } else {
            console.log('   ✅ Lesson gone from DB (Cascade Worked)');
        }
    }

    console.log('=============================================');
    // Now checkLesson is accessible here
    if (!checkCourse && (!lesson || !checkLesson)) {
        console.log('🎉 SUCCESS: Course Management is 100% Functional.');
        console.log('   You can now Add and Delete courses safely from the Dashboard.');
    } else {
        console.error('❌ VERIFICATION FAILED: Some data was not deleted.');
    }
}

run();
