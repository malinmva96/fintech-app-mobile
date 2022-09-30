// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@^1.33.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey",
};

const client = createClient(
  Deno.env.get("SUPABASE_URL")!!,
  Deno.env.get("SUPABASE_ANON_KEY")!!
);

async function callApi(path: string) {
  return await fetch(`https://min-api.cryptocompare.com${path}`, {
    method: "GET",
    headers: {
      Authorization:
        "Apikey f04285287932aa9c1fcdcc2b02f8bfc7245c21f07f696a92c91bc25cab222ec8",
    },
  }).then((res) => res.json());
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { data: symbols } = await client.from("Symbol").select();
  if (symbols == null) throw new Error("symbols == null");

  if (symbols.some((symbol) => !symbol.initialized)) {
    await Promise.all(
      symbols
        .filter((symbol) => !symbol.initialized)
        .map(async (symbol) => {
          const apiResponse = await callApi(
            `/data/all/coinlist?fsym=${symbol.id}`
          );
          const updatedData = {
            initialized: true,
            name: apiResponse.Data[symbol.id].CoinName,
            image: `https://www.cryptocompare.com${
              apiResponse.Data[symbol.id].ImageUrl
            }`,
            description: apiResponse.Data[symbol.id].Description,
          };
          await client
            .from("Symbol")
            .update({ ...updatedData })
            .match({ id: symbol.id });
          Object.assign(symbol, updatedData);
        })
    );
  }

  const reqBody = await req.json();

  if (reqBody.symbol && symbols.find((symbol) => symbol.id == reqBody.symbol)) {
    const basicApiResponse = await callApi(
      `/data/price?tsyms=USD&fsym=${reqBody.symbol}`
    );

    const historyApiResponse = await callApi(
      `/data/v2/histominute?fsym=${reqBody.symbol}&tsym=USD&limit=60`
    );

    return new Response(
      JSON.stringify({
        id: reqBody.symbol,
        price: basicApiResponse.USD,
        image: symbols.find((symbol) => symbol.id == reqBody.symbol).image,
        name: symbols.find((symbol) => symbol.id == reqBody.symbol).name,
        description: symbols.find((symbol) => symbol.id == reqBody.symbol)
          .description,
        history: historyApiResponse.Data.Data.map(
          (item: { [key: string]: any }) => item.close
        ),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const filteredSymbols = symbols.filter(
    (symbol) =>
      reqBody.symbols === undefined || reqBody.symbols.includes(symbol.id)
  );

  if (filteredSymbols.length) {
    const apiResponse = await callApi(
      `/data/pricemulti?tsyms=USD&fsyms=${filteredSymbols
        .map((symbol) => symbol.id)
        .join(",")}`
    );

    return new Response(
      JSON.stringify(
        Object.keys(apiResponse).map((key) => ({
          id: key,
          price: apiResponse[key].USD,
          image: filteredSymbols.find((symbol) => symbol.id == key).image,
        }))
      ),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify([]), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
