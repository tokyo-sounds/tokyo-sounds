/**
 * Tokyo Page
 * Server Component that reads environment variables and passes them to client component
 */

import TokyoClient from "./TokyoClient";

export default function TokyoPage() {
  const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY || "";
  const lyriaApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

  return <TokyoClient mapsApiKey={mapsApiKey} lyriaApiKey={lyriaApiKey} />;
}
