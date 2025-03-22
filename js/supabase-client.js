// Supabase client for leaderboard functionality
let supabase;

// Initialize Supabase client
function initSupabase(supabaseUrl, supabaseKey) {
  // First, check if the supabaseClient is directly available
  if (typeof supabaseClient !== 'undefined') {
    try {
      supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client initialized using supabaseClient');
      return true;
    } catch (error) {
      console.error('Failed to initialize Supabase using supabaseClient:', error);
    }
  }
  
  // If that failed, try using window.supabase
  if (typeof window.supabase !== 'undefined') {
    try {
      supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client initialized using window.supabase');
      return true;
    } catch (error) {
      console.error('Failed to initialize Supabase using window.supabase:', error);
    }
  }
  
  // As a last resort, try accessing the library directly
  if (typeof createClient !== 'undefined') {
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client initialized using createClient');
      return true;
    } catch (error) {
      console.error('Failed to initialize Supabase using createClient:', error);
    }
  }
  
  console.error('All initialization methods failed. Supabase client not available.');
  return false;
}

// Submit a score to the leaderboard
async function submitScore(email, score, level, playerName = null) {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return { success: false, error: 'Supabase client not initialized' };
  }
  
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .insert([
        { 
          email: email, 
          score: score, 
          level_reached: level,
          player_name: playerName 
        }
      ]);
      
    if (error) throw error;
    
    console.log('Score submitted successfully');
    return { success: true, data };
  } catch (error) {
    console.error('Error submitting score:', error);
    return { success: false, error: error.message };
  }
}

// Get top scores for the leaderboard
async function getTopScores(limit = 10) {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return { success: false, error: 'Supabase client not initialized' };
  }
  
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    console.log('Leaderboard fetched successfully');
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return { success: false, error: error.message };
  }
}

// Get player's rank on the leaderboard
async function getPlayerRank(email) {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return { success: false, error: 'Supabase client not initialized' };
  }
  
  try {
    // First, get all scores ordered by score descending
    const { data, error } = await supabase
      .from('leaderboard')
      .select('id, email, score')
      .order('score', { ascending: false });
      
    if (error) throw error;
    
    // Find the position of the player's email
    const playerIndex = data.findIndex(entry => entry.email === email);
    const rank = playerIndex !== -1 ? playerIndex + 1 : null;
    
    return { 
      success: true, 
      rank,
      total: data.length
    };
  } catch (error) {
    console.error('Error getting player rank:', error);
    return { success: false, error: error.message };
  }
} 