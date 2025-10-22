import React, { useState } from "react";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    const backendUrl =
      process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

    try {
      const response = await fetch(`${backendUrl}/enrich`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "An unknown error occurred."
        );
      }

      setSuccessMessage(
        data.message || "Profile enriched and notification sent!"
      );
      setEmail(""); 
    } catch (error) {
      setErrorMessage(error.message);
      console.error("Enrichment failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="enrichment-container">
        <h2>🧠 De-anonymization Platform</h2>
        <p className="subtitle">
          Enter an email address to enrich the profile. You will receive a
          detailed PDF report at the email address you enter.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter visitor's email"
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Enriching...
              </>
            ) : (
              "Enrich Profile"
            )}
          </button>
        </form>

        {/* We use a key on the message divs. This tells React to treat
          them as new elements when the message changes,
          which re-triggers our CSS fade-in animation.
        */}
        {successMessage && (
          <p key={successMessage} className="message success-message">
            {successMessage}
          </p>
        )}
        {errorMessage && (
          <p key={errorMessage} className="message error-message">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;