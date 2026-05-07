import { useEffect, useState } from "react";

import { getCompanionTrust } from "../utils/companionTrustStorage";
import "./UserTrustBadge.css";

export default function UserTrustBadge({ email, compact = false }) {
  const [trust, setTrust] = useState(() => getCompanionTrust(email));

  useEffect(() => {
    const sync = () => setTrust(getCompanionTrust(email));

    sync();
    window.addEventListener("companion-trust-changed", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("companion-trust-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, [email]);

  if (!email) return null;

  return (
    <span className={`user-trust-badge ${compact ? "compact" : ""}`} title={trust.label}>
      유목민 {trust.score}
      {!compact && trust.count > 0 ? <span> · 평가 {trust.count}</span> : null}
    </span>
  );
}
