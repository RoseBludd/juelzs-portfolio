const { config } = require('dotenv');
config();

async function testOpenAI() {
  console.log('🔍 Testing OpenAI API Connection...\n');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ OPENAI_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ OpenAI API key found in environment');
  console.log(`   Key preview: ${apiKey.substring(0, 20)}...`);
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI API connection successful');
      console.log(`   Available models: ${data.data.length}`);
      console.log(`   Sample models: ${data.data.slice(0, 3).map(m => m.id).join(', ')}`);
    } else {
      console.log('❌ OpenAI API connection failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${response.statusText}`);
      
      const errorData = await response.text();
      console.log(`   Error: ${errorData}`);
    }
  } catch (error) {
    console.log('❌ OpenAI API test failed with error:');
    console.log(`   ${error.message}`);
  }
}

testOpenAI().catch(console.error); 