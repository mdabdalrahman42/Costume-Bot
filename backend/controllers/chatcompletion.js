const {OpenAI} = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function generateResponse(message) {
    try{
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {role: "system", content: "You are a costume designer bot need to suggest style for the individual based on the description"},
                {role: "user", content: message},
            ],

        });
        return response.choices[0].message.content;
    } catch (err){
        console.error("Error in OpenAI call: ", err.message);
        throw new Error("Failed to generate response");
    }

}

module.exports = {generateResponse};