// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { supabaseClient } from "../_shared/supabase-client.ts";

serve(async (req: Request) => {
  const { sendId } = await req.json();

  try {
    const { data } = await supabaseClient.storage.from("sends").list(sendId);
    console.log(data);
    if (!data?.length) {
      return new Response(undefined, {
        headers: { "Content-Type": "application/json" },
        status: 204,
      });
    }
    const fileNames = data.map((file) => `${sendId}/${file.name}`);
    await supabaseClient.storage.from("sends").remove(fileNames);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs' \
//   --header 'Content-Type: application/json' \
//   --data '{"sendId":"QyHfcwnrbrqM5wcINJjfP"}'
