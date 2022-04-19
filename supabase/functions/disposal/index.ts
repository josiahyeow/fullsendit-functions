// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { parseISO, isBefore, addHours } from "https://esm.sh/date-fns";
import { flatten } from "https://esm.sh/ramda";
import { supabaseClient } from "../_shared/supabase-client.ts";

type FileObject = {
  name: string;
  created_at: string;
  path: string;
};

serve(async () => {
  try {
    const { data: folders } = await supabaseClient.storage.from("sends").list();
    const folderNames = folders?.map(({ name }) => name);
    if (!folderNames) {
      return new Response(undefined, {
        headers: { "Content-Type": "application/json" },
        status: 204,
      });
    }
    const allFiles: FileObject[] = flatten(
      await Promise.all(
        folderNames.map((folderName) => getFilesForFolder(folderName))
      )
    );
    const expiredFiles: FileObject[] = allFiles.filter((file) =>
      isBefore(parseISO(file.created_at, {}), addHours(new Date(), -24))
    );
    console.log(`Deleting ${expiredFiles.length}/${allFiles.length} files`);
    if (!expiredFiles?.length) {
      return new Response(undefined, {
        headers: { "Content-Type": "application/json" },
        status: 204,
      });
    }
    await supabaseClient.storage
      .from("sends")
      .remove(expiredFiles.map(({ path }) => path));
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

async function getFilesForFolder(folderName: string) {
  const { data } = await supabaseClient.storage.from("sends").list(folderName);
  return data?.map((file) => ({
    path: `${folderName}/${file.name}`,
    ...file,
  }));
}

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs' \
//   --header 'Content-Type: application/json' \
//   --data '{"sendId":"QyHfcwnrbrqM5wcINJjfP"}'
