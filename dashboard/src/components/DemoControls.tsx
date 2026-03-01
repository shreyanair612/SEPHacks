interface Props {
  currentScenario: string;
  onTrigger: (scenario: string) => void;
}

export default function DemoControls({ currentScenario, onTrigger }: Props) {
  return (
    <div className="demo-controls">
      <span className="demo-label">DEMO</span>
      <button
        className={`demo-btn demo-compliant ${currentScenario === "compliant" ? "demo-active" : ""}`}
        onClick={() => onTrigger("compliant")}
      >
        Compliant
      </button>
      <button
        className={`demo-btn demo-critical ${currentScenario === "critical" ? "demo-active" : ""}`}
        onClick={() => onTrigger("critical")}
      >
        Trigger Drift
      </button>
    </div>
  );
}
