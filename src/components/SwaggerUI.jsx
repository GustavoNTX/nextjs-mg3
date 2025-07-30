"use client";
import dynamic from "next/dynamic";

const SwaggerUI = dynamic(async() => await import("swagger-ui-react"), {
  ssr: false,
  loading: () => <p>Carregando documentação...</p>,
});

export default function SwaggerUIWrapper() {
  return <SwaggerUI url="/api/docs" />;
}
