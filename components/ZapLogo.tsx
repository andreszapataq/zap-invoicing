export function ZapLogo({ size = 48 }: { size?: number }) {
  return (
    <img
      src="/zap-logo.svg"
      alt="ZAP Blinds Solutions"
      style={{ height: size, width: "auto" }}
      className="block select-none"
    />
  );
}
